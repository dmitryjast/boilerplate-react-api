import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { UserRole } from '../users/user.entity';

import * as bcryot from 'bcrypt';

// Interfaces (types for methods)

interface TokensDto {
    userId: number;
    email: string;
    role: UserRole;
}

interface RegisterDto {
    name: string;
    email: string;
    password: string;
}

@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService, // private - only inside class, protected - iinside class and inheritance, public - everywhere or if not setted
        private sessionsService: SessionsService,
        private jwtService: JwtService,
    ) {}

    // Methods

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

    async register({ name, email, password }: RegisterDto) {

        // Checking for user exist
        const existingUser = await this.usersService.findByEmail(email)

        if(existingUser) {
            throw new ConflictException('User with this email already exists.')
        }

        // Creating user
        const user = await this.usersService.create({ name, email, password })

        // Generating tokens
        const { accessToken, refreshToken } = await this.generateTokens({ userId: user.id, email: user.email, role: user.userRole })

        // Hashing refresh token
        const hashedRefreshToken = await bcryot.hash(refreshToken, 10)

        // Saving session
        await this.sessionsService.create({
            userId: user.id,
            refreshToken: hashedRefreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
    
        // Generating tokens
        return { accessToken, refreshToken }

    }

}



