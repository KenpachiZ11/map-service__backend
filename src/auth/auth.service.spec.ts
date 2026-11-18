import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { LogAction } from '../logs/log-action.enum.js';
import { LogsService } from '../logs/logs.service.js';
import { UserRole } from '../user/user-role.enum.js';
import { User } from '../user/user.entity.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  const repo = {
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };
  const jwt = { signAsync: vi.fn() };
  const logs = { create: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: JwtService, useValue: jwt },
        { provide: LogsService, useValue: logs },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  it('register() создаёт пользователя с ролью user и возвращает токен', async () => {
    repo.findOneBy.mockResolvedValue(null);
    repo.create.mockImplementation((data) => data);
    repo.save.mockImplementation(async (data) => data);
    jwt.signAsync.mockResolvedValue('token-abc');

    const result = await service.register({
      login: 'new',
      password: 'pass1234',
    });

    expect(result.accessToken).toBe('token-abc');
    expect(result.user.role).toBe(UserRole.User);
    expect(result.user).not.toHaveProperty('password');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        login: 'new',
        role: UserRole.User,
        lastActiveAt: expect.any(Date),
      }),
    );
    expect(logs.create).toHaveBeenCalledWith({
      action: LogAction.Register,
      login: 'new',
      actorLogin: 'new',
    });
  });

  it('register() бросает ConflictException, если логин занят', async () => {
    repo.findOneBy.mockResolvedValue({ id: '1' });

    await expect(
      service.register({ login: 'alex', password: 'pass1234' }),
    ).rejects.toThrow(ConflictException);
  });

  it('login() возвращает токен при корректном пароле', async () => {
    const hash = await bcrypt.hash('777', 4);
    repo.findOneBy.mockResolvedValue({
      id: '1',
      login: 'alex',
      password: hash,
      role: UserRole.Admin,
      firstName: 'Alex',
      lastName: 'Trust',
      access: true,
      createAt: new Date(),
    });
    jwt.signAsync.mockResolvedValue('token-abc');

    const result = await service.login({ login: 'alex', password: '777' });

    expect(result.accessToken).toBe('token-abc');
    expect(result.user.role).toBe(UserRole.Admin);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(
      (repo.save.mock.calls[0][0] as { lastActiveAt?: Date }).lastActiveAt,
    ).toBeInstanceOf(Date);
    expect(logs.create).toHaveBeenCalledWith({
      action: LogAction.Login,
      login: 'alex',
      actorLogin: 'alex',
    });
  });

  it('login() бросает UnauthorizedException при неверном пароле', async () => {
    const hash = await bcrypt.hash('777', 4);
    repo.findOneBy.mockResolvedValue({
      id: '1',
      login: 'alex',
      password: hash,
      role: UserRole.Admin,
    });

    await expect(
      service.login({ login: 'alex', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('login() бросает UnauthorizedException, если пользователь не найден', async () => {
    repo.findOneBy.mockResolvedValue(null);

    await expect(
      service.login({ login: 'ghost', password: '1234' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
