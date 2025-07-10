# TypeScript Web Article Summarizer CLI

A command-line tool that processes web articles by scraping their content, cleaning it, and generating AI-powered summaries in Markdown format.

## Features

- URL scraping with content extraction
- Content cleaning and normalization
- AI-powered summarization using Google's Gemini API
- Markdown output formatting
- Configurable CLI interface

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Create a `.env` file based on `.env.example` and add your Gemini API key.

## Usage

```bash
# Basic usage
summarizer --url https://example.com/article

# Specify output file
summarizer --url https://example.com/article --output summary.md

# Control summary length
summarizer --url https://example.com/article --length short

# Set API key via command line
summarizer --url https://example.com/article --api-key YOUR_API_KEY
```

## Configuration

You can configure the application through:
- Environment variables (see `.env.example`)
- Configuration file in `config/default.json`
- Command-line arguments

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Project Structure

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

## License

MIT
