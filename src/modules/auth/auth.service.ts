import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { UserRole } from '../users/user.entity';
import { Session as SessionEntity } from '../sessions/session.entity';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import * as bcrypt from 'bcrypt';

// Internal types

interface TokensDto {
    userId: number;
    email: string;
    role: UserRole;
}

interface SessionDto {
    userId: number;
    refreshToken: string;
}

@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService, // private - only inside class, protected - iinside class and inheritance, public - everywhere or if not setted
        private sessionsService: SessionsService,
        private jwtService: JwtService,
    ) {}

    // Main Methods

    async register({ name, email, password }: RegisterDto) {
        // Checking for user exist
        let user = await this.usersService.findByEmail(email)

        if(user) {
            throw new ConflictException('User with this email already exists.')
        }

        // Creating user
        user = await this.usersService.create({ name, email, password })

        // Generating tokens
        const { accessToken, refreshToken } = await this.generateTokens({ userId: user.id, email: user.email, role: user.userRole })

        // Saving session
        await this.saveSession({ userId: user.id, refreshToken })
    
        return { accessToken, refreshToken }
    }

    async login({ email, password }: LoginDto) {
        // Checking for user exist
        const user = await this.usersService.findByEmail(email)

        if(!user) {
            throw new UnauthorizedException('Invalid email or password.')
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password)

        if(!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password.')
        }

        // Generating tokens
        const { accessToken, refreshToken } = await this.generateTokens({ userId: user.id, email: user.email, role: user.userRole })

        // Saving session
        await this.saveSession({ userId: user.id, refreshToken })

        return {
            message: 'Login successful.',
            accessToken,
            refreshToken
        }
    }

    async logout( userId: number ): Promise<void> {
        await this.sessionsService.deleteByUserId(userId)
    }

    // Other methods

    private async generateTokens({ userId, email, role }: TokensDto) {
        const accessToken = this.jwtService.sign(
            { userId, email, role }, // Data that wtires to token
            { expiresIn: '15m' }
        )

        const refreshToken = this.jwtService.sign(
            { userId }, // Data that wtires to token
            { expiresIn: '30d' }
        )

        return { accessToken, refreshToken }
    }

    async me(userId: number) {
        const user = await this.usersService.findOne(userId)

        if(!user) {
            throw new UnauthorizedException('User not found.')
        }

        return user
    }

    async refresh(userId: number, refreshToken: string) {

        // Find all user sessions
        const sessions = await this.sessionsService.findAllByUserId(userId)

        if(!sessions.length) {
            throw new UnauthorizedException('Session not found.')
        }

        // Find current session by refresh token
        let currentSession: SessionEntity | null = null
        for (const session of sessions) {
            const isValid = await bcrypt.compare(refreshToken, session.refreshToken)
            if(isValid) {
                currentSession = session
                break
            }
        }

        if(!currentSession) {
            throw new UnauthorizedException('Invalid refresh token.')
        }

        // Get user
        const user = await this.usersService.findOne(currentSession.userId)

        if(!user) {
            throw new UnauthorizedException('User not found.')
        }

        // Delete current session
        await this.sessionsService.deleteById(currentSession.id)

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens({
            userId: user.id,
            email: user.email,
            role: user.userRole
        })

        // Save new session
        await this.saveSession({ userId: user.id, refreshToken: newRefreshToken })

        return { accessToken, refreshToken: newRefreshToken }

    }

    private async saveSession({ userId, refreshToken }: SessionDto) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)

        await this.sessionsService.create({
            userId,
            refreshToken: hashedRefreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })          
    }

}



