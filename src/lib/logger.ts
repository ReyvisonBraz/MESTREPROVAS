type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  request_id?: string;
  [key: string]: unknown;
}

class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    this.level = this.parseLevel(envLevel);
  }

  private parseLevel(level?: string): LogLevel {
    const validLevels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    if (validLevels.includes(level as LogLevel)) {
      return level as LogLevel;
    }
    return 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    const currentIndex = levels.indexOf(this.level);
    const targetIndex = levels.indexOf(level);
    return targetIndex <= currentIndex;
  }

  private formatLog(level: LogLevel, message: string, context: LogContext = {}): string {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };
    return JSON.stringify(logEntry);
  }

  error(message: string, context: LogContext = {}): void {
    if (this.shouldLog('error')) {
      console.error(this.formatLog('error', message, context));
    }
  }

  warn(message: string, context: LogContext = {}): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatLog('warn', message, context));
    }
  }

  info(message: string, context: LogContext = {}): void {
    if (this.shouldLog('info')) {
      console.log(this.formatLog('info', message, context));
    }
  }

  debug(message: string, context: LogContext = {}): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatLog('debug', message, context));
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new Logger();
