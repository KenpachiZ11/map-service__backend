import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserRole } from '../user/user-role.enum.js';
import { User, type UserAccess } from '../user/user.entity.js';
import { LogAction } from '../logs/log-action.enum.js';
import { LogsService } from '../logs/logs.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    login: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    access: UserAccess;
    createAt: Date;
    updateAt: Date;
    lastActiveAt?: Date | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly logs: LogsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const exists = await this.users.findOneBy({ login: dto.login });
    if (exists) {
      throw new ConflictException('Логин уже занят');
    }
    const user = this.users.create({
      login: dto.login,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: await bcrypt.hash(dto.password, 10),
      role: UserRole.User,
      access: [],
      lastActiveAt: new Date(),
    });
    await this.users.save(user);
    await this.logs.create({
      action: LogAction.Register,
      login: user.login,
      actorLogin: user.login,
    });
    return this.buildResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findOneBy({ login: dto.login });
    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    user.lastActiveAt = new Date();
    await this.users.save(user);
    await this.logs.create({
      action: LogAction.Login,
      login: user.login,
      actorLogin: user.login,
    });
    return this.buildResponse(user);
  }

  async getMe(id: string): Promise<User> {
    const user = await this.users.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  private async buildResponse(user: User): Promise<AuthResponse> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      login: user.login,
      role: user.role,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        access: user.access,
        createAt: user.createAt,
        updateAt: user.updateAt,
        lastActiveAt: user.lastActiveAt,
      },
    };
  }
}
