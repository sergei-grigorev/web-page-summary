import { load } from 'cheerio';
import { ExtractorOptions, ExtractedContent } from '../types';
import { getConfig } from './config';
import { showProgress } from './cli';

/**
 * Extract main content from HTML
 */
export async function extractContent(
  html: string,
  url: string,
  options?: Partial<ExtractorOptions>
): Promise<ExtractedContent> {
  const config = getConfig();
  const extractorConfig = { ...config.extractor, ...options };
  
  showProgress('Extracting main content');
  
  // Load HTML into cheerio
  const $ = load(html);
  
  // Extract title
  const title = extractTitle($) || new URL(url).hostname;
  
  // Remove unwanted elements
  removeUnwantedElements($, extractorConfig.removeSelectors);
  
  // Find main content
  const mainContent = findMainContent($);
  
  // Clean and normalize content
  const cleanedContent = cleanContent(mainContent, $, extractorConfig);
  
  // Extract additional metadata
  const author = extractAuthor($);
  const publishDate = extractPublishDate($);
  const excerpt = extractExcerpt($);
  
  // Get plain text version
  const textContent = $(cleanedContent).text().trim();
  
  return {
    title,
    content: cleanedContent.html() || '',
    textContent,
    author,
    publishDate,
    excerpt,
  };
}

/**
 * Extract title from the document
 */
function extractTitle($: ReturnType<typeof load>): string | undefined {
  // Try different title selectors in order of preference
  const titleSelectors = [
    'h1.article-title',
    'h1.entry-title',
    'h1.post-title',
    'h1.title',
    'article h1',
    'main h1',
    '.article h1',
    '.post h1',
    'h1',
  ];
  
  for (const selector of titleSelectors) {
    const titleElement = $(selector).first();
    if (titleElement.length > 0) {
      return titleElement.text().trim();
    }
  }
  
  // Fallback to <title> tag
  return $('title').text().trim() || undefined;
}

/**
 * Remove unwanted elements from the document
 */
function removeUnwantedElements(
  $: ReturnType<typeof load>,
  selectors: string[] = []
): void {
  // Default elements to remove
  const defaultSelectors = [
    'script',
    'style',
    'iframe',
    'nav',
    'header',
    'footer',
    '.ads',
    '.advertisement',
    '.banner',
    '.sidebar',
    '.comments',
    '.related',
    '.recommended',
    '.social',
    '.share',
    '.newsletter',
    '.popup',
    '[role="banner"]',
    '[role="navigation"]',
    '[role="complementary"]',
  ];
  
  // Combine default and custom selectors
  const allSelectors = [...defaultSelectors, ...selectors];
  
  // Remove all unwanted elements
  allSelectors.forEach(selector => {
    $(selector).remove();
  });
}

/**
 * Find the main content element in the document
 */
function findMainContent($: ReturnType<typeof load>): any {
  // Try different content selectors in order of preference
  const contentSelectors = [
    'article',
    '.article',
    '.post',
    '.entry-content',
    '.article-content',
    '.post-content',
    '.content',
    'main',
    '#main',
    '#content',
  ];
  
  for (const selector of contentSelectors) {
    const contentElement = $(selector).first();
    if (contentElement.length > 0 && contentElement.text().trim().length > 200) {
      return contentElement;
    }
  }
  
  // Fallback: Use body and try to find the element with the most paragraphs
  const paragraphContainers: {element: any; count: number}[] = [];
  
  $('body').find('div, section, main').each((_: number, element: any) => {
    const paragraphCount = $(element).find('p').length;
    if (paragraphCount > 2) {
      paragraphContainers.push({ element, count: paragraphCount });
    }
  });
  
  // Sort by paragraph count (descending)
  paragraphContainers.sort((a, b) => b.count - a.count);
  
  if (paragraphContainers.length > 0) {
    return $(paragraphContainers[0].element);
  }
  
  // Last resort: just return the body
  return $('body');
}

/**
 * Clean and normalize content
 */
function cleanContent(
  content: any,
  $: ReturnType<typeof load>,
  options: ExtractorOptions
): any {
  // Remove empty paragraphs
  content.find('p').each((_: number, element: any) => {
    const paragraph = $(element);
    if (paragraph.text().trim() === '') {
      paragraph.remove();
    }
  });
  
  // Handle images based on options
  if (!options.includeImages) {
    content.find('img').remove();
  }
  
  // Handle links based on options
  if (!options.preserveLinks) {
    content.find('a').each((_: number, element: any) => {
      const link = $(element);
      const text = link.text();
      link.replaceWith(text);
    });
  }
  
  // Normalize whitespace
  content.find('*').contents().each((_: number, element: any) => {
    if (element.type === 'text') {
      const text = $(element).text().replace(/\s+/g, ' ').trim();
      element.data = text;
    }
  });
  
  return content;
}

/**
 * Extract author information
 */
function extractAuthor($: ReturnType<typeof load>): string | undefined {
  // Try different author selectors
  const authorSelectors = [
    'meta[name="author"]',
    'meta[property="article:author"]',
    '.author',
    '.byline',
    '.article-author',
    '[rel="author"]',
  ];
  
  for (const selector of authorSelectors) {
    if (selector.startsWith('meta')) {
      const metaAuthor = $(selector).attr('content');
      if (metaAuthor) {
        return metaAuthor.trim();
      }
    } else {
      const authorElement = $(selector).first();
      if (authorElement.length > 0) {
        return authorElement.text().trim();
      }
    }
  }
  
  return undefined;
}

/**
 * Extract publication date
 */
function extractPublishDate($: ReturnType<typeof load>): Date | undefined {
  // Try different date selectors
  const dateSelectors = [
    'meta[name="date"]',
    'meta[property="article:published_time"]',
    'time',
    '.date',
    '.published',
    '.article-date',
    '.post-date',
  ];
  
  for (const selector of dateSelectors) {
    if (selector.startsWith('meta')) {
      const metaDate = $(selector).attr('content');
      if (metaDate) {
        try {
          return new Date(metaDate);
        } catch (e) {
          // Invalid date format, try next selector
        }
      }
    } else if (selector === 'time') {
      const timeElement = $(selector).first();
      if (timeElement.length > 0) {
        const datetime = timeElement.attr('datetime');
        if (datetime) {
          try {
            return new Date(datetime);
          } catch (e) {
            // Invalid date format, try next selector
          }
        }
      }
    } else {
      const dateElement = $(selector).first();
      if (dateElement.length > 0) {
        try {
          return new Date(dateElement.text().trim());
        } catch (e) {
          // Invalid date format, try next selector
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Extract excerpt or summary
 */
function extractExcerpt($: ReturnType<typeof load>): string | undefined {
  // Try different excerpt selectors
  const excerptSelectors = [
    'meta[name="description"]',
    'meta[property="og:description"]',
    '.excerpt',
    '.summary',
    '.article-summary',
    '.post-excerpt',
  ];
  
  for (const selector of excerptSelectors) {
    if (selector.startsWith('meta')) {
      const metaExcerpt = $(selector).attr('content');
      if (metaExcerpt) {
        return metaExcerpt.trim();
      }
    } else {
      const excerptElement = $(selector).first();
      if (excerptElement.length > 0) {
        return excerptElement.text().trim();
      }
    }
  }
  
  // Fallback: use first paragraph as excerpt
  const firstParagraph = $('p').first();
  if (firstParagraph.length > 0) {
    const text = firstParagraph.text().trim();
    if (text.length > 50) {
      return text;
    }
  }
  
  return undefined;
}
