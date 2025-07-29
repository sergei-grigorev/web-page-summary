import { load, type CheerioAPI, type Cheerio } from 'cheerio';
import type { ExtractorOptions, ExtractedContent } from '../types';
import { getConfig } from './config';
import { showProgress } from './cli';
import type { AnyNode } from 'domhandler';

// Interface for DOM text nodes with type and data properties
interface TextNode {
  type: string;
  data: string;
}

/**
 * Extract main content from HTML
 */
export function extractContent(
  html: string,
  url: string,
  options?: Partial<ExtractorOptions>
): ExtractedContent {
  const config = getConfig();
  const extractorConfig = { ...config.extractor, ...options };

  showProgress('Extracting main content');

  // Load HTML into cheerio
  const $ = load(html);

  // Extract title
  let fallbackTitle: string;
  try {
    fallbackTitle = new URL(url).hostname;
  } catch {
    fallbackTitle = 'Unknown';
  }
  const title = extractTitle($) ?? fallbackTitle;

  // Remove unwanted elements
  removeUnwantedElements($, extractorConfig.removeSelectors);

  // Find main content
  const mainContent = findMainContent($);

  // Clean and normalize content
  const cleanedContent = cleanContent(mainContent, $, extractorConfig);
  if (cleanedContent.length === 0) {
    throw new Error('No content found after extraction');
  }

  // Extract additional metadata
  const author = extractAuthor($);
  const publishDate = extractPublishDate($);
  const excerpt = extractExcerpt($);

  const result: ExtractedContent = {
    title,
    content: cleanedContent.html()?.trim() ?? '',
    textContent: cleanedContent.text().trim(),
  };

  if (author !== undefined) {
    result.author = author;
  }

  if (publishDate !== undefined) {
    result.publishDate = publishDate;
  }

  if (excerpt !== undefined) {
    result.excerpt = excerpt;
  }

  return result;
}

/**
 * Extract title from the document
 */
function extractTitle($: CheerioAPI): string | undefined {
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
  $: CheerioAPI,
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
function findMainContent($: CheerioAPI): Cheerio<AnyNode> {
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
  const paragraphContainers: { element: AnyNode; count: number }[] = [];

  $('body').find('div, section, main').each((_: number, element: AnyNode) => {
    const paragraphCount = $(element).find('p').length;
    if (paragraphCount > 2) {
      paragraphContainers.push({ element, count: paragraphCount });
    }
  });

  // Sort by paragraph count (descending)
  paragraphContainers.sort((a, b) => b.count - a.count);

  const firstContainer = paragraphContainers[0];
  if (firstContainer) {
    return $(firstContainer.element);
  }

  // Last resort: just return the body
  return $('body');
}

/**
 * Clean and normalize content
 */
function cleanContent(
  content: Cheerio<AnyNode>,
  $: CheerioAPI,
  options: ExtractorOptions
): Cheerio<AnyNode> {
  // Remove empty paragraphs
  content.find('p').each((_: number, element: AnyNode) => {
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
    content.find('a').each((_: number, element: AnyNode) => {
      const link = $(element);
      const text = link.text();
      link.replaceWith(text);
    });
  }

  // Normalize whitespace
  content.find('*').contents().each((_: number, element: AnyNode) => {
    const textNode = element as TextNode;
    if (textNode.type === 'text') {
      const text = $(element).text().replace(/\s+/g, ' ').trim();
      textNode.data = text;
    }
  });

  return content;
}

/**
 * Extract author information
 */
function extractAuthor($: CheerioAPI): string | undefined {
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
function extractPublishDate($: CheerioAPI): Date | undefined {
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
        } catch {
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
          } catch {
            // Invalid date format, try next selector
          }
        }
      }
    } else {
      const dateElement = $(selector).first();
      if (dateElement.length > 0) {
        try {
          return new Date(dateElement.text().trim());
        } catch {
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
function extractExcerpt($: CheerioAPI): string | undefined {
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
