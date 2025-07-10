import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ScraperOptions, ScraperResult } from '../types';
import { getConfig } from './config';
import { showProgress } from './cli';
import { createNetworkError, createUnknownError, handleError } from './utils/error';
import { ERROR_MESSAGES } from '../constants';

/**
 * Validates and normalizes a URL
 * @param url The URL to validate and normalize
 * @returns The normalized URL string
 * @throws AppError if the URL is invalid
 */
export function validateUrl(url: string): string {
  try {
    // Handle cases where URL might be missing protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const parsedUrl = new URL(url);
    return parsedUrl.toString();
  } catch (error) {
    throw createNetworkError('INVALID_URL', error as Error, { url });
  }
}

/**
 * Extracts page title from HTML content
 */
function extractTitle(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : undefined;
}

/**
 * Extracts metadata from HTML content
 */
function extractMetadata(html: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  
  // Extract meta tags
  const metaRegex = /<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]+)"[^>]*>/gi;
  let match;
  
  while ((match = metaRegex.exec(html)) !== null) {
    const [, name, content] = match;
    if (name && content) {
      metadata[name.toLowerCase()] = content;
    }
  }
  
  return metadata;
}

/**
 * Scrapes content from a URL
 * @param url The URL to scrape content from
 * @param options Optional scraper configuration options
 * @returns A promise resolving to the scraped content result
 * @throws AppError if scraping fails
 */
export async function scrapeUrl(
  url: string, 
  options?: Partial<ScraperOptions>
): Promise<ScraperResult> {
  const config = getConfig();
  const scraperConfig = { ...config.scraper, ...options };
  
  try {
    // Validate and normalize URL
    const normalizedUrl = validateUrl(url);
    
    showProgress(`Fetching content from ${normalizedUrl}`);
    
    // Configure axios request
    const requestConfig: AxiosRequestConfig = {
      timeout: scraperConfig.timeout,
      headers: {
        'User-Agent': scraperConfig.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      maxRedirects: 5,
    };
    
    // Make the HTTP request with retry logic
    let response: AxiosResponse | null = null;
    let attempts = 0;
    let lastError: Error | null = null;
    
    while (attempts <= scraperConfig.retries) {
      try {
        response = await axios.get(normalizedUrl, requestConfig);
        break;
      } catch (error) {
        lastError = error as Error;
        attempts++;
        
        if (attempts > scraperConfig.retries) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempts) * 1000;
        showProgress(`Retry ${attempts}/${scraperConfig.retries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (!response) {
      if (lastError) {
        if (axios.isAxiosError(lastError)) {
          if (lastError.code === 'ECONNABORTED') {
            throw createNetworkError('TIMEOUT', lastError, { url: normalizedUrl, timeout: scraperConfig.timeout });
          } else if (lastError.code === 'ENOTFOUND') {
            throw createNetworkError('CONNECTION_FAILED', lastError, { url: normalizedUrl });
          } else if (lastError.response) {
            throw createNetworkError('CONNECTION_FAILED', lastError, { 
              url: normalizedUrl, 
              status: lastError.response.status,
              statusText: lastError.response.statusText 
            });
          }
        }
        throw createNetworkError('CONNECTION_FAILED', lastError, { url: normalizedUrl });
      }
      throw createNetworkError('CONNECTION_FAILED', new Error('Failed to fetch URL after retries'), { url: normalizedUrl });
    }
    
    const html = response.data;
    
    // Check if we actually got HTML content
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw createNetworkError('INVALID_RESPONSE', new Error('Response is not HTML content'), { 
        url: normalizedUrl,
        contentType
      });
    }
    
    // Extract title and metadata
    const title = extractTitle(html);
    const metadata = extractMetadata(html);
    
    return {
      html,
      url: normalizedUrl,
      title,
      metadata,
    };
  } catch (error) {
    // If it's already an AppError, just rethrow it
    if ((error as any).name === 'AppError') {
      throw error;
    }
    
    // Handle Axios specific errors
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with non-2xx status
        return handleAxiosResponseError(error, url, scraperConfig);
      } else if (error.request) {
        // Request made but no response received
        throw createNetworkError('CONNECTION_FAILED', error, { 
          url,
          timeout: scraperConfig.timeout 
        });
      }
    }
    
    // Generic error handling
    throw handleError(error);
  }
}

/**
 * Handles Axios response errors and converts them to appropriate AppErrors
 */
function handleAxiosResponseError(error: any, url: string, scraperConfig: ScraperOptions): never {
  const status = error.response?.status;
  const statusText = error.response?.statusText;
  
  // Handle different HTTP status codes
  if (status === 404) {
    throw createNetworkError('CONNECTION_FAILED', error, { 
      url, 
      status,
      message: 'Page not found' 
    });
  } else if (status === 403) {
    throw createNetworkError('CONNECTION_FAILED', error, { 
      url, 
      status,
      message: 'Access forbidden' 
    });
  } else if (status >= 500) {
    throw createNetworkError('CONNECTION_FAILED', error, { 
      url, 
      status,
      message: 'Server error' 
    });
  } else {
    throw createNetworkError('CONNECTION_FAILED', error, { 
      url, 
      status,
      statusText 
    });
  }
}
