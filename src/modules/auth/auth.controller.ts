import { Controller, Post, Get, Body, Res, HttpCode, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from './guards/jwt.guard';
import { RefreshGuard } from './guards/refresh.guard';

@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) {}

    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.login(dto)
        this.setRefreshTokenCookie(res, refreshToken)
        return { accessToken }
    }

    @Post('register')
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
    @HttpCode(200)
    async forgotPassword(@Body() body: { email: string }) {
        return await this.authService.forgotPassword(body.email)
    }

    @Post('reset-password')
    @HttpCode(200)
    async resetPassword(@Body() body: { userId: number, token: string, newPassword: string }) {
        return await this.authService.resetPassword(body.userId, body.token, body.newPassword)
    }

    @Post('send-verification')
    @HttpCode(200)
    @UseGuards(JwtGuard)
    async sendVerification(@Request() req) {
        const user = await this.authService.me(req.user.userId)
        await this.authService.sendVerificationEmail(user.id, user.email, user.name)
        return { message: 'Verification email sent.' }
    }

    @Post('verify-email')
    @HttpCode(200)
    async verifyEmail(@Body() body: { userId: number, tokenOrCode: string }) {
        return await this.authService.verifyEmail(body.userId, body.tokenOrCode)
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