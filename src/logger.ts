export class Logger {
  constructor(
    readonly name: string,
  ) {
  }

  private log(type: string, message: unknown, ...args: unknown[]) {
    console.log(
      `[${new Date().toISOString()}] [${type}] ${this.name} - ${message as string}`, ...args
    );
  }

  info(message: unknown, ...args: unknown[]) {
    this.log('INFO', message, ...args);
  }

  warn(message: unknown, ...args: unknown[]) {
    this.log('WARN', message, ...args);
  }

  error(message: unknown, ...args: unknown[]) {
    this.log('ERROR', message, ...args);
  }
}
