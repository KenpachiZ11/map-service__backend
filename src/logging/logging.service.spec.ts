import { Test, TestingModule } from '@nestjs/testing';
import type { LogEntry } from './log-entry.interface.js';
import { LOG_STORAGE, type LogStorage } from './log-storage.interface.js';
import { LoggingService } from './logging.service.js';

class MockStorage implements LogStorage {
  entries: LogEntry[] = [];

  save(entry: LogEntry): void {
    this.entries.push(entry);
  }
}

describe('LoggingService', () => {
  let service: LoggingService;
  let storage: MockStorage;

  beforeEach(async () => {
    storage = new MockStorage();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [LoggingService, { provide: LOG_STORAGE, useValue: storage }],
    }).compile();

    service = moduleRef.get(LoggingService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  it('log() сохраняет запись с уровнем log и контекстом', () => {
    service.log('hello', 'Test');
    expect(storage.entries).toHaveLength(1);
    expect(storage.entries[0]).toMatchObject({
      level: 'log',
      message: 'hello',
      context: 'Test',
      timestamp: expect.any(String),
    });
  });

  it('info/warn/error пишут записи соответствующих уровней', () => {
    service.info('i', 'C');
    service.warn('w', 'C');
    service.error('e', 'C');
    expect(storage.entries.map((entry) => entry.level)).toEqual([
      'info',
      'warn',
      'error',
    ]);
  });
});
