import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { buildTypeOrmOptions } from './config/typeorm.config.js';
import { validate } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { LoggingModule } from './logging/logging.module.js';
import { LogsModule } from './logs/logs.module.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    HealthModule,
    LogsModule,
    AuthModule,
    DatabaseModule,
    LoggingModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
