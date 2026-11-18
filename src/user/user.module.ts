import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsModule } from '../logs/logs.module.js';
import { UserController } from './user.controller.js';
import { User } from './user.entity.js';
import { UserService } from './user.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User]), LogsModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
