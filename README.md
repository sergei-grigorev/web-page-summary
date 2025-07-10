# TypeScript Web Article Summarizer CLI

A powerful command-line tool that processes web articles by scraping their content, cleaning it, and generating AI-powered summaries in Markdown format using Google's Gemini API with the gemini-1.5-flash model.

## Features

- URL scraping with intelligent content extraction
- Advanced content cleaning and normalization
- AI-powered summarization using Google's Gemini API
- Customizable summary length (short, medium, long)
- Clean Markdown output formatting
- Highly configurable CLI interface
- Error handling and retry mechanisms

## Installation

### Option 1: Install from npm (recommended)

```bash
# Install globally
npm install -g article-summarizer

# Or install locally in your project
npm install article-summarizer
```

### Option 2: Install from source

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/article-summarizer.git
   cd article-summarizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Link the package globally (optional):
   ```bash
   npm link
   ```

### API Key Setup

This tool requires a Google Gemini API key to function:

1. Create a `.env` file based on `.env.example`
2. Add your Gemini API key: `GEMINI_API_KEY=your_api_key_here`

You can obtain a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## Usage

### Basic Commands

```bash
# Basic usage - will output to default path
summarizer --url https://example.com/article

# Specify output file
summarizer --url https://example.com/article --output summary.md

# Control summary length (options: short, medium, long)
summarizer --url https://example.com/article --length medium

# Set API key via command line (alternative to .env file)
summarizer --url https://example.com/article --api-key YOUR_API_KEY

# Enable verbose mode
summarizer --url https://example.com/article --verbose

# Enable debug mode
summarizer --url https://example.com/article --debug

# Save logs to file
summarizer --url https://example.com/article --log-file logs.txt

# Configure default settings
summarizer --config

# Display help
summarizer --help
```

### Command Options

The CLI supports the following options:

- `-u, --url <url>`: URL of the article to summarize
- `-o, --output <path>`: Output file path for the summary (defaults to configured output path)
- `-l, --length <length>`: Length of the summary (short, medium, long)
- `-k, --api-key <key>`: Gemini API key (overrides environment variable)
- `-v, --verbose`: Enable verbose output (INFO level logs)
- `-d, --debug`: Enable debug mode (DEBUG level logs)
- `--log-file <path>`: Save logs to file
- `-c, --config`: Configure default settings
- `--help`: Display help information
- `--version`: Display version information


### Using as a Library

You can also use the summarizer as a library in your Node.js projects:

```typescript
import { summarizeArticle } from 'article-summarizer';

async function main() {
  try {
    const result = await summarizeArticle({
      url: 'https://example.com/article',
      length: 'medium',
      apiKey: 'YOUR_API_KEY' // Optional, will use env var if not provided
    });
    
    console.log(result.markdown);
  } catch (error) {
    console.error('Error summarizing article:', error.message);
  }
}

main();
```

The library uses the @google/generative-ai package for Gemini API integration with the default endpoint handling, which properly appends the API key as a query parameter.

## Configuration

The summarizer can be configured through multiple methods (in order of precedence):

### 1. Command-line Arguments

Command-line arguments take highest precedence. See the Usage section above for examples.

### 2. Environment Variables

Environment variables can be set in a `.env` file or in your system:

```
# API Configuration
GEMINI_API_KEY=your_api_key_here

# Default Settings
DEFAULT_SUMMARY_LENGTH=medium
DEFAULT_OUTPUT_FORMAT=markdown
DEFAULT_OUTPUT_PATH=./summaries

# Scraper Configuration
SCRAPER_TIMEOUT=10000
SCRAPER_RETRIES=3

# Optional: Debug Mode
DEBUG=false
```

### 3. Configuration File

Create or modify the configuration file at `config/default.json`:

```json
{
  "api": {
    "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
  },
  "defaults": {
    "summaryLength": "medium",
    "outputFormat": "markdown",
    "outputPath": "./summaries"
  },
  "scraper": {
    "timeout": 10000,
    "retries": 3,
    "userAgent": "Mozilla/5.0 (compatible; ArticleSummarizer/1.0)"
  },
  "extractor": {
    "removeSelectors": ["nav", "header", "footer", ".ads", ".comments", ".sidebar"],
    "includeImages": false,
    "preserveLinks": true
  }
}
```

### 4. Default Settings

If no configuration is provided, sensible defaults will be used.

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

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - Make sure your Gemini API key is correctly set in the `.env` file or passed via command line with `--api-key`
   - Verify that your API key has not expired or reached its quota limit
   - The project uses the gemini-1.5-flash model which has been confirmed to work with the current API configuration

2. **Content Extraction Problems**
   - Some websites may block scrapers or have complex layouts that are difficult to parse
   - Try using the `--verbose` or `--debug` flag to see detailed extraction information
   - Check the logs with `--log-file` option for more details

3. **Summarization Quality**
   - If summaries are too short or missing important details, try using `--length long`
   - Adjust the default settings with the `--config` option

### Reporting Bugs

If you encounter any issues, please report them on our [GitHub Issues page](https://github.com/yourusername/article-summarizer/issues) with:

- The command you ran
- The URL you were trying to summarize
- Any error messages received
- Your environment (OS, Node.js version)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT
