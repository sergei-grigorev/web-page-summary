import { Command } from 'commander';
import path from 'path';
import { getConfig } from './config';
import { SummaryLength, LogLevel } from '../types';
import { logger, enableDebugMode } from './utils/logger';
import { createValidationError, handleError, AppError } from './utils/error';

interface CLIOptions {
  url?: string;
  output?: string;
  length?: SummaryLength;
  apiKey?: string;
  verbose?: boolean;
  config?: boolean;
  debug?: boolean;
  logFile?: string;
}

/**
 * Initialize and configure the CLI command parser
 */
export function initializeCLI(): Command {
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
      path.join(config.defaults.outputPath, 'summary.md')
    )
    .option(
      '-l, --length <length>', 
      'Length of the summary (short, medium, long)', 
      config.defaults.summaryLength
    )
    .option('-k, --api-key <key>', 'Gemini API key (overrides environment variable)')
    .option('-v, --verbose', 'Enable verbose output (INFO level logs)', false)
    .option('-d, --debug', 'Enable debug mode (DEBUG level logs)', false)
    .option('--log-file <path>', 'Save logs to file')
    .option('-c, --config', 'Configure default settings', false);

  return program;
}

/**
 * Parse command line arguments and validate input
 */
export function parseArguments(argv: string[]): CLIOptions {
  const program = initializeCLI();
  program.parse(argv);
  
  const options = program.opts<CLIOptions>();
  
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
 */
function configureLogging(options: CLIOptions): void {
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
 */
function validateOptions(options: CLIOptions, program: Command): void {
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
    new URL(options.url as string);
  } catch (error) {
    logger.error(`Invalid URL format: ${options.url}`, { error });
    throw createValidationError('INVALID_FORMAT', error as Error, { url: options.url });
  }

  // Validate summary length
  if (options.length && !['short', 'medium', 'long'].includes(options.length)) {
    logger.error(`Invalid summary length: ${options.length}`, { validOptions: ['short', 'medium', 'long'] });
    throw createValidationError('INVALID_OPTION', undefined, { 
      option: 'length', 
      value: options.length, 
      validValues: ['short', 'medium', 'long'] 
    });
  }
}

/**
 * Display progress message to user
 */
export function showProgress(message: string, context?: Record<string, any>): void {
  logger.info(`🔄 ${message}`, context);
}

/**
 * Display success message to user
 */
export function showSuccess(message: string, context?: Record<string, any>): void {
  logger.info(`✅ ${message}`, context);
}

/**
 * Display error message to user
 */
export function showError(message: string, error?: Error | AppError): void {
  logger.error(`❌ ${message}`, error instanceof AppError ? error.getDebugInfo() : error);
}
