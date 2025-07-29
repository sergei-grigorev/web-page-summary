# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm run build` - Compile TypeScript to JavaScript in `dist/` directory
- `npm run dev` - Run application in development mode using ts-node
- `npm start` - Run compiled application from `dist/index.js`
- `npm test` - Run Jest test suite
- `npm run lint` - Run ESLint on TypeScript files (`.ts` extension)

### CLI Application Usage
- `node dist/index.js --url <URL>` - Basic article summarization
- `node dist/index.js --url <URL> --length short|medium|long` - Control summary length
- `node dist/index.js --url <URL> --output <path>` - Specify output file
- `node dist/index.js --url <URL> --verbose` - Enable verbose logging
- `node dist/index.js --url <URL> --debug` - Enable debug logging

## Architecture

This is a TypeScript CLI tool for web article summarization using Google's Gemini AI.

### Core Modules Structure (src/modules/)
1. **scraper.ts** - Web content scraping with axios and cheerio
2. **extractor.ts** - Content extraction and cleaning from HTML
3. **summarizer.ts** - AI summarization using @google/genai package
4. **converter.ts** - Markdown conversion and output formatting
5. **cli.ts** - Command-line argument parsing and user interface
6. **config.ts** - Configuration management (env vars, config files)

### Data Flow
URL → Scraper → Extractor → Summarizer → Converter → File Output

### Key Dependencies
- **@google/genai** - Google Gemini AI integration (migrated from @google/generative-ai)
- **axios** - HTTP client for web scraping
- **cheerio** - Server-side HTML parsing
- **turndown** - HTML to Markdown conversion
- **commander** - CLI argument parsing

### Configuration Hierarchy
1. Command-line arguments (highest precedence)
2. Environment variables (.env file)
3. config/default.json file
4. Built-in defaults

### Entry Points
- **CLI**: `src/index.ts` - Main CLI application

### API Key Management
Requires GEMINI_API_KEY environment variable. Can be set via .env file or --api-key CLI argument.

### Output
- Default output directory: `./summaries/`
- Output format: Markdown files with metadata headers
- Filenames generated from article title (sanitized)

### Error Handling
Centralized error handling in `src/modules/utils/error.ts` with typed error categories (NETWORK, API, VALIDATION, etc.).

### Testing
Jest configuration uses ts-jest for TypeScript support. Tests located in `tests/` directory.