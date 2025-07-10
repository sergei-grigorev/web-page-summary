import { scrapeUrl } from './modules/scraper';
import { extractContent } from './modules/extractor';
import { summarize } from './modules/summarizer';
import { convertToMarkdown, formatOutput } from './modules/converter';
import { SummarizerOptions, SummaryLength } from './types';
import { logger } from './modules/utils/logger';
import { handleError } from './modules/utils/error';

export interface SummarizeArticleOptions {
  url: string;
  length?: SummaryLength;
  apiKey?: string;
  includeKeyPoints?: boolean;
}

export interface SummarizeArticleResult {
  markdown: string;
  summary: string;
  keyPoints?: string[];
  originalWordCount: number;
  summaryWordCount: number;
  metadata: {
    title: string;
    url: string;
    date: string;
  };
}

/**
 * Summarize an article from a URL - main library function
 */
export async function summarizeArticle(
  options: SummarizeArticleOptions
): Promise<SummarizeArticleResult> {
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
    const summarizerOptions: SummarizerOptions = {
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