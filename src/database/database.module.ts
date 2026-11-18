import { Module } from '@nestjs/common';
import { DatabaseStatusService } from './database-status.service.js';

@Module({
  providers: [DatabaseStatusService],
})
export class DatabaseModule {}
