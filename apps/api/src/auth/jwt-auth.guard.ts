import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { TokenPayload } from './auth.service.js';

// A request that has passed this guard carries the token's contents as request.user.
export type AuthedRequest = Request & { user: TokenPayload };

// "Are you logged in?" Runs before pipes and the controller (like AdminKeyGuard did),
// so a request without a valid token never reaches any code that touches data.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    // The standard place for a token: the header "Authorization: Bearer <token>".
    // "Bearer" means "whoever holds (bears) this token is let in", which is why it must be
    // kept as carefully as a password while it's valid.
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Login required');
    }
    try {
      // verifyAsync recomputes the signature with JWT_SECRET and checks the expiry time.
      // A token that was edited, signed with another key, or is older than 8 hours fails.
      request.user = await this.jwt.verifyAsync<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Your login has expired or is invalid. Please log in again.');
    }
    return true;
  }
}
