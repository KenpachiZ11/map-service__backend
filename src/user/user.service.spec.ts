import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LogAction } from '../logs/log-action.enum.js';
import { LogsService } from '../logs/logs.service.js';
import { UserRole } from './user-role.enum.js';
import { User } from './user.entity.js';
import { UserService } from './user.service.js';

describe('UserService', () => {
  let service: UserService;
  const repo = {
    find: vi.fn(),
    findOneBy: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };
  const logs = { create: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: LogsService, useValue: logs },
      ],
    }).compile();
    service = moduleRef.get(UserService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  it('findAll() возвращает список пользователей', async () => {
    repo.find.mockResolvedValue([{ id: '1' }]);
    await expect(service.findAll()).resolves.toEqual([{ id: '1' }]);
    expect(repo.find).toHaveBeenCalledWith({ order: { createAt: 'ASC' } });
  });

  it('activity() возвращает login/role/lastActiveAt', async () => {
    const date = new Date('2026-01-01T00:00:00Z');
    repo.find.mockResolvedValue([
      { login: 'alex', role: 'admin', lastActiveAt: date },
    ]);

    await expect(service.activity()).resolves.toEqual([
      { login: 'alex', role: 'admin', lastActiveAt: date },
    ]);
    expect(repo.find).toHaveBeenCalledWith({ order: { lastActiveAt: 'DESC' } });
  });

  it('findById() бросает NotFoundException, если пользователя нет', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('delete() удаляет существующего пользователя', async () => {
    const user = { id: '1', login: 'alex', role: UserRole.User } as User;
    repo.findOneBy.mockResolvedValue(user);
    repo.remove.mockResolvedValue(undefined);

    await service.delete('1', 'admin');

    expect(repo.remove).toHaveBeenCalledWith(user);
    expect(logs.create).toHaveBeenCalledWith({
      action: LogAction.Delete,
      login: 'alex',
      actorLogin: 'admin',
    });
  });

  it('delete() бросает NotFoundException, если пользователя нет', async () => {
    repo.findOneBy.mockResolvedValue(null);

    await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
