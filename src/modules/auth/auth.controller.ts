import { Controller, Post, Get, Body, Res, HttpCode, UseGuards, Request } from '@nestjs/common'; // Controller - marks class as controller, Post - HTTP POST requests, Body - gets request body, Res - access to Express response object
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

    @Post('register') // Process post request
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.register(dto)

        // Write refresh token to HttpOnly Cookie
        this.setRefreshTokenCookie(res, refreshToken)

        return { accessToken }
    }

    @Post('login') // Process post request
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.login(dto)

        // Write refresh token to HttpOnly Cookie
        this.setRefreshTokenCookie(res, refreshToken)

        return { accessToken }
    }

    @Post('logout') // Process post request
    @HttpCode(200)
    @UseGuards(JwtGuard) // Protect route with guard
    async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
        await this.authService.logout(req.user.userId)
        res.clearCookie('refreshToken')
        return { message: 'Logged out successfully.' }
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
        sameSite: 'lax', // CSRF protection, strict - same site only | lax - allows navigation, blocks iframe/img | none - all requests (requires secure: true)
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    })
}

}
