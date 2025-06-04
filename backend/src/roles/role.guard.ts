import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from './role.enum'; // enum con tus roles
import { ROLES_KEY } from './role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private jwtService: JwtService
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
            request.user = decoded; // para usarlo luego en controllers
            if (!requiredRoles) return true;
            return requiredRoles.some((role) => decoded.role?.includes(role));
        } catch (err) {
            throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
        }
    }
}
