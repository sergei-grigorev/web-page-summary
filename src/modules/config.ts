import fs from 'fs';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { createConfigurationError, createValidationError } from './utils/error';

// Load environment variables from .env file
dotenvConfig();

/**
 * Validates summary length value
 */
function isValidSummaryLength(value: string): value is 'short' | 'medium' | 'long' {
  return ['short', 'medium', 'long'].includes(value);
}

/**
 * Validates output format value
 */
function isValidOutputFormat(value: string): value is 'markdown' | 'text' {
  return ['markdown', 'text'].includes(value);
}

/**
 * Validates configuration object structure
 */
function validateConfigStructure(config: unknown): asserts config is Partial<AppConfig> {
  if (typeof config !== 'object' || config === null) {
    throw createValidationError('INVALID_FORMAT', undefined, { value: config });
  }
}

/**
 * Validates scraper configuration values
 */
function validateScraperConfig(scraper: Partial<ScraperConfig>): void {
  if (scraper.timeout !== undefined) {
    if (typeof scraper.timeout !== 'number' || scraper.timeout <= 0) {
      throw createValidationError('INVALID_OPTION', undefined, { field: 'scraper.timeout', value: scraper.timeout });
    }
  }
  
  if (scraper.retries !== undefined) {
    if (typeof scraper.retries !== 'number' || scraper.retries < 0 || scraper.retries > 10) {
      throw createValidationError('INVALID_OPTION', undefined, { field: 'scraper.retries', value: scraper.retries });
    }
  }
  
  if (scraper.retryDelay !== undefined) {
    if (typeof scraper.retryDelay !== 'number' || scraper.retryDelay < 0) {
      throw createValidationError('INVALID_OPTION', undefined, { field: 'scraper.retryDelay', value: scraper.retryDelay });
    }
  }
  
  if (scraper.userAgent !== undefined) {
    if (typeof scraper.userAgent !== 'string' || scraper.userAgent.trim().length === 0) {
      throw createValidationError('INVALID_OPTION', undefined, { field: 'scraper.userAgent', value: scraper.userAgent });
    }
  }
}

// Define configuration interfaces
export interface ApiConfig {
  // No endpoint needed as we're using the library's default
}

export interface DefaultsConfig {
  summaryLength: 'short' | 'medium' | 'long';
  outputFormat: 'markdown' | 'text';
  outputPath: string;
}

export interface ScraperConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  userAgent: string;
}

export interface ExtractorConfig {
  removeSelectors: string[];
  includeImages: boolean;
  preserveLinks: boolean;
}

export interface AppConfig {
  api: ApiConfig;
  defaults: DefaultsConfig;
  scraper: ScraperConfig;
  extractor: ExtractorConfig;
}

// Default configuration paths
const CONFIG_DIR = path.join(process.cwd(), 'config');
const DEFAULT_CONFIG_PATH = path.join(CONFIG_DIR, 'default.json');

/**
 * Load configuration from file with proper validation
 */
function loadConfigFromFile(): Partial<AppConfig> {
  try {
    if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
      const rawConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8')) as unknown;
      validateConfigStructure(rawConfig);
      
      // Validate scraper config if present
      if (rawConfig.scraper) {
        validateScraperConfig(rawConfig.scraper);
      }
      
      return rawConfig;
    }
    console.warn(`Warning: Config file not found at ${DEFAULT_CONFIG_PATH}. Using default configuration.`);
    return {};
  } catch (error) {
    if (error instanceof Error && error.name === 'AppError') {
      throw error;
    }
    throw createConfigurationError('CONFIG_FILE_ERROR', error instanceof Error ? error : new Error(String(error)));
  }
}

// Merge configurations with environment variables having higher priority
function mergeConfigs(fileConfig: Partial<AppConfig>): AppConfig {
  // Default configuration
  const defaultConfig: AppConfig = {
    api: {
      // Using library's default endpoint
    },
    defaults: {
      summaryLength: 'medium',
      outputFormat: 'markdown',
      outputPath: './summaries',
    },
    scraper: {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      userAgent: 'Mozilla/5.0 (compatible; ArticleSummarizer/1.0)',
    },
    extractor: {
      removeSelectors: ['nav', 'header', 'footer', '.ads', '.comments', '.sidebar'],
      includeImages: false,
      preserveLinks: true,
    },
  };

  // Merge with file config
  const mergedConfig = { ...defaultConfig, ...fileConfig };

  // Apply environment variables (highest priority)
  if (process.env['GEMINI_API_KEY']) {
    // The API key is only available from environment variables
    process.env['GEMINI_API_KEY'] = process.env['GEMINI_API_KEY'].trim();
  }

  if (process.env['DEFAULT_SUMMARY_LENGTH']) {
    const length = process.env['DEFAULT_SUMMARY_LENGTH'];
    if (isValidSummaryLength(length)) {
      mergedConfig.defaults.summaryLength = length;
    } else {
      throw createValidationError('INVALID_OPTION', undefined, { field: 'DEFAULT_SUMMARY_LENGTH', value: length });
    }
  }

  if (process.env['DEFAULT_OUTPUT_FORMAT']) {
    const format = process.env['DEFAULT_OUTPUT_FORMAT'];
    if (isValidOutputFormat(format)) {
      mergedConfig.defaults.outputFormat = format;
    } else {
      throw createValidationError('INVALID_OPTION', undefined, { field: 'DEFAULT_OUTPUT_FORMAT', value: format });
    }
  }

  if (process.env['DEFAULT_OUTPUT_PATH']) {
    mergedConfig.defaults.outputPath = process.env['DEFAULT_OUTPUT_PATH'];
  }

  if (process.env['SCRAPER_TIMEOUT']) {
    const timeout = parseInt(process.env['SCRAPER_TIMEOUT'], 10);
    if (!isNaN(timeout) && timeout > 0) {
      mergedConfig.scraper.timeout = timeout;
    } else {
      throw createValidationError('INVALID_OPTION', undefined, { field: 'SCRAPER_TIMEOUT', value: process.env['SCRAPER_TIMEOUT'] });
    }
  }

  if (process.env['SCRAPER_RETRIES']) {
    const retries = parseInt(process.env['SCRAPER_RETRIES'], 10);
    if (!isNaN(retries) && retries >= 0 && retries <= 10) {
      mergedConfig.scraper.retries = retries;
    } else {
      throw createValidationError('INVALID_OPTION', undefined, { field: 'SCRAPER_RETRIES', value: process.env['SCRAPER_RETRIES'] });
    }
  }

  if (process.env['SCRAPER_RETRY_DELAY']) {
    const retryDelay = parseInt(process.env['SCRAPER_RETRY_DELAY'], 10);
    if (!isNaN(retryDelay) && retryDelay >= 0) {
      mergedConfig.scraper.retryDelay = retryDelay;
    } else {
      throw createValidationError('INVALID_OPTION', undefined, { field: 'SCRAPER_RETRY_DELAY', value: process.env['SCRAPER_RETRY_DELAY'] });
    }
  }

  return mergedConfig;
}

// Load and merge configurations
const fileConfig = loadConfigFromFile();
const config = mergeConfigs(fileConfig);

export function getConfig(): AppConfig {
  return config;
}

/**
 * Get and validate API key from environment
 */
export function getApiKey(): string {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey || apiKey.trim().length === 0) {
    throw createConfigurationError('MISSING_API_KEY');
  }
  return apiKey.trim();
}