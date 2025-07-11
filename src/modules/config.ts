import fs from 'fs';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file
dotenvConfig();

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

// Load configuration from file
function loadConfigFromFile(): Partial<AppConfig> {
  try {
    if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8')) as Partial<AppConfig>;
      return config;
    }
    console.warn(`Warning: Config file not found at ${DEFAULT_CONFIG_PATH}. Using default configuration.`);
    return {};
  } catch (error) {
    console.error('Error loading config file:', error);
    return {};
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
  if (process.env.GEMINI_API_KEY) {
    // The API key is only available from environment variables
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY.trim();
  }

  if (process.env.DEFAULT_SUMMARY_LENGTH) {
    const length = process.env.DEFAULT_SUMMARY_LENGTH as 'short' | 'medium' | 'long';
    if (['short', 'medium', 'long'].includes(length)) {
      mergedConfig.defaults.summaryLength = length;
    }
  }

  if (process.env.DEFAULT_OUTPUT_FORMAT) {
    const format = process.env.DEFAULT_OUTPUT_FORMAT as 'markdown' | 'text';
    if (['markdown', 'text'].includes(format)) {
      mergedConfig.defaults.outputFormat = format;
    }
  }

  if (process.env.DEFAULT_OUTPUT_PATH) {
    mergedConfig.defaults.outputPath = process.env.DEFAULT_OUTPUT_PATH;
  }

  if (process.env.SCRAPER_TIMEOUT) {
    const timeout = parseInt(process.env.SCRAPER_TIMEOUT, 10);
    if (!isNaN(timeout)) {
      mergedConfig.scraper.timeout = timeout;
    }
  }

  if (process.env.SCRAPER_RETRIES) {
    const retries = parseInt(process.env.SCRAPER_RETRIES, 10);
    if (!isNaN(retries)) {
      mergedConfig.scraper.retries = retries;
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

export function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env file.');
  }
  return apiKey;
}