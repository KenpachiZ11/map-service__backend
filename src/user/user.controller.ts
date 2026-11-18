import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthUser } from '../auth/guards/jwt-auth.guard.js';
import { UserRole } from './user-role.enum.js';
import { UpdateAccessDto } from './dto/update-access.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './user.entity.js';
import { UserService } from './user.service.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Roles(UserRole.Manager)
  @Get()
  @ApiOperation({ summary: 'Список всех пользователей (admin/manager)' })
  findAll(): Promise<User[]> {
    return this.users.findAll();
  }

  @Roles(UserRole.Manager)
  @Get('activity')
  @ApiOperation({
    summary: 'Активность пользователей: login, role, последняя активность',
  })
  activity(): Promise<
    Array<{ login: string; role: UserRole; lastActiveAt?: Date | null }>
  > {
    return this.users.activity();
  }

  @Roles(UserRole.Manager)
  @Get(':id')
  @ApiOperation({ summary: 'Пользователь по id (admin/manager)' })
  findOne(@Param('id') id: string): Promise<User> {
    return this.users.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить свои данные (firstName/lastName/password)',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() current: AuthUser,
  ): Promise<User> {
    if (current.sub !== id && current.role !== UserRole.Admin) {
      throw new ForbiddenException('Можно редактировать только свой профиль');
    }
    return this.users.update(id, dto, current.login);
  }

  @Roles(UserRole.Admin)
  @Patch(':id/role')
  @ApiOperation({ summary: 'Назначить роль (только admin)' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() current: AuthUser,
  ): Promise<User> {
    return this.users.updateRole(id, dto, current.login);
  }

  @Roles(UserRole.Manager)
  @Patch(':id/access')
  @ApiOperation({ summary: 'Выдать доступы (admin/manager)' })
  updateAccess(
    @Param('id') id: string,
    @Body() dto: UpdateAccessDto,
    @CurrentUser() current: AuthUser,
  ): Promise<User> {
    return this.users.updateAccess(id, dto, current.login);
  }

  @Roles(UserRole.Admin, UserRole.Manager)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить пользователя (admin/manager)' })
  delete(
    @Param('id') id: string,
    @CurrentUser() current: AuthUser,
  ): Promise<void> {
    return this.users.delete(id, current.login);
  }
}
