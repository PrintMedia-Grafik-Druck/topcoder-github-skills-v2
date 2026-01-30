enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  PROGRESS = 'PROGRESS'
}

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string): void {
    process.stdout.write(`[${LogLevel.INFO}] [${this.context}] ${message}\n`);
  }

  warn(message: string): void {
    process.stderr.write(`[${LogLevel.WARN}] [${this.context}] ${message}\n`);
  }

  error(message: string, error?: Error): void {
    process.stderr.write(`[${LogLevel.ERROR}] [${this.context}] ${message}\n`);
    if (error && error.stack) {
      process.stderr.write(error.stack + '\n');
    }
  }

  success(message: string): void {
    process.stdout.write(`[${LogLevel.SUCCESS}] [${this.context}] ${message}\n`);
  }

  progress(message: string): void {
    process.stdout.write(`[${LogLevel.PROGRESS}] [${this.context}] ${message}\n`);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
