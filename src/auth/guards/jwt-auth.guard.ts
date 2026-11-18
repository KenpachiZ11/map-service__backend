import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../user/user-role.enum.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

export interface AuthUser {
  sub: string;
  login: string;
  role: UserRole;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthUser;
    }>();
    const token = this.extractToken(request.headers['authorization']);
    if (!token) {
      throw new UnauthorizedException('Токен не предоставлен');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthUser>(token);
    } catch {
      throw new UnauthorizedException(
        'Недействительный или просроченный токен',
      );
    }
    return true;
  }

  private extractToken(authorization: string | undefined): string | undefined {
    if (
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    ) {
      return authorization.slice(7);
    }
    return undefined;
  }
}
