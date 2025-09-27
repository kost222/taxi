// Centralized error handling utility

import { logger } from './logger'
import { showError, showWarning } from './notifications'

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode?: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode?: number,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    Error.captureStackTrace(this, this.constructor)
  }
}

export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // Authentication errors
  AUTH_ERROR = 'AUTH_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // File errors
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',

  // WebSocket errors
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  CONNECTION_LOST = 'CONNECTION_LOST',

  // Business logic errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  DRIVER_UNAVAILABLE = 'DRIVER_UNAVAILABLE',
}

export class ErrorHandler {
  static handle(error: unknown, context?: string): void {
    const appError = this.normalizeError(error, context)

    // Log the error
    logger.error(`Error in ${context || 'unknown context'}`, {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      stack: appError.stack,
      context: appError.context
    })

    // Show user-friendly notification based on error type
    this.showUserNotification(appError)
  }

  static normalizeError(error: unknown, context?: string): AppError {
    if (error instanceof AppError) {
      return error
    }

    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'NetworkError' || error.message.includes('fetch')) {
        return new AppError(
          'Ошибка сети. Проверьте интернет-соединение.',
          ErrorCode.NETWORK_ERROR,
          undefined,
          true,
          { context, originalMessage: error.message }
        )
      }

      if (error.message.includes('timeout')) {
        return new AppError(
          'Превышено время ожидания. Попробуйте снова.',
          ErrorCode.TIMEOUT_ERROR,
          undefined,
          true,
          { context, originalMessage: error.message }
        )
      }

      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        return new AppError(
          'Ошибка авторизации. Войдите в систему заново.',
          ErrorCode.UNAUTHORIZED,
          401,
          true,
          { context, originalMessage: error.message }
        )
      }

      return new AppError(
        error.message,
        ErrorCode.API_ERROR,
        undefined,
        true,
        { context, originalMessage: error.message }
      )
    }

    // Handle unknown errors
    return new AppError(
      'Произошла неожиданная ошибка',
      ErrorCode.API_ERROR,
      undefined,
      false,
      { context, originalError: error }
    )
  }

  private static showUserNotification(error: AppError): void {
    // Don't show notifications for certain internal errors
    if (!error.isOperational) {
      return
    }

    switch (error.code) {
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.TIMEOUT_ERROR:
        showError(error.message, 'Ошибка соединения')
        break

      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.AUTH_ERROR:
        showWarning(error.message, 'Ошибка авторизации')
        break

      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.INVALID_INPUT:
        showWarning(error.message, 'Ошибка ввода')
        break

      case ErrorCode.FILE_READ_ERROR:
      case ErrorCode.FILE_WRITE_ERROR:
        showError(error.message, 'Ошибка файла')
        break

      default:
        showError(error.message)
        break
    }
  }

  static async handleAsync<T>(
    operation: () => Promise<T>,
    context?: string,
    fallbackValue?: T
  ): Promise<T | undefined> {
    try {
      return await operation()
    } catch (error) {
      this.handle(error, context)
      return fallbackValue
    }
  }

  static handleSync<T>(
    operation: () => T,
    context?: string,
    fallbackValue?: T
  ): T | undefined {
    try {
      return operation()
    } catch (error) {
      this.handle(error, context)
      return fallbackValue
    }
  }
}

// Convenience functions
export const handleError = (error: unknown, context?: string) => ErrorHandler.handle(error, context)
export const handleAsyncError = <T>(operation: () => Promise<T>, context?: string, fallback?: T) =>
  ErrorHandler.handleAsync(operation, context, fallback)
export const handleSyncError = <T>(operation: () => T, context?: string, fallback?: T) =>
  ErrorHandler.handleSync(operation, context, fallback)