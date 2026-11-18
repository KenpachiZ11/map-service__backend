import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const toBoolean = (
  value: string | undefined,
  defaultValue: boolean,
): boolean => {
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
};

export function buildTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'map_service'),
    autoLoadEntities: true,
    manualInitialization: true,
    synchronize: toBoolean(configService.get<string>('DB_SYNCHRONIZE'), false),
    logging: toBoolean(configService.get<string>('DB_LOGGING'), false),
  };
}
