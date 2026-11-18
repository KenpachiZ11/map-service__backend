import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LogAction } from './log-action.enum.js';
import { Log } from './log.entity.js';
import { LogsService } from './logs.service.js';

describe('LogsService', () => {
  let service: LogsService;
  const repo = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LogsService,
        { provide: getRepositoryToken(Log), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(LogsService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  it('create() сохраняет запись в журнал', async () => {
    repo.create.mockImplementation((data) => data);
    repo.save.mockResolvedValue({ id: 'log-1' });

    await service.create({
      action: LogAction.Login,
      login: 'alex',
      actorLogin: 'alex',
    });

    expect(repo.create).toHaveBeenCalledWith({
      action: LogAction.Login,
      login: 'alex',
      actorLogin: 'alex',
      details: undefined,
    });
    expect(repo.save).toHaveBeenCalled();
  });

  it('create() не бросает ошибку, если сохранение не удалось', async () => {
    repo.create.mockImplementation((data) => data);
    repo.save.mockRejectedValue(new Error('db down'));

    await expect(
      service.create({ action: LogAction.Login, actorLogin: 'alex' }),
    ).resolves.toBeUndefined();
  });

  it('findAll() возвращает журнал (сначала свежие)', async () => {
    repo.find.mockResolvedValue([{ id: '1' }]);

    await expect(service.findAll()).resolves.toEqual([{ id: '1' }]);
    expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
  });
});