import { LogLevel } from './types/index.js';

// Default configuration constants
export const DEFAULT_TIMEOUT = 10000; // 10 seconds
export const DEFAULT_RETRIES = 3;
export const DEFAULT_USER_AGENT = 'Article Summarizer CLI';

// Default output paths
export const DEFAULT_OUTPUT_DIR = './summaries';

// Error handling constants
export const ERROR_MESSAGES = Object.freeze({
  NETWORK: Object.freeze({
    CONNECTION_FAILED: 'Failed to connect to the server',
    TIMEOUT: 'Request timed out',
    INVALID_URL: 'Invalid URL format',
    INVALID_RESPONSE: 'Invalid response from server',
  }),
  API: Object.freeze({
    AUTHENTICATION_FAILED: 'API authentication failed',
    RATE_LIMIT_EXCEEDED: 'API rate limit exceeded',
    INVALID_RESPONSE: 'Invalid API response',
    SERVICE_UNAVAILABLE: 'API service is currently unavailable',
  }),
  VALIDATION: Object.freeze({
    MISSING_REQUIRED_FIELD: 'Missing required field',
    INVALID_FORMAT: 'Invalid format',
    INVALID_OPTION: 'Invalid option value',
  }),
  EXTRACTION: Object.freeze({
    NO_CONTENT_FOUND: 'No content could be extracted from the page',
    PARSING_FAILED: 'Failed to parse page content',
  }),
  SUMMARIZATION: Object.freeze({
    GENERATION_FAILED: 'Failed to generate summary',
    CONTENT_TOO_LONG: 'Content is too long for summarization',
    CONTENT_TOO_SHORT: 'Content is too short for summarization',
  }),
  FILE_SYSTEM: Object.freeze({
    WRITE_FAILED: 'Failed to write to file',
    READ_FAILED: 'Failed to read from file',
    PERMISSION_DENIED: 'Permission denied',
    FILE_NOT_FOUND: 'File not found',
  }),
  CONFIGURATION: Object.freeze({
    INVALID_CONFIG: 'Invalid configuration',
    MISSING_API_KEY: 'Missing API key',
    CONFIG_FILE_ERROR: 'Error loading configuration file',
  }),
  UNKNOWN: Object.freeze({
    GENERAL_ERROR: 'An unexpected error occurred',
  }),
});

// Logging constants
export const DEFAULT_LOGGER_OPTIONS = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  filePath: './logs/summarizer.log',
  includeTimestamp: true,
  colorize: true,
};

export const LOG_COLORS = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m',  // Green
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
  RESET: '\x1b[0m',
};

export const LOG_SYMBOLS = {
  [LogLevel.DEBUG]: '🔍',
  [LogLevel.INFO]: 'ℹ️',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.ERROR]: '❌',
};
