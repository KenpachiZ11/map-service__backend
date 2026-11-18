import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NoopLogStorage } from './logging/log-storage.interface.js';
import { LoggingService } from './logging/logging.service.js';
import { setupApp } from './setup-app.js';

function isDatabaseError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|Unable to connect to the database/i.test(
    message,
  );
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);

  const logger = app.get(LoggingService);
  logger.info(`Сервис запущен: http://localhost:${port}/api/v1`, 'Bootstrap');
  logger.info(`Swagger: http://localhost:${port}/api`, 'Bootstrap');
  logger.info('health-check: GET /api/v1/health', 'Bootstrap');
}

void bootstrap().catch((error: unknown) => {
  const logging = new LoggingService(new NoopLogStorage());
  if (isDatabaseError(error)) {
    logging.error(
      'Подключение к БД отсутствует. Проверьте, что запущен Docker: docker compose up -d postgres',
      'Bootstrap',
    );
  } else {
    const message = error instanceof Error ? error.message : String(error);
    logging.error(`Ошибка при запуске приложения: ${message}`, 'Bootstrap');
  }
  process.exit(1);
});
