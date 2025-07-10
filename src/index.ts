#!/usr/bin/env node

import path from 'path';
import { parseArguments, showProgress, showSuccess, showError } from './modules/cli';
import { scrapeUrl } from './modules/scraper';
import { extractContent } from './modules/extractor';
import { summarize } from './modules/summarizer';
import { convertToMarkdown, formatOutput, saveToFile } from './modules/converter';
import { SummarizerOptions } from './types';

/**
 * Main application function
 */
async function main() {
  try {
    // Parse command line arguments
    const options = parseArguments(process.argv);
    
    // Handle configuration mode
    if (options.config) {
      console.log('Configuration mode not yet implemented.');
      process.exit(0);
    }
    
    // Process URL
    const url = options.url as string;
    showProgress(`Processing article from ${url}`);
    
    // 1. Scrape the URL
    const scraperResult = await scrapeUrl(url);
    
    // 2. Extract main content
    const extractedContent = await extractContent(scraperResult.html, scraperResult.url);
    
    // 3. Generate AI summary
    const summarizerOptions: SummarizerOptions = {
      length: options.length || 'medium',
      includeKeyPoints: true,
    };
    
    const summaryResult = await summarize(extractedContent.textContent, summarizerOptions);
    
    // 4. Convert to Markdown
    const conversionResult = convertToMarkdown(summaryResult.summary);
    
    // 5. Format the output with metadata
    const formattedOutput = formatOutput(conversionResult.markdown, {
      title: extractedContent.title,
      url: scraperResult.url,
      date: new Date().toISOString(),
    });
    
    // 6. Save to file
    const outputPath = options.output || path.join(
      process.cwd(), 
      'summaries', 
      `${extractedContent.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`
    );
    
    await saveToFile(formattedOutput, outputPath);
    
    // Show summary stats
    showSuccess(`Summary generated: ${summaryResult.summaryWordCount} words (${Math.round(
      (summaryResult.summaryWordCount / summaryResult.originalWordCount) * 100
    )}% of original)`);
    
  } catch (error) {
    showError('An error occurred during processing', error as Error);
    process.exit(1);
  }
}

// Run the application
main();
