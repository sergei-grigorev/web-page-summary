# TypeScript Web Article Summarizer CLI - Architecture Plan

## 1. Project Overview

The Article Summarizer CLI is a command-line tool built with TypeScript and Node.js that processes web articles by scraping their content, cleaning it, and generating AI-powered summaries in Markdown format.

## 2. Core Components

### 2.1 Project Structure

```
summarizer/
├── src/
│   ├── index.ts                # Main CLI entry point
│   ├── types/
│   │   └── index.ts            # Type definitions
│   ├── modules/
│   │   ├── cli.ts              # CLI argument parser
│   │   ├── config.ts           # Configuration handler
│   │   ├── scraper.ts          # Web content scraper
│   │   ├── extractor.ts        # Content extraction & cleaning
│   │   ├── summarizer.ts       # AI summarization service
│   │   ├── converter.ts        # Markdown conversion
│   │   └── utils/
│   │       ├── logger.ts       # Logging utilities
│   │       └── error.ts        # Error handling utilities
│   └── constants.ts            # Constants and defaults
├── config/
│   └── default.json            # Default configuration
├── tests/                      # Unit & integration tests
├── dist/                       # Compiled JavaScript output
├── package.json
├── tsconfig.json
├── .env.example                # Template for environment variables
└── README.md
```

## 3. Implementation Plan

### 3.1 Setup Project Infrastructure (Phase 1)

1. **Initialize TypeScript Project**
   - Create package.json with necessary dependencies
   - Configure TypeScript (tsconfig.json)
   - Set up build process and scripts
   
2. **Install Core Dependencies**
   - commander.js for CLI argument parsing
   - cheerio for HTML parsing
   - axios for HTTP requests
   - turndown for HTML to Markdown conversion
   - dotenv for environment variable management
   - node-cache for optional caching
   - @google/generative-ai for Gemini API integration

3. **Create Directory Structure**
   - Organize project according to the structure outlined above

### 3.2 Core Functionality Implementation (Phase 2)

#### 3.2.1 Configuration Module

1. **Create Configuration Handler**
   - Implement loading of configuration from file
   - Support for environment variables
   - Handle API keys securely
   - Define default settings

2. **Define Type Interfaces**
   - Create types for configuration options
   - Define interfaces for module interactions

#### 3.2.2 CLI Interface

1. **Implement Command Parser**
   - Define CLI commands and arguments using commander.js
   - Support --url, --output, --length, and other options
   - Add help command and documentation

2. **User Interaction Flow**
   - Handle input validation
   - Implement user feedback (progress indicators, errors)
   - Format output messages

#### 3.2.3 Web Scraper Module

1. **URL Validation & Normalization**
   - Validate input URLs
   - Normalize URLs (handle redirects, etc.)

2. **HTTP Request Handling**
   - Implement page fetching with axios
   - Add appropriate headers (user agent, etc.)
   - Handle timeouts and retries

3. **Error Handling**
   - Network errors
   - Invalid URLs
   - Response handling (status codes)

#### 3.2.4 Content Extraction Module

1. **HTML Parsing**
   - Use cheerio to parse HTML content
   - Create robust selectors for different site structures

2. **Content Cleaning Algorithms**
   - Identify and extract main article content
   - Remove ads, navigation, sidebars, comments
   - Handle different website layouts intelligently

3. **Text Normalization**
   - Clean whitespace, special characters
   - Format paragraphs and sections
   - Handle encoding issues

#### 3.2.5 AI Summarization Module

1. **Gemini API Integration**
   - Implement API client for Google's Gemini
   - Handle authentication and requests
   - Properly format prompts for best results

2. **Summary Length Management**
   - Implement short, medium, and long summary options
   - Adjust prompt engineering based on length

3. **Error Handling & Fallbacks**
   - Handle API limits and errors
   - Implement retry logic
   - Provide fallback options if API fails

#### 3.2.6 Markdown Conversion Module

1. **HTML to Markdown Conversion**
   - Implement turndown for converting HTML to Markdown
   - Handle special cases (code blocks, tables, etc.)

2. **Output Formatting**
   - Structure the summary with proper headings
   - Include metadata (original URL, date)
   - Format according to common Markdown standards

3. **File Output**
   - Save to file with appropriate naming
   - Handle file system errors
   - Support for custom filenames

### 3.3 Error Handling & Logging (Phase 3)

1. **Centralized Error Handler**
   - Create consistent error types
   - Implement user-friendly error messages
   - Support verbose debugging mode

2. **Logging System**
   - Implement different log levels
   - Console output formatting
   - Optional file logging

### 3.4 Testing & Quality Assurance (Phase 4)

1. **Unit Tests**
   - Test individual modules with Jest or Mocha
   - Mock external dependencies

2. **Integration Tests**
   - Test end-to-end workflows
   - Verify CLI functionality

3. **Error Case Testing**
   - Validate handling of edge cases
   - Test network failures, API issues

