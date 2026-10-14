import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './jwt-auth.guard.js';

// @CurrentUser() hands a controller function the logged-in user, the way @Body() hands it
// the body. Only use it on routes behind JwtAuthGuard, which is what fills request.user.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthedRequest>().user,
);
