import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { PasswordResetsService } from './password-resets/password-resets.service';
import { MailService } from '../mail/mail.service';
import { EmailVerificationService } from './email-verification/email-verification.service';
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
        private usersService: UsersService,
        private sessionsService: SessionsService,
        private jwtService: JwtService,
        private passwordResetsService: PasswordResetsService,
        private mailService: MailService,
        private emailVerificationService: EmailVerificationService,
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

        // Send verification email
        await this.sendVerificationEmail(user.id, user.email, user.name)
    
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

    async logout(userId: number): Promise<void> {
        await this.sessionsService.deleteByUserId(userId)
    }

    async forgotPassword(email: string) {
        // Find user
        const user = await this.usersService.findByEmail(email)

        if(!user) {
            return { message: 'If this email exists, you will receive a reset link.' }
        }

        // Create reset token
        const token = await this.passwordResetsService.create(user.id)

        // Build reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&userId=${user.id}`

        // Send email
        await this.mailService.sendPasswordReset(user.email, user.name, resetUrl)

        return { message: 'If this email exists, you will receive a reset link.' }
    }

    async resetPassword(userId: number, token: string, newPassword: string) {
        // Find reset token
        const passwordReset = await this.passwordResetsService.findByUserId(userId)

        if(!passwordReset) {
            throw new UnauthorizedException('Invalid or expired reset token.')
        }

        // Check if token expired
        if(new Date() > passwordReset.expiresAt) {
            await this.passwordResetsService.deleteByUserId(userId)
            throw new UnauthorizedException('Reset token has expired.')
        }

        // Verify token
        const isTokenValid = await bcrypt.compare(token, passwordReset.token)

        if(!isTokenValid) {
            throw new UnauthorizedException('Invalid or expired reset token.')
        }

        // Update password
        await this.usersService.updatePassword(userId, newPassword)

        // Delete used token
        await this.passwordResetsService.deleteByUserId(userId)

        return { message: 'Password successfully reset.' }
    }

    async sendVerificationEmail(userId: number, email: string, name: string): Promise<void> {
        const method = process.env.EMAIL_VERIFICATION_METHOD

        if(method === 'code') {
            const code = await this.emailVerificationService.createCode(userId)
            await this.mailService.sendVerificationCode(email, name, code)
        } else {
            const token = await this.emailVerificationService.createToken(userId)
            const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&userId=${userId}`
            await this.mailService.sendVerificationLink(email, name, verifyUrl)
        }
    }

    async verifyEmail(userId: number, tokenOrCode: string) {
        const verification = await this.emailVerificationService.findByUserId(userId)

        if(!verification) {
            throw new UnauthorizedException('Verification not found.')
        }

        const method = process.env.EMAIL_VERIFICATION_METHOD

        if(method === 'code') {
            if(!verification.code || !verification.codeExpiresAt) {
                throw new UnauthorizedException('Invalid verification.')
            }

            if(new Date() > verification.codeExpiresAt) {
                await this.emailVerificationService.deleteByUserId(userId)
                throw new UnauthorizedException('Verification code has expired.')
            }

            const isValid = await bcrypt.compare(tokenOrCode, verification.code)
            if(!isValid) {
                throw new UnauthorizedException('Invalid verification code.')
            }
        } else {
            if(!verification.token || !verification.tokenExpiresAt) {
                throw new UnauthorizedException('Invalid verification.')
            }

            if(new Date() > verification.tokenExpiresAt) {
                await this.emailVerificationService.deleteByUserId(userId)
                throw new UnauthorizedException('Verification token has expired.')
            }

            const isValid = await bcrypt.compare(tokenOrCode, verification.token)
            if(!isValid) {
                throw new UnauthorizedException('Invalid verification token.')
            }
        }

        // Mark user as verified
        await this.usersService.verify(userId)

        // Delete verification record
        await this.emailVerificationService.deleteByUserId(userId)

        return { message: 'Email successfully verified.' }
    }

    // Other methods

    private async generateTokens({ userId, email, role }: TokensDto) {
        const accessToken = this.jwtService.sign(
            { userId, email, role },
            { expiresIn: '15m' }
        )

        const refreshToken = this.jwtService.sign(
            { userId },
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