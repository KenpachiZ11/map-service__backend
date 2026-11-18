import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { LoggingService } from '../logging/logging.service.js';

@Injectable()
export class DatabaseStatusService implements OnApplicationBootstrap {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly logging: LoggingService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }
      await this.dataSource.query('SELECT 1');
      this.logging.info('Подключение к БД установлено', 'Database');
    } catch {
      this.logging.error(
        'Подключение к БД отсутствует. Проверьте, что запущен Docker: docker compose up -d postgres',
        'Database',
      );
    }
  }
}
