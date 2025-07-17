#!/usr/bin/env node

import path from 'path';
import { parseArguments, showProgress, showSuccess, showError } from './modules/cli.js';
import { scrapeUrl } from './modules/scraper.js';
import { extractContent } from './modules/extractor.js';
import { summarize } from './modules/summarizer.js';
import { convertToMarkdown, formatOutput, saveToFile } from './modules/converter.js';
import { logger } from './modules/utils/logger.js';
import { handleError, createFileSystemError } from './modules/utils/error.js';
import fs from 'fs';

// Export main function for library usage
export { summarizeArticle } from './lib.js';

/**
 * Main application function
 */
async function main() {
  try {
    logger.debug('Starting application');
    
    // Parse command line arguments
    const options = parseArguments(process.argv);
    
    // Handle configuration mode
    if (options.config) {
      logger.info('Configuration mode selected');
      console.log('Configuration mode not yet implemented.');
      process.exit(0);
    }
    
    // Process URL
    const url = options.url;
    logger.debug('Processing URL', { url });
    showProgress(`Processing article from ${url}`);
    
    // 1. Scrape the URL
    logger.debug('Starting web scraping');
    const scraperResult = await scrapeUrl(url);
    logger.debug('Web scraping completed', { title: scraperResult.title });
    
    // 2. Extract main content
    logger.debug('Starting content extraction');
    const extractedContent = await extractContent(scraperResult.html, scraperResult.url);
    logger.debug('Content extraction completed', { 
      title: extractedContent.title,
      contentLength: extractedContent.textContent.length, 
    });
    
    // 3. Generate AI summary
    logger.debug('Starting AI summarization');
    const summarizerOptions = {
      length: options.length || 'medium',
      includeKeyPoints: true,
    };
    
    const summaryResult = await summarize(extractedContent.textContent, summarizerOptions);
    logger.debug('Summarization completed', { 
      summaryLength: summaryResult.summaryWordCount,
      originalLength: summaryResult.originalWordCount,
      ratio: (summaryResult.summaryWordCount / summaryResult.originalWordCount), 
    });
    
    // 4. Convert to Markdown
    logger.debug('Converting to Markdown');
    const conversionResult = convertToMarkdown(summaryResult.summary);
    
    // 5. Format the output with metadata
    const metadata = {
      title: extractedContent.title,
      url: scraperResult.url,
      date: new Date().toISOString(),
    };
    logger.debug('Formatting output with metadata', { metadata });
    const formattedOutput = formatOutput(conversionResult.markdown, metadata);
    
    // 6. Save to file
    const outputDir = path.join(process.cwd(), 'summaries');
    const outputPath = options.output || path.join(
      outputDir, 
      `${extractedContent.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`,
    );
    
    // Create output directory if it doesn't exist
    try {
      if (!fs.existsSync(outputDir)) {
        logger.debug(`Creating output directory: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
      }
    } catch (error) {
      throw createFileSystemError('PERMISSION_DENIED', error, { path: outputDir });
    }
    
    logger.debug(`Saving summary to file: ${outputPath}`);
    await saveToFile(formattedOutput, outputPath);
    
    // Show summary stats
    const compressionRatio = Math.round(
      (summaryResult.summaryWordCount / summaryResult.originalWordCount) * 100,
    );
    
    showSuccess(`Summary generated: ${summaryResult.summaryWordCount} words (${compressionRatio}% of original)`, {
      outputPath,
      wordCount: summaryResult.summaryWordCount,
      compressionRatio,
    });
    
    logger.debug('Application completed successfully');
    
  } catch (error) {
    const appError = handleError(error);
    showError('An error occurred during processing', appError);
    logger.debug('Application terminated with error', { errorType: appError.type });
    process.exit(1);
  }
}

// Set up uncaught exception handler
process.on('uncaughtException', (error) => {
  const appError = handleError(error);
  logger.error('Uncaught exception', appError.getDebugInfo());
  process.exit(1);
});

// Set up unhandled rejection handler
process.on('unhandledRejection', (reason) => {
  const appError = handleError(reason);
  logger.error('Unhandled promise rejection', appError.getDebugInfo());
  process.exit(1);
});

// Run the application
main();
