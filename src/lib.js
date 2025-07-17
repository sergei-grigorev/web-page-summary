import { scrapeUrl } from './modules/scraper.js';
import { extractContent } from './modules/extractor.js';
import { summarize } from './modules/summarizer.js';
import { convertToMarkdown, formatOutput } from './modules/converter.js';
import { logger } from './modules/utils/logger.js';
import { handleError } from './modules/utils/error.js';

/**
 * @typedef {Object} SummarizeArticleOptions
 * @property {string} url - URL to summarize
 * @property {import('./types/index.js').SummaryLength} [length] - Summary length
 * @property {string} [apiKey] - API key for Gemini
 * @property {boolean} [includeKeyPoints] - Whether to include key points
 */

/**
 * @typedef {Object} SummarizeArticleResult
 * @property {string} markdown - Formatted markdown output
 * @property {string} summary - Summary text
 * @property {string[]} [keyPoints] - Key points from the article
 * @property {number} originalWordCount - Original article word count
 * @property {number} summaryWordCount - Summary word count
 * @property {Object} metadata - Article metadata
 * @property {string} metadata.title - Article title
 * @property {string} metadata.url - Article URL
 * @property {string} metadata.date - Summarization date
 */

/**
 * Summarize an article from a URL - main library function
 * @param {SummarizeArticleOptions} options - Summarization options
 * @returns {Promise<SummarizeArticleResult>} Summary result
 */
export async function summarizeArticle(options) {
  try {
    logger.debug('Starting article summarization', { url: options.url });
    
    // Set API key if provided
    if (options.apiKey) {
      process.env.GEMINI_API_KEY = options.apiKey;
    }
    
    // 1. Scrape the URL
    const scraperResult = await scrapeUrl(options.url);
    
    // 2. Extract main content
    const extractedContent = await extractContent(scraperResult.html, scraperResult.url);
    
    // 3. Generate AI summary
    const summarizerOptions = {
      length: options.length || 'medium',
      includeKeyPoints: options.includeKeyPoints ?? true,
    };
    
    const summaryResult = await summarize(extractedContent.textContent, summarizerOptions);
    
    // 4. Convert to Markdown
    const conversionResult = convertToMarkdown(summaryResult.summary);
    
    // 5. Format the output with metadata
    const metadata = {
      title: extractedContent.title,
      url: scraperResult.url,
      date: new Date().toISOString(),
    };
    
    const formattedOutput = formatOutput(conversionResult.markdown, metadata);
    
    logger.debug('Article summarization completed successfully');
    
    return {
      markdown: formattedOutput,
      summary: summaryResult.summary,
      keyPoints: summaryResult.keyPoints,
      originalWordCount: summaryResult.originalWordCount,
      summaryWordCount: summaryResult.summaryWordCount,
      metadata,
    };
    
  } catch (error) {
    const appError = handleError(error);
    logger.error('Article summarization failed', appError.getDebugInfo());
    throw appError;
  }
}