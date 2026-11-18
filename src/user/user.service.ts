import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { LogAction } from '../logs/log-action.enum.js';
import { LogsService } from '../logs/logs.service.js';
import { UpdateAccessDto } from './dto/update-access.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserRole } from './user-role.enum.js';
import { User } from './user.entity.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly logs: LogsService,
  ) {}

  findAll(): Promise<User[]> {
    return this.users.find({ order: { createAt: 'ASC' } });
  }

  async activity(): Promise<
    Array<{
      login: string;
      role: UserRole;
      lastActiveAt?: Date | null;
    }>
  > {
    const users = await this.users.find({ order: { lastActiveAt: 'DESC' } });
    return users.map((user) => ({
      login: user.login,
      role: user.role,
      lastActiveAt: user.lastActiveAt,
    }));
  }

  async findById(id: string): Promise<User> {
    const user = await this.users.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actorLogin?: string,
  ): Promise<User> {
    const user = await this.findById(id);
    if (dto.password !== undefined) {
      user.password = await this.hash(dto.password);
    }
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }
    await this.users.save(user);
    await this.logs.create({
      action: LogAction.Update,
      login: user.login,
      actorLogin: actorLogin ?? user.login,
    });
    return this.findById(id);
  }

  async updateRole(
    id: string,
    dto: UpdateRoleDto,
    actorLogin?: string,
  ): Promise<User> {
    const user = await this.findById(id);
    user.role = dto.role;
    await this.users.save(user);
    await this.logs.create({
      action: LogAction.RoleChange,
      login: user.login,
      actorLogin,
      details: { role: dto.role },
    });
    return this.findById(id);
  }

  async updateAccess(
    id: string,
    dto: UpdateAccessDto,
    actorLogin?: string,
  ): Promise<User> {
    const user = await this.findById(id);
    if (dto.access !== undefined) {
      user.access = dto.access;
    }
    await this.users.save(user);
    await this.logs.create({
      action: LogAction.AccessChange,
      login: user.login,
      actorLogin,
      details: { access: dto.access },
    });
    return this.findById(id);
  }

  async delete(id: string, actorLogin?: string): Promise<void> {
    const user = await this.findById(id);
    await this.logs.create({
      action: LogAction.Delete,
      login: user.login,
      actorLogin,
    });
    await this.users.remove(user);
  }

  private hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
