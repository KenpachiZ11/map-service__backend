import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AppInfo {
  name: string;
  description: string;
  environment: string;
  version: string;
}

export const APP_DESCRIPTION =
  'Backend-сервис карты на NestJS. Предоставляет REST API (префикс /api, версия v1), health-check и Swagger-документацию.';
export const API_VERSION = '1.0.0';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getInfo(): AppInfo {
    return {
      name: this.configService.get<string>('APP_NAME', 'map-service-backend'),
      description: APP_DESCRIPTION,
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      version: API_VERSION,
    };
  }
}