### 3.5 Documentation & Packaging (Phase 5)

1. **README and Documentation**
   - Installation instructions
   - Usage examples
   - Configuration options

2. **Package for Distribution**
   - Create NPM package
   - Set up binary/executable
   - Publish to npm registry (optional)

## 4. Detailed Module Specifications

### 4.1 Scraper Module

The scraper module will be responsible for:
- Validating and normalizing input URLs
- Fetching web page content
- Handling HTTP requests with appropriate headers
- Managing timeouts and retries
- Returning raw HTML content

**Interface:**
```typescript
interface ScraperOptions {
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

interface ScraperResult {
  html: string;
  url: string;
  title?: string;
  metadata?: {
    [key: string]: string;
  };
}

async function scrapeUrl(url: string, options?: ScraperOptions): Promise<ScraperResult>;
```

### 4.2 Extractor Module

The extractor module will:
- Parse HTML using cheerio
- Identify and extract main content
- Remove non-content elements (ads, navigation, etc.)
- Clean and normalize text
- Return structured content

**Interface:**
```typescript
interface ExtractorOptions {
  removeSelectors?: string[];
  includeImages?: boolean;
  preserveLinks?: boolean;
}

interface ExtractedContent {
  title: string;
  content: string; // HTML string of cleaned content
  textContent: string; // Plain text version
  excerpt?: string;
  author?: string;
  publishDate?: Date;
}

async function extractContent(html: string, url: string, options?: ExtractorOptions): Promise<ExtractedContent>;
```

### 4.3 Summarizer Module

The summarizer module will:
- Connect to Google's Gemini API
- Format content for summarization
- Request and receive AI-generated summaries
- Handle different summary lengths

**Interface:**
```typescript
type SummaryLength = 'short' | 'medium' | 'long';

interface SummarizerOptions {
  length: SummaryLength;
  includeKeyPoints?: boolean;
  language?: string;
  maxTokens?: number;
}

interface SummaryResult {
  summary: string;
  keyPoints?: string[];
  originalWordCount: number;
  summaryWordCount: number;
}

async function summarize(content: string, options: SummarizerOptions): Promise<SummaryResult>;
```

### 4.4 Converter Module

The converter module will:
- Convert HTML to Markdown
- Format the summary with proper structure
- Add metadata and attribution

**Interface:**
```typescript
interface ConverterOptions {
  includeMetadata?: boolean;
  codeBlockStyle?: 'fenced' | 'indented';
  headingStyle?: 'atx' | 'setext';
  bulletListMarker?: '-' | '+' | '*';
}

interface ConversionResult {
  markdown: string;
  metadata?: {
    title: string;
    url: string;
    date: string;
    [key: string]: any;
  };
}

function convertToMarkdown(content: string, options?: ConverterOptions): ConversionResult;
```

### 4.5 Configuration Module

The configuration module will:
- Load and parse configuration files
- Handle environment variables
- Provide defaults for missing options
- Validate configuration values

**Interface:**
```typescript
interface AppConfig {
  api: {
    geminiApiKey: string;
    endpoint?: string;
  };
  defaults: {
    summaryLength: SummaryLength;
    outputFormat: 'markdown' | 'text';
    outputPath: string;
  };
  scraper: ScraperOptions;
  extractor: ExtractorOptions;
}

function loadConfig(configPath?: string): AppConfig;
function getConfigValue<T>(key: string, defaultValue?: T): T;
```

## 5. CLI Usage Examples

```
# Basic usage
summarizer --url https://example.com/article

# Specify output file
summarizer --url https://example.com/article --output summary.md

# Control summary length
summarizer --url https://example.com/article --length short

# Set API key via command line
summarizer --url https://example.com/article --api-key YOUR_API_KEY

# Configure default settings
summarizer --config
```

## 6. Extensions & Future Improvements

1. **Batch Processing**
   - Support for processing multiple URLs at once
   - Read URLs from file

2. **Output Formats**
   - Support for additional output formats (HTML, PDF, etc.)
   - Custom templates

3. **Content Analysis**
   - Sentiment analysis of articles
   - Topic categorization
   - Key entity extraction

4. **Caching Layer**
   - Cache scraped content
   - Cache API responses

5. **Web UI**
   - Add simple web interface as an alternative to CLI
   - Support for bookmarklets or browser extensions

## 7. Implementation Timeline

1. **Week 1: Project Setup & Core Infrastructure**
   - Initialize project, dependencies, and structure
   - Implement configuration handling
   - Set up CLI interface

2. **Week 2: Content Acquisition & Processing**
   - Implement web scraper
   - Build content extractor
   - Create text cleaning utilities

3. **Week 3: AI Integration & Output Generation**
   - Integrate Gemini API
   - Implement summarization logic
   - Create markdown conversion

4. **Week 4: Error Handling, Testing & Documentation**
   - Add comprehensive error handling
   - Write tests
   - Complete documentation
   - Package for distribution
