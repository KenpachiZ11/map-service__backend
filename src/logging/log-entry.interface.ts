export enum LogLevel {
  Debug = 'debug',
  Log = 'log',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Verbose = 'verbose',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}
