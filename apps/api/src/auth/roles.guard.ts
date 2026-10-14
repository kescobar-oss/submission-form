import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../../generated/prisma/enums.js';
import type { AuthedRequest } from './jwt-auth.guard.js';
import { ROLES_KEY } from './roles.decorator.js';

// "Is your role allowed here?" Must be listed AFTER JwtAuthGuard in @UseGuards, because it
// relies on request.user, which JwtAuthGuard fills in. Guards run in the order listed.
@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector is Nest's tool for reading metadata that decorators stored.
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Look on the method first, then on the whole controller class.
    const allowed = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // No @Roles label: any logged-in user may continue.
    if (!allowed || allowed.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<AuthedRequest>();
    if (!allowed.includes(user.role)) {
      // 403, not 401: we know exactly who you are, you just aren't allowed to do this.
      throw new ForbiddenException('You do not have permission to do this');
    }
    return true;
  }
}
