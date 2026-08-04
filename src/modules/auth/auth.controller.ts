import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common'; // Controller - marks class as controller, Post - HTTP POST requests, Body - gets request body, Res - access to Express response object
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')

export class AuthController {

    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) {}

    @Post('register')
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.register(dto)

        // Write refresh token to HttpOnly Cookie
        this.setRefreshTokenCookie(res, refreshToken)


        return { accessToken }
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.login(dto)

        // Write refresh token to HttpOnly Cookie
        this.setRefreshTokenCookie(res, refreshToken)

        return { accessToken }
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
