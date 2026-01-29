export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LoggerConfig {
  level?: LogLevel;
}

export class Logger {
  private level: LogLevel;

  constructor(config?: LoggerConfig) {
    this.level = config?.level ?? LogLevel.INFO;
  }

  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      process.stdout.write(`[DEBUG] ${message}\n`);
    }
  }

  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      process.stdout.write(`[INFO] ${message}\n`);
    }
  }

  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      process.stderr.write(`[WARN] ${message}\n`);
    }
  }

  error(message: string, error?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      process.stderr.write(`[ERROR] ${message}\n`);
      if (error && error.stack) {
        process.stderr.write(error.stack + '\n');
      }
    }
  }
}

export function createLogger(config?: LoggerConfig): Logger {
  return new Logger(config);
}
