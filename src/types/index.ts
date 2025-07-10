// Summary length options
export type SummaryLength = 'short' | 'medium' | 'long';

// Scraper module types
export interface ScraperOptions {
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

export interface ScraperResult {
  html: string;
  url: string;
  title?: string;
  metadata?: {
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
    [key: string]: any;
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
  originalError?: Error;
  context?: Record<string, any>;
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
  context?: Record<string, any>;
}
