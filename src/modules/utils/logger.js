import fs from 'fs';
import path from 'path';
import { LogLevel } from '../../types/index.js';
import { DEFAULT_LOGGER_OPTIONS, LOG_COLORS, LOG_SYMBOLS } from '../../constants.js';

/**
 * Logger class for handling application logs
 */
export class Logger {
  /** @type {Logger} */
  static instance;
  
  /**
   * @param {Partial<import('../../types/index.js').LoggerOptions>} [options={}] - Logger options
   */
  constructor(options = {}) {
    /** @type {import('../../types/index.js').LoggerOptions} */
    this.options = { ...DEFAULT_LOGGER_OPTIONS, ...options };
    
    // Create log directory if file logging is enabled
    if (this.options.enableFile && this.options.filePath) {
      const logDir = path.dirname(this.options.filePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  /**
   * Get logger instance (singleton)
   * @param {Partial<import('../../types/index.js').LoggerOptions>} [options] - Logger options
   * @returns {Logger} Logger instance
   */
  static getInstance(options) {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    } else if (options) {
      // Update options if provided
      Logger.instance.options = { ...Logger.instance.options, ...options };
    }
    
    return Logger.instance;
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {Object<string, any>} [context] - Optional context data
   */
  debug(message, context) {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object<string, any>} [context] - Optional context data
   */
  info(message, context) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {Object<string, any>} [context] - Optional context data
   */
  warn(message, context) {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Object<string, any>} [context] - Optional context data
   */
  error(message, context) {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Check if a log level is enabled based on current configuration
   * @param {string} level - Log level to check
   * @returns {boolean} Whether the level is enabled
   */
  isLevelEnabled(level) {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.options.level);
    const targetLevelIndex = levels.indexOf(level);
    
    return targetLevelIndex >= currentLevelIndex;
  }

  /**
   * Set the current log level
   * @param {string} level - Log level from LogLevel enum
   */
  setLevel(level) {
    this.options.level = level;
  }

  /**
   * Enable or disable console logging
   * @param {boolean} enable - Whether to enable console logging
   */
  setConsoleLogging(enable) {
    this.options.enableConsole = enable;
  }

  /**
   * Enable or disable file logging
   * @param {boolean} enable - Whether to enable file logging
   * @param {string} [filePath] - Optional file path for logs
   */
  setFileLogging(enable, filePath) {
    this.options.enableFile = enable;
    if (filePath) {
      this.options.filePath = filePath;
      
      // Create log directory if it doesn't exist
      const logDir = path.dirname(filePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  /**
   * Log a message with the specified level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object<string, any>} [context] - Optional context data
   * @private
   */
  log(level, message, context) {
    // Check if this log level should be processed
    if (!this.isLevelEnabled(level)) {
      return;
    }

    /** @type {import('../../types/index.js').LogEntry} */
    const logEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
    };

    // Log to console if enabled
    if (this.options.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Log to file if enabled
    if (this.options.enableFile && this.options.filePath) {
      this.logToFile(logEntry);
    }
  }

  /**
   * Format a log entry for output
   * @param {import('../../types/index.js').LogEntry} entry - Log entry to format
   * @returns {string} Formatted log message
   * @private
   */
  formatLogEntry(entry) {
    const timestamp = this.options.includeTimestamp
      ? `[${entry.timestamp.toISOString()}] `
      : '';
    
    const symbol = LOG_SYMBOLS[entry.level];
    const levelStr = `${symbol} ${entry.level}`;
    
    let contextStr = '';
    if (entry.context && Object.keys(entry.context).length > 0) {
      try {
        contextStr = `\n${JSON.stringify(entry.context, null, 2)}`;
      } catch (_error) {
        contextStr = '\n[Error serializing context]';
      }
    }

    return `${timestamp}${levelStr}: ${entry.message}${contextStr}`;
  }

  /**
   * Log an entry to the console
   * @param {import('../../types/index.js').LogEntry} entry - Log entry to output
   * @private
   */
  logToConsole(entry) {
    const formattedMessage = this.formatLogEntry(entry);
    
    if (this.options.colorize) {
      const color = LOG_COLORS[entry.level];
      const reset = LOG_COLORS.RESET;
      
      switch (entry.level) {
      case LogLevel.ERROR:
        console.error(`${color}${formattedMessage}${reset}`);
        break;
      case LogLevel.WARN:
        console.warn(`${color}${formattedMessage}${reset}`);
        break;
      case LogLevel.INFO:
        console.info(`${color}${formattedMessage}${reset}`);
        break;
      case LogLevel.DEBUG:
      default:
        console.debug(`${color}${formattedMessage}${reset}`);
        break;
      }
    } else {
      switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
      default:
        console.debug(formattedMessage);
        break;
      }
    }
  }

  /**
   * Log an entry to a file
   * @param {import('../../types/index.js').LogEntry} entry - Log entry to write
   * @private
   */
  logToFile(entry) {
    if (!this.options.filePath) return;
    
    try {
      const formattedMessage = this.formatLogEntry(entry);
      fs.appendFileSync(this.options.filePath, `${formattedMessage}\n`);
    } catch (error) {
      // If file logging fails, log to console as a fallback
      console.error(`Failed to write to log file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export a default logger instance
export const logger = Logger.getInstance();

/**
 * Set global logger options
 * @param {Partial<import('../../types/index.js').LoggerOptions>} options - Logger options
 */
export function configureLogger(options) {
  Logger.getInstance(options);
}

/**
 * Enable debug mode (sets log level to DEBUG)
 */
export function enableDebugMode() {
  Logger.getInstance({ level: LogLevel.DEBUG });
}
