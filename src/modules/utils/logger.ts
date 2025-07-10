import fs from 'fs';
import path from 'path';
import { LogLevel, LoggerOptions, LogEntry } from '../../types';
import { DEFAULT_LOGGER_OPTIONS, LOG_COLORS, LOG_SYMBOLS } from '../../constants';

/**
 * Logger class for handling application logs
 */
export class Logger {
  private static instance: Logger;
  private options: LoggerOptions;

  private constructor(options: Partial<LoggerOptions> = {}) {
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
   */
  public static getInstance(options?: Partial<LoggerOptions>): Logger {
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
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Check if a log level is enabled based on current configuration
   */
  public isLevelEnabled(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.options.level);
    const targetLevelIndex = levels.indexOf(level);
    
    return targetLevelIndex >= currentLevelIndex;
  }

  /**
   * Set the current log level
   */
  public setLevel(level: LogLevel): void {
    this.options.level = level;
  }

  /**
   * Enable or disable console logging
   */
  public setConsoleLogging(enable: boolean): void {
    this.options.enableConsole = enable;
  }

  /**
   * Enable or disable file logging
   */
  public setFileLogging(enable: boolean, filePath?: string): void {
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
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    // Check if this log level should be processed
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
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
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = this.options.includeTimestamp
      ? `[${entry.timestamp.toISOString()}] `
      : '';
    
    const symbol = LOG_SYMBOLS[entry.level];
    const levelStr = `${symbol} ${entry.level}`;
    
    let contextStr = '';
    if (entry.context && Object.keys(entry.context).length > 0) {
      try {
        contextStr = `\n${JSON.stringify(entry.context, null, 2)}`;
      } catch (error) {
        contextStr = '\n[Error serializing context]';
      }
    }

    return `${timestamp}${levelStr}: ${entry.message}${contextStr}`;
  }

  /**
   * Log an entry to the console
   */
  private logToConsole(entry: LogEntry): void {
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
   */
  private logToFile(entry: LogEntry): void {
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
 */
export function configureLogger(options: Partial<LoggerOptions>): void {
  Logger.getInstance(options);
}

/**
 * Enable debug mode (sets log level to DEBUG)
 */
export function enableDebugMode(): void {
  Logger.getInstance({ level: LogLevel.DEBUG });
}
