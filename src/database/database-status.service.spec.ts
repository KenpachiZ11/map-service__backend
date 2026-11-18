import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { LoggingService } from '../logging/logging.service.js';
import { DatabaseStatusService } from './database-status.service.js';

describe('DatabaseStatusService', () => {
  let service: DatabaseStatusService;
  const queryMock = vi.fn();
  const initializeMock = vi.fn();
  const infoMock = vi.fn();
  const errorMock = vi.fn();

  beforeEach(async () => {
    queryMock.mockReset();
    initializeMock.mockReset();
    infoMock.mockReset();
    errorMock.mockReset();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseStatusService,
        {
          provide: DataSource,
          useValue: {
            isInitialized: false,
            initialize: initializeMock,
            query: queryMock,
          },
        },
        {
          provide: LoggingService,
          useValue: { info: infoMock, error: errorMock },
        },
      ],
    }).compile();

    service = moduleRef.get(DatabaseStatusService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  it('если БД доступна — инициализирует DataSource и логирует info', async () => {
    initializeMock.mockResolvedValue(undefined);
    queryMock.mockResolvedValue([{ ok: 1 }]);

    await service.onApplicationBootstrap();

    expect(initializeMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith(
      'Подключение к БД установлено',
      'Database',
    );
    expect(errorMock).not.toHaveBeenCalled();
  });

  it('если БД недоступна — логирует error с подсказкой про Docker', async () => {
    initializeMock.mockRejectedValue(
      new Error('connect ECONNREFUSED 127.0.0.1:5433'),
    );

    await service.onApplicationBootstrap();

    expect(errorMock).toHaveBeenCalledWith(
      'Подключение к БД отсутствует. Проверьте, что запущен Docker: docker compose up -d postgres',
      'Database',
    );
    expect(queryMock).not.toHaveBeenCalled();
    expect(infoMock).not.toHaveBeenCalled();
  });
});
