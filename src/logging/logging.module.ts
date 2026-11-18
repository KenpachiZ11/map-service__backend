import { Global, Module } from '@nestjs/common';
import { LOG_STORAGE, NoopLogStorage } from './log-storage.interface.js';
import { LoggingService } from './logging.service.js';

@Global()
@Module({
  providers: [
    LoggingService,
    { provide: LOG_STORAGE, useClass: NoopLogStorage },
  ],
  exports: [LoggingService],
})
export class LoggingModule {}
