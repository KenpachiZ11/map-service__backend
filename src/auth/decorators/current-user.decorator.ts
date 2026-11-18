import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../guards/jwt-auth.guard.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    return context.switchToHttp().getRequest<{ user: AuthUser }>().user;
  },
);
