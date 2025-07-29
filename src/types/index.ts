// Summary length options
export type SummaryLength = 'short' | 'medium' | 'long';

// Scraper module types
export interface ScraperOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  userAgent?: string;
}

export interface ScraperResult {
  html: string;
  url: string;
  title?: string;
  metadata: {
    [key: string]: string;
  };
}

// Extractor module types
export interface ExtractorOptions {
  removeSelectors?: string[];
  includeImages?: boolean;
  preserveLinks?: boolean;
}

export interface ExtractedContent {
  title: string;
  content: string; // HTML string of cleaned content
  textContent: string; // Plain text version
  excerpt?: string;
  author?: string;
  publishDate?: Date;
}

// Summarizer module types
export interface SummarizerOptions {
  length: SummaryLength;
  includeKeyPoints?: boolean;
  language?: string;
  maxTokens?: number;
}

export interface SummaryResult {
  summary: string;
  keyPoints?: string[];
  originalWordCount: number;
  summaryWordCount: number;
}

// Converter module types
export interface ConverterOptions {
  includeMetadata?: boolean;
  codeBlockStyle?: 'fenced' | 'indented';
  headingStyle?: 'atx' | 'setext';
  bulletListMarker?: '-' | '+' | '*';
}

export interface ConversionResult {
  markdown: string;
  metadata?: {
    title: string;
    url: string;
    date: string;
    [key: string]: unknown;
  };
}

// Error handling types
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  EXTRACTION = 'EXTRACTION',
  SUMMARIZATION = 'SUMMARIZATION',
  FILE_SYSTEM = 'FILE_SYSTEM',
  CONFIGURATION = 'CONFIGURATION',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  originalError: Error | undefined;
  context: Record<string, unknown> | undefined;
}

// Logging types
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LoggerOptions {
  level: LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  filePath?: string;
  includeTimestamp?: boolean;
  colorize?: boolean;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context: Record<string, unknown> | undefined;
}

// Utility types for better type safety and code reuse

/**
 * Configuration with only required fields from ScraperOptions
 */
export type RequiredScraperConfig = Required<Pick<ScraperOptions, 'timeout' | 'retries'>>;

/**
 * Partial SummarizerOptions for updates
 */
export type PartialSummarizerOptions = Partial<SummarizerOptions>;

/**
 * Extract only metadata fields from ConversionResult
 */
export type ArticleMetadata = NonNullable<ConversionResult['metadata']>;

/**
 * Summary result without word counts (for lightweight operations)
 */
export type SummaryWithoutCounts = Omit<SummaryResult, 'originalWordCount' | 'summaryWordCount'>;

/**
 * Branded type for validated URLs for enhanced type safety
 */
export type ValidatedUrl = string & { readonly __brand: 'ValidatedUrl' };

/**
 * Branded type for sanitized file paths
 */
export type SafeFilePath = string & { readonly __brand: 'SafeFilePath' };

/**
 * Union type for all possible error subtypes
 */
export type ErrorSubtype = 
  | keyof typeof import('../constants').ERROR_MESSAGES.NETWORK
  | keyof typeof import('../constants').ERROR_MESSAGES.API
  | keyof typeof import('../constants').ERROR_MESSAGES.VALIDATION
  | keyof typeof import('../constants').ERROR_MESSAGES.EXTRACTION
  | keyof typeof import('../constants').ERROR_MESSAGES.SUMMARIZATION
  | keyof typeof import('../constants').ERROR_MESSAGES.FILE_SYSTEM
  | keyof typeof import('../constants').ERROR_MESSAGES.CONFIGURATION;

/**
 * Type guard function type
 */
export type TypeGuard<T> = (value: unknown) => value is T;
