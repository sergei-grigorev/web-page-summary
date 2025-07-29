import TurndownService from 'turndown';
import fs from 'fs';
import path from 'path';
import type { ConverterOptions, ConversionResult } from '../types';
import { showProgress, showSuccess, showError } from './cli';

/**
 * Convert HTML content to Markdown
 */
export function convertToMarkdown(
  content: string,
  options?: Partial<ConverterOptions>
): ConversionResult {
  const converterOptions = { ...getDefaultOptions(), ...options };
  
  showProgress('Converting content to Markdown');
  
  // Configure Turndown service
  const turndownService = configureTurndown(converterOptions);
  
  // Convert HTML to Markdown
  const markdown = turndownService.turndown(content);
  
  const result: ConversionResult = {
    markdown,
  };
  
  if (converterOptions.includeMetadata) {
    result.metadata = {
      title: '',
      url: '',
      date: new Date().toISOString()
    };
  }
  
  return result;
}

/**
 * Get default converter options
 */
function getDefaultOptions(): ConverterOptions {
  return {
    includeMetadata: true,
    codeBlockStyle: 'fenced',
    headingStyle: 'atx',
    bulletListMarker: '-',
  };
}

/**
 * Configure Turndown service with options
 */
function configureTurndown(options: ConverterOptions): TurndownService {
  const turndownService = new TurndownService({
    headingStyle: options.headingStyle,
    codeBlockStyle: options.codeBlockStyle,
    bulletListMarker: options.bulletListMarker,
  });
  
  // Add custom rules
  turndownService.addRule('codeBlocks', {
    filter: ['pre'],
    replacement(content: string): string {
      return `\`\`\`\n${  content  }\n\`\`\``;
    }
  });
  
  return turndownService;
}

/**
 * Format the final Markdown output with metadata
 */
export function formatOutput(
  markdown: string,
  metadata: { title?: string; url?: string; date?: string | Date } = {}
): string {
  const { title, url, date } = metadata;
  const formattedDate = date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString();
  
  let output = '';
  
  // Add title if available
  if (title) {
    output += `# ${title}\n\n`;
  }
  
  // Add metadata section
  output += '## Article Information\n\n';
  
  if (url) {
    output += `**Source:** [${url}](${url})\n\n`;
  }
  
  output += `**Date Summarized:** ${formattedDate}\n\n`;
  
  // Add horizontal rule
  output += '---\n\n';
  
  // Add summary heading
  output += '## Summary\n\n';
  
  // Add the actual summary content
  output += markdown;
  
  return output;
}

/**
 * Save Markdown content to file
 */
export function saveToFile(
  content: string,
  filePath: string
): string {
  try {
    // Ensure the directory exists
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(filePath, content, 'utf8');
    showSuccess(`Summary saved to ${filePath}`);
    return filePath;
  } catch (error) {
    showError(`Failed to save file: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
