import axios, { AxiosRequestConfig } from 'axios';
import { ScraperOptions, ScraperResult } from '../types';
import { getConfig } from './config';
import { showProgress } from './cli';

/**
 * Validates and normalizes a URL
 */
export function validateUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
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
 */
export async function scrapeUrl(
  url: string, 
  options?: Partial<ScraperOptions>
): Promise<ScraperResult> {
  const config = getConfig();
  const scraperConfig = { ...config.scraper, ...options };
  
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
  
  try {
    // Make the HTTP request with retry logic
    let response;
    let attempts = 0;
    
    while (attempts <= scraperConfig.retries) {
      try {
        response = await axios.get(normalizedUrl, requestConfig);
        break;
      } catch (error) {
        attempts++;
        
        if (attempts > scraperConfig.retries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempts) * 1000;
        showProgress(`Retry ${attempts}/${scraperConfig.retries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (!response) {
      throw new Error('Failed to fetch URL after retries');
    }
    
    const html = response.data;
    
    // Extract title and metadata
    const title = extractTitle(html);
    const metadata = extractMetadata(html);
    
    return {
      html,
      url: normalizedUrl,
      title,
      metadata,
    };
  } catch (error: any) {
    if (error.response) {
      // Server responded with non-2xx status
      throw new Error(`Failed to fetch URL: HTTP ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request made but no response received
      throw new Error(`Failed to fetch URL: No response received (timeout: ${scraperConfig.timeout}ms)`);
    } else {
      // Error setting up the request
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
  }
}
