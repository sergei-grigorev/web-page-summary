import { ErrorType } from '../../types/index.js';
import { ERROR_MESSAGES } from '../../constants.js';

/**
 * Custom application error class
 */
export class AppError extends Error {
  /**
   * @param {import('../../types/index.js').ErrorDetails} details - Error details object
   */
  constructor(details) {
    super(details.message);
    this.name = 'AppError';
    /** @type {string} */
    this.type = details.type;
    /** @type {Object<string, any>|undefined} */
    this.context = details.context;
    /** @type {Error|undefined} */
    this.originalError = details.originalError;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get a user-friendly error message
   * @returns {string} User-friendly error message
   */
  getUserFriendlyMessage() {
    return this.message;
  }

  /**
   * Get detailed error information for debugging
   * @returns {Object<string, any>} Debug information object
   */
  getDebugInfo() {
    return {
      type: this.type,
      message: this.message,
      context: this.context,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : undefined,
      stack: this.stack,
    };
  }
}

/**
 * Create a network error
 * @param {string} subtype - Network error subtype
 * @param {Error} [originalError] - Original error object
 * @param {Object<string, any>} [context] - Additional context
 * @returns {AppError} Network error instance
 */
export function createNetworkError(subtype, originalError, context) {
  return new AppError({
    type: ErrorType.NETWORK,
    message: ERROR_MESSAGES.NETWORK[subtype],
    originalError,
    context,
  });
}

/**
 * Create an API error
 * @param {string} subtype - API error subtype
 * @param {Error} [originalError] - Original error object
 * @param {Object<string, any>} [context] - Additional context
 * @returns {AppError} API error instance
 */
export function createApiError(subtype, originalError, context) {
  return new AppError({
    type: ErrorType.API,
    message: ERROR_MESSAGES.API[subtype],
    originalError,
    context,
  });
}

/**
 * Create a validation error
 * @param {string} subtype - Validation error subtype
 * @param {Error} [originalError] - Original error object
 * @param {Object<string, any>} [context] - Additional context
 * @returns {AppError} Validation error instance
 */
export function createValidationError(subtype, originalError, context) {
  return new AppError({
    type: ErrorType.VALIDATION,
    message: ERROR_MESSAGES.VALIDATION[subtype],
    originalError,
    context,
  });
}

/**
 * Create an extraction error
 * @param {string} subtype - Extraction error subtype
 * @param {Error} [originalError] - Original error object
 * @param {Object<string, any>} [context] - Additional context
 * @returns {AppError} Extraction error instance
 */
export function createExtractionError(subtype, originalError, context) {
  return new AppError({
    type: ErrorType.EXTRACTION,
    message: ERROR_MESSAGES.EXTRACTION[subtype],
    originalError,
    context,
  });
}

/**
 * Create a summarization error
 * @param {string} subtype - Summarization error subtype
 * @param {Error} [originalError] - Original error object
 * @param {Object<string, any>} [context] - Additional context
 * @returns {AppError} Summarization error instance
 */
export function createSummarizationError(subtype, originalError, context) {
  return new AppError({
    type: ErrorType.SUMMARIZATION,
    message: ERROR_MESSAGES.SUMMARIZATION[subtype],
    originalError,
    context,
  });
}

/**
 * Create a file system error
 * @param {string} subtype - File system error subtype
 * @param {Error} [originalError] - Original error object
 * @param {Object<string, any>} [context] - Additional context
 * @returns {AppError} File system error instance
 */
export function createFileSystemError(subtype, originalError, context) {
  return new AppError({
    type: ErrorType.FILE_SYSTEM,
    message: ERROR_MESSAGES.FILE_SYSTEM[subtype],
    originalError,
    context,
  });
}

/**
 * Create a configuration error
 * @param {string} subtype - Configuration error subtype
 * @param {Error} [originalError] - Original error object
 * @param {Object<string, any>} [context] - Additional context
 * @returns {AppError} Configuration error instance
 */
export function createConfigurationError(subtype, originalError, context) {
  return new AppError({
    type: ErrorType.CONFIGURATION,
    message: ERROR_MESSAGES.CONFIGURATION[subtype],
    originalError,
    context,
  });
}

/**
 * Create an unknown error
 * @param {string} [message] - Error message
 * @param {Error} [originalError] - Original error object
 * @param {Object<string, any>} [context] - Additional context
 * @returns {AppError} Unknown error instance
 */
export function createUnknownError(message, originalError, context) {
  return new AppError({
    type: ErrorType.UNKNOWN,
    message: message || ERROR_MESSAGES.UNKNOWN.GENERAL_ERROR,
    originalError,
    context,
  });
}

/**
 * Handle an error by wrapping it in an AppError if it isn't one already
 * @param {unknown} error - Error to handle
 * @returns {AppError} Wrapped error instance
 */
export function handleError(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return createUnknownError(error.message, error);
  }

  return createUnknownError(
    typeof error === 'string' ? error : 'An unknown error occurred',
    undefined,
    { originalValue: error },
  );
}
