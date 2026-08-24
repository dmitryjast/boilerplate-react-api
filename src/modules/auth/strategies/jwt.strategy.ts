import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport'; // Base strategy passport
import { ExtractJwt, Strategy } from 'passport-jwt'; // To get token from request
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(private configService: ConfigService) {
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: configService.get<string>('JWT_SECRET')!,
        })
    }

    async validate(payload: any) {
        return {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
        }
    }
}