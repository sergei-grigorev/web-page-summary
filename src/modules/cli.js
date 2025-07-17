import { Command } from 'commander';
import path from 'path';
import { getConfig } from './config.js';
import { LogLevel } from '../types/index.js';
import { logger, enableDebugMode } from './utils/logger.js';
import { createValidationError, handleError, AppError } from './utils/error.js';

/**
 * @typedef {Object} CLIOptions
 * @property {string} [url] - URL of the article to summarize
 * @property {string} [output] - Output file path for the summary
 * @property {import('../types/index.js').SummaryLength} [length] - Length of the summary
 * @property {string} [apiKey] - Gemini API key
 * @property {boolean} [verbose] - Enable verbose output
 * @property {boolean} [config] - Configure default settings
 * @property {boolean} [debug] - Enable debug mode
 * @property {string} [logFile] - Save logs to file
 */

/**
 * Initialize and configure the CLI command parser
 * @returns {Command} Configured commander program
 */
export function initializeCLI() {
  const config = getConfig();
  const program = new Command();

  program
    .name('summarizer')
    .description('CLI tool for summarizing web articles using AI')
    .version('1.0.0');

  program
    .option('-u, --url <url>', 'URL of the article to summarize')
    .option(
      '-o, --output <path>', 
      'Output file path for the summary', 
      path.join(config.defaults.outputPath, 'summary.md'),
    )
    .option(
      '-l, --length <length>', 
      'Length of the summary (short, medium, long)', 
      config.defaults.summaryLength,
    )
    .option('-k, --api-key <key>', 'Gemini API key (overrides environment variable)')
    .option('-v, --verbose', 'Enable verbose output (INFO level logs)')
    .option('-d, --debug', 'Enable debug mode (DEBUG level logs)')
    .option('--log-file <path>', 'Save logs to file')
    .option('-c, --config', 'Configure default settings');
    
  // Set default values for boolean options in commander v14
  program.setOptionValueWithSource('verbose', false, 'default');
  program.setOptionValueWithSource('debug', false, 'default');
  program.setOptionValueWithSource('config', false, 'default');

  return program;
}

/**
 * Parse command line arguments and validate input
 * @param {string[]} argv - Command line arguments
 * @returns {CLIOptions} Parsed CLI options
 */
export function parseArguments(argv) {
  const program = initializeCLI();
  program.parse(argv);
  
  const options = program.opts();
  
  // Configure logging based on options
  configureLogging(options);
  
  try {
    validateOptions(options, program);
    logger.debug('Command line arguments parsed successfully', { options });
    return options;
  } catch (error) {
    const appError = handleError(error);
    showError(appError.getUserFriendlyMessage(), appError);
    process.exit(1);
  }
}

/**
 * Configure logging based on CLI options
 * @param {CLIOptions} options - CLI options
 */
function configureLogging(options) {
  if (options.debug) {
    enableDebugMode();
    logger.debug('Debug mode enabled');
  } else if (options.verbose) {
    logger.setLevel(LogLevel.INFO);
    logger.info('Verbose mode enabled');
  }

  if (options.logFile) {
    logger.setFileLogging(true, options.logFile);
    logger.info(`Log file enabled: ${options.logFile}`);
  }
}

/**
 * Validate CLI options and show help if needed
 * @param {CLIOptions} options - CLI options to validate
 * @param {Command} program - Commander program instance
 */
function validateOptions(options, program) {
  // If config flag is set, we don't need a URL
  if (options.config) {
    return;
  }

  // URL is required unless we're just showing config
  if (!options.url) {
    logger.error('URL is required');
    program.help();
    throw createValidationError('MISSING_REQUIRED_FIELD', undefined, { field: 'url' });
  }

  // Validate URL format
  try {
    new URL(options.url);
  } catch (error) {
    logger.error(`Invalid URL format: ${options.url}`, { error });
    throw createValidationError('INVALID_FORMAT', error, { url: options.url });
  }

  // Validate summary length
  if (options.length && !['short', 'medium', 'long'].includes(options.length)) {
    logger.error(`Invalid summary length: ${options.length}`, { validOptions: ['short', 'medium', 'long'] });
    throw createValidationError('INVALID_OPTION', undefined, { 
      option: 'length', 
      value: options.length, 
      validValues: ['short', 'medium', 'long'], 
    });
  }
}

/**
 * Display progress message to user
 * @param {string} message - Progress message
 * @param {Record<string, any>} [context] - Additional context
 */
export function showProgress(message, context) {
  logger.info(`🔄 ${message}`, context);
}

/**
 * Display success message to user
 * @param {string} message - Success message
 * @param {Record<string, any>} [context] - Additional context
 */
export function showSuccess(message, context) {
  logger.info(`✅ ${message}`, context);
}

/**
 * Display error message to user
 * @param {string} message - Error message
 * @param {Error | import('./utils/error.js').AppError} [error] - Error object
 */
export function showError(message, error) {
  logger.error(`❌ ${message}`, error instanceof AppError ? error.getDebugInfo() : error);
}
