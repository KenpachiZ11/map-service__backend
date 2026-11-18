import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  APP_NAME?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  @IsString()
  @IsOptional()
  DB_HOST?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  DB_PORT?: number;

  @IsString()
  @IsOptional()
  DB_USERNAME?: string;

  @IsString()
  @IsOptional()
  DB_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DB_NAME?: string;

  @IsString()
  @IsOptional()
  JWT_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    forbidUnknownValues: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join('; '))
      .join('\n');
    throw new Error(`Некорректные переменные окружения:\n${messages}`);
  }

  return validated;
}
