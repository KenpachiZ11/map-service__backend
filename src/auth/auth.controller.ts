import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../user/user.entity.js';
import { AuthService, type AuthResponse } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import type { AuthUser } from './guards/jwt-auth.guard.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Регистрация нового пользователя (роль по умолчанию user)',
  })
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход и получение JWT-токена' })
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.auth.login(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Мой профиль (текущий пользователь)' })
  getMe(@CurrentUser() current: AuthUser): Promise<User> {
    return this.auth.getMe(current.sub);
  }
}
