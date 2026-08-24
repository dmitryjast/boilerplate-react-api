import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // Base guard class for strategies applying

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}