/**
 * @typedef {'short' | 'medium' | 'long'} SummaryLength
 * Summary length options
 */

/**
 * @typedef {Object} ScraperOptions
 * @property {number} [timeout] - Request timeout in milliseconds
 * @property {number} [retries] - Number of retry attempts
 * @property {string} [userAgent] - Custom user agent string
 */

/**
 * @typedef {Object} ScraperResult
 * @property {string} html - The scraped HTML content
 * @property {string} url - The URL that was scraped
 * @property {string} [title] - Optional title of the page
 * @property {Object<string, string>} [metadata] - Optional metadata object
 */

/**
 * @typedef {Object} ExtractorOptions
 * @property {string[]} [removeSelectors] - CSS selectors to remove from content
 * @property {boolean} [includeImages] - Whether to include images in extraction
 * @property {boolean} [preserveLinks] - Whether to preserve links in content
 */

/**
 * @typedef {Object} ExtractedContent
 * @property {string} title - Title of the content
 * @property {string} content - HTML string of cleaned content
 * @property {string} textContent - Plain text version
 * @property {string} [excerpt] - Optional excerpt
 * @property {string} [author] - Optional author
 * @property {Date} [publishDate] - Optional publish date
 */

/**
 * @typedef {Object} SummarizerOptions
 * @property {SummaryLength} length - Length of the summary
 * @property {boolean} [includeKeyPoints] - Whether to include key points
 * @property {string} [language] - Target language for summary
 * @property {number} [maxTokens] - Maximum tokens for AI model
 */

/**
 * @typedef {Object} SummaryResult
 * @property {string} summary - The generated summary
 * @property {string[]} [keyPoints] - Optional key points array
 * @property {number} originalWordCount - Word count of original content
 * @property {number} summaryWordCount - Word count of summary
 */

/**
 * @typedef {Object} ConverterOptions
 * @property {boolean} [includeMetadata] - Whether to include metadata in output
 * @property {'fenced' | 'indented'} [codeBlockStyle] - Code block style preference
 * @property {'atx' | 'setext'} [headingStyle] - Heading style preference
 * @property {'-' | '+' | '*'} [bulletListMarker] - Bullet list marker preference
 */

/**
 * @typedef {Object} ConversionResult
 * @property {string} markdown - The converted markdown content
 * @property {Object} [metadata] - Optional metadata object
 * @property {string} metadata.title - Title of the content
 * @property {string} metadata.url - Source URL
 * @property {string} metadata.date - Date of conversion
 */

/**
 * Error type constants
 * @readonly
 * @enum {string}
 */
export const ErrorType = Object.freeze({
  NETWORK: 'NETWORK',
  API: 'API',
  VALIDATION: 'VALIDATION',
  EXTRACTION: 'EXTRACTION',
  SUMMARIZATION: 'SUMMARIZATION',
  FILE_SYSTEM: 'FILE_SYSTEM',
  CONFIGURATION: 'CONFIGURATION',
  UNKNOWN: 'UNKNOWN',
});

/**
 * @typedef {Object} ErrorDetails
 * @property {string} type - Error type from ErrorType enum
 * @property {string} message - Error message
 * @property {Error} [originalError] - Original error object
 * @property {Object<string, any>} [context] - Additional error context
 */

/**
 * Log level constants
 * @readonly
 * @enum {string}
 */
export const LogLevel = Object.freeze({
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
});

/**
 * @typedef {Object} LoggerOptions
 * @property {string} level - Log level from LogLevel enum
 * @property {boolean} [enableConsole] - Whether to enable console logging
 * @property {boolean} [enableFile] - Whether to enable file logging
 * @property {string} [filePath] - Path to log file
 * @property {boolean} [includeTimestamp] - Whether to include timestamps
 * @property {boolean} [colorize] - Whether to colorize console output
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} level - Log level from LogLevel enum
 * @property {string} message - Log message
 * @property {Date} timestamp - Timestamp of log entry
 * @property {Object<string, any>} [context] - Optional context data
 */
