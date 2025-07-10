import { ErrorType, ErrorDetails } from '../../types';
import { ERROR_MESSAGES } from '../../constants';

/**
 * Custom application error class
 */
export class AppError extends Error {
  type: ErrorType;
  context?: Record<string, any>;
  originalError?: Error;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'AppError';
    this.type = details.type;
    this.context = details.context;
    this.originalError = details.originalError;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get a user-friendly error message
   */
  getUserFriendlyMessage(): string {
    return this.message;
  }

  /**
   * Get detailed error information for debugging
   */
  getDebugInfo(): Record<string, any> {
    return {
      type: this.type,
      message: this.message,
      context: this.context,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined,
      stack: this.stack
    };
  }
}

/**
 * Create a network error
 */
export function createNetworkError(subtype: keyof typeof ERROR_MESSAGES.NETWORK, originalError?: Error, context?: Record<string, any>): AppError {
  return new AppError({
    type: ErrorType.NETWORK,
    message: ERROR_MESSAGES.NETWORK[subtype],
    originalError,
    context
  });
}

/**
 * Create an API error
 */
export function createApiError(subtype: keyof typeof ERROR_MESSAGES.API, originalError?: Error, context?: Record<string, any>): AppError {
  return new AppError({
    type: ErrorType.API,
    message: ERROR_MESSAGES.API[subtype],
    originalError,
    context
  });
}

/**
 * Create a validation error
 */
export function createValidationError(subtype: keyof typeof ERROR_MESSAGES.VALIDATION, originalError?: Error, context?: Record<string, any>): AppError {
  return new AppError({
    type: ErrorType.VALIDATION,
    message: ERROR_MESSAGES.VALIDATION[subtype],
    originalError,
    context
  });
}

/**
 * Create an extraction error
 */
export function createExtractionError(subtype: keyof typeof ERROR_MESSAGES.EXTRACTION, originalError?: Error, context?: Record<string, any>): AppError {
  return new AppError({
    type: ErrorType.EXTRACTION,
    message: ERROR_MESSAGES.EXTRACTION[subtype],
    originalError,
    context
  });
}

/**
 * Create a summarization error
 */
export function createSummarizationError(subtype: keyof typeof ERROR_MESSAGES.SUMMARIZATION, originalError?: Error, context?: Record<string, any>): AppError {
  return new AppError({
    type: ErrorType.SUMMARIZATION,
    message: ERROR_MESSAGES.SUMMARIZATION[subtype],
    originalError,
    context
  });
}

/**
 * Create a file system error
 */
export function createFileSystemError(subtype: keyof typeof ERROR_MESSAGES.FILE_SYSTEM, originalError?: Error, context?: Record<string, any>): AppError {
  return new AppError({
    type: ErrorType.FILE_SYSTEM,
    message: ERROR_MESSAGES.FILE_SYSTEM[subtype],
    originalError,
    context
  });
}

/**
 * Create a configuration error
 */
export function createConfigurationError(subtype: keyof typeof ERROR_MESSAGES.CONFIGURATION, originalError?: Error, context?: Record<string, any>): AppError {
  return new AppError({
    type: ErrorType.CONFIGURATION,
    message: ERROR_MESSAGES.CONFIGURATION[subtype],
    originalError,
    context
  });
}

/**
 * Create an unknown error
 */
export function createUnknownError(message?: string, originalError?: Error, context?: Record<string, any>): AppError {
  return new AppError({
    type: ErrorType.UNKNOWN,
    message: message || ERROR_MESSAGES.UNKNOWN.GENERAL_ERROR,
    originalError,
    context
  });
}

/**
 * Handle an error by wrapping it in an AppError if it isn't one already
 */
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return createUnknownError(error.message, error);
  }

  return createUnknownError(
    typeof error === 'string' ? error : 'An unknown error occurred',
    undefined,
    { originalValue: error }
  );
}
