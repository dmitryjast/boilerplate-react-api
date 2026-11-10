import { Controller, Post, Get, Body, Res, HttpCode, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from './guards/jwt.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { Throttle, minutes, hours } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) {}

    @Post('login')
    @Throttle({ default: { limit: 10, ttl: minutes(15) } })
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.login(dto)
        this.setRefreshTokenCookie(res, refreshToken)
        return { accessToken }
    }

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: hours(1) } })
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.register(dto)
        this.setRefreshTokenCookie(res, refreshToken)
        return { accessToken }
    }

    @Post('logout')
    @HttpCode(200)
    @UseGuards(JwtGuard)
    async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
        await this.authService.logout(req.user.userId)
        res.clearCookie('refreshToken')
        return { message: 'Logged out successfully.' }
    }

    @Post('forgot-password')
    @Throttle({ default: { limit: 3, ttl: minutes(15) } })
    @HttpCode(200)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return await this.authService.forgotPassword(dto.email)
    }

    @Post('reset-password')
    @Throttle({ default: { limit: 10, ttl: minutes(15) } })
    @HttpCode(200)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return await this.authService.resetPassword(dto.userId, dto.token, dto.newPassword)
    }

    @Post('send-verification')
    @Throttle({ default: { limit: 3, ttl: minutes(15) } })
    @HttpCode(200)
    @UseGuards(JwtGuard)
    async sendVerification(@Request() req) {
        const user = await this.authService.me(req.user.userId)
        await this.authService.sendVerificationEmail(user.id, user.email, user.name)
        return { message: 'Verification email sent.' }
    }

    @Post('verify-email')
    @Throttle({ default: { limit: 10, ttl: minutes(15) } })
    @HttpCode(200)
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        return await this.authService.verifyEmail(dto.userId, dto.tokenOrCode)
    }

    @Post('refresh')
    @HttpCode(200)
    @UseGuards(RefreshGuard)
    async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.refresh(
            req.user.userId,
            req.user.refreshToken
        )
        this.setRefreshTokenCookie(res, refreshToken)
        return { accessToken }
    }

    @Get('me')
    @UseGuards(JwtGuard)
    async me(@Request() req) {
        return await this.authService.me(req.user.userId)
    }

    // Other methods
    private setRefreshTokenCookie(res: Response, refreshToken: string) {
        const appMode = this.configService.get('NODE_ENV')
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: appMode === 'prod',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        })
    }

}