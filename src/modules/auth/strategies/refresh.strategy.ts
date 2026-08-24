import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {

    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => req?.cookies?.refreshToken
            ]),
            secretOrKey: configService.get<string>('JWT_SECRET')!,
            passReqToCallback: true,
        })
    }

    async validate(req: Request, payload: any) {
        const refreshToken = req?.cookies?.refreshToken

        if(!refreshToken) {
            throw new UnauthorizedException('Refresh token not found.')
        }

        return {
            userId: payload.userId,
            refreshToken,
        }
    }
}