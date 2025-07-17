import fs from 'fs';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file
dotenvConfig();

/**
 * @typedef {Object} ApiConfig
 * API configuration (using library's default endpoint)
 */

/**
 * @typedef {Object} DefaultsConfig
 * @property {'short' | 'medium' | 'long'} summaryLength - Default summary length
 * @property {'markdown' | 'text'} outputFormat - Default output format
 * @property {string} outputPath - Default output path
 */

/**
 * @typedef {Object} ScraperConfig
 * @property {number} timeout - Request timeout in milliseconds
 * @property {number} retries - Number of retry attempts
 * @property {string} userAgent - User agent string
 */

/**
 * @typedef {Object} ExtractorConfig
 * @property {string[]} removeSelectors - CSS selectors to remove
 * @property {boolean} includeImages - Whether to include images
 * @property {boolean} preserveLinks - Whether to preserve links
 */

/**
 * @typedef {Object} AppConfig
 * @property {ApiConfig} api - API configuration
 * @property {DefaultsConfig} defaults - Default settings
 * @property {ScraperConfig} scraper - Scraper configuration
 * @property {ExtractorConfig} extractor - Extractor configuration
 */

// Default configuration paths
const CONFIG_DIR = path.join(process.cwd(), 'config');
const DEFAULT_CONFIG_PATH = path.join(CONFIG_DIR, 'default.json');

/**
 * Load configuration from file
 * @returns {Partial<AppConfig>} Partial configuration object
 */
function loadConfigFromFile() {
  try {
    if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8'));
      return config;
    }
    console.warn(`Warning: Config file not found at ${DEFAULT_CONFIG_PATH}. Using default configuration.`);
    return {};
  } catch (error) {
    console.error('Error loading config file:', error);
    return {};
  }
}

/**
 * Merge configurations with environment variables having higher priority
 * @param {Partial<AppConfig>} fileConfig - Configuration from file
 * @returns {AppConfig} Merged configuration
 */
function mergeConfigs(fileConfig) {
  // Default configuration
  const defaultConfig = {
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
    const length = process.env.DEFAULT_SUMMARY_LENGTH;
    if (['short', 'medium', 'long'].includes(length)) {
      mergedConfig.defaults.summaryLength = length;
    }
  }

  if (process.env.DEFAULT_OUTPUT_FORMAT) {
    const format = process.env.DEFAULT_OUTPUT_FORMAT;
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

/**
 * Get the application configuration
 * @returns {AppConfig} Application configuration
 */
export function getConfig() {
  return config;
}

/**
 * Get the API key from environment variables
 * @returns {string} API key
 * @throws {Error} If API key is not set
 */
export function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env file.');
  }
  return apiKey;
}