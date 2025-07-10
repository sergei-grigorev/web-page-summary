import { Command } from 'commander';
import path from 'path';
import { getConfig } from './config';
import { SummaryLength } from '../types';

interface CLIOptions {
  url?: string;
  output?: string;
  length?: SummaryLength;
  apiKey?: string;
  verbose?: boolean;
  config?: boolean;
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
    .option('-v, --verbose', 'Enable verbose output', false)
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
  validateOptions(options, program);
  
  return options;
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
    console.error('Error: URL is required');
    program.help();
  }

  // Validate URL format
  try {
    new URL(options.url as string);
  } catch (error) {
    console.error(`Error: Invalid URL format: ${options.url}`);
    process.exit(1);
  }

  // Validate summary length
  if (options.length && !['short', 'medium', 'long'].includes(options.length)) {
    console.error(`Error: Invalid summary length: ${options.length}. Must be one of: short, medium, long`);
    process.exit(1);
  }
}

/**
 * Display progress message to user
 */
export function showProgress(message: string, verbose = false): void {
  console.log(`🔄 ${message}`);
}

/**
 * Display success message to user
 */
export function showSuccess(message: string): void {
  console.log(`✅ ${message}`);
}

/**
 * Display error message to user
 */
export function showError(message: string, error?: Error): void {
  console.error(`❌ ${message}`);
  if (error && process.env.NODE_ENV === 'development') {
    console.error(error);
  }
}
