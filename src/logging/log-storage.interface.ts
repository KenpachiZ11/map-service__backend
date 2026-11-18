import type { LogEntry } from './log-entry.interface.js';

export const LOG_STORAGE = Symbol('LOG_STORAGE');

export interface LogStorage {
  save(entry: LogEntry): Promise<void> | void;
}

export class NoopLogStorage implements LogStorage {
  save(): void {}
}
