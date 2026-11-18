import {
  ClassSerializerInterceptor,
  type INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { setupSwagger } from './config/swagger.config.js';

export function setupApp(app: INestApplication): void {
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const corsOrigins = (configService.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.use(helmet());

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableShutdownHooks();

  const environment = configService.get<string>('NODE_ENV', 'development');
  if (environment !== 'production') {
    setupSwagger(app);
  }
}
