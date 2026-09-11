import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // Service for read metadata
import { UserRole } from '../../users/user.entity';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {

    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean { // Call before each request
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ])

        if(!requiredRoles) {
            return true // If no need roles (without decorator @Roles()) — allow access for all
        }

        const { user } = context.switchToHttp().getRequest()
        return requiredRoles.includes(user.role)
    }
}