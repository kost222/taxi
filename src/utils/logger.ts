// Production-safe logger utility

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel: LogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}]`

    if (data !== undefined) {
      return `${prefix} ${message} ${JSON.stringify(data)}`
    }
    return `${prefix} ${message}`
  }

  error(message: string, data?: any) {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message, data))
    }
  }

  warn(message: string, data?: any) {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, data))
    }
  }

  info(message: string, data?: any) {
    if (this.logLevel >= LogLevel.INFO && this.isDevelopment) {
      console.info(this.formatMessage('INFO', message, data))
    }
  }

  debug(message: string, data?: any) {
    if (this.logLevel >= LogLevel.DEBUG && this.isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message, data))
    }
  }

  // Legacy console.log replacement - only shows in development
  log(message: string, data?: any) {
    this.debug(message, data)
  }
}

export const logger = new Logger()