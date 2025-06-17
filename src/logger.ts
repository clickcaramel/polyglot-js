export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  private level: LogLevel;

  constructor(
    readonly name: string,
    level: LogLevel = LogLevel.INFO,
  ) {
    this.level = level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    return messageLevel <= this.level;
  }

  private log(type: string, messageLevel: LogLevel, message: unknown, ...args: unknown[]) {
    if (!this.shouldLog(messageLevel)) {
      return;
    }

    console.log(
      `[${new Date().toISOString()}] [${type}] ${this.name} - ${message as string}`, ...args
    );
  }

  debug(message: unknown, ...args: unknown[]) {
    this.log('DEBUG', LogLevel.DEBUG, message, ...args);
  }

  info(message: unknown, ...args: unknown[]) {
    this.log('INFO', LogLevel.INFO, message, ...args);
  }

  warn(message: unknown, ...args: unknown[]) {
    this.log('WARN', LogLevel.WARN, message, ...args);
  }

  error(message: unknown, ...args: unknown[]) {
    this.log('ERROR', LogLevel.ERROR, message, ...args);
  }
}
