import { Inject, Injectable, Logger } from '@nestjs/common';
import { LogLevel, type LogEntry } from './log-entry.interface.js';
import { LOG_STORAGE, type LogStorage } from './log-storage.interface.js';

@Injectable()
export class LoggingService {
  constructor(@Inject(LOG_STORAGE) private readonly storage: LogStorage) {}

  log(
    message: unknown,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.write(LogLevel.Log, message, context, meta);
  }

  info(
    message: unknown,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.write(LogLevel.Info, message, context, meta);
  }

  warn(
    message: unknown,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.write(LogLevel.Warn, message, context, meta);
  }

  error(
    message: unknown,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.write(LogLevel.Error, message, context, meta);
  }

  debug(
    message: unknown,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.write(LogLevel.Debug, message, context, meta);
  }

  verbose(
    message: unknown,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.write(LogLevel.Verbose, message, context, meta);
  }

  private write(
    level: LogLevel,
    message: unknown,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    const entry: LogEntry = {
      level,
      message: String(message),
      context,
      meta,
      timestamp: new Date().toISOString(),
    };

    this.emit(level, entry);
    void this.persist(entry);
  }

  private emit(level: LogLevel, entry: LogEntry): void {
    const context = entry.context ?? 'App';
    switch (level) {
      case LogLevel.Error:
        Logger.error(entry.message, context);
        break;
      case LogLevel.Warn:
        Logger.warn(entry.message, context);
        break;
      case LogLevel.Debug:
        Logger.debug(entry.message, context);
        break;
      case LogLevel.Verbose:
        Logger.verbose(entry.message, context);
        break;
      default:
        Logger.log(entry.message, context);
    }
  }

  private async persist(entry: LogEntry): Promise<void> {
    try {
      await this.storage.save(entry);
    } catch {
      Logger.debug('Storage save failed');
    }
  }
}
