import TurndownService from 'turndown';
import fs from 'fs';
import path from 'path';
import { showProgress, showSuccess, showError } from './cli.js';

/**
 * Convert HTML content to Markdown
 * @param {string} content - HTML content to convert
 * @param {Partial<import('../types/index.js').ConverterOptions>} [options] - Converter options
 * @returns {import('../types/index.js').ConversionResult} Conversion result
 */
export function convertToMarkdown(content, options) {
  const converterOptions = { ...getDefaultOptions(), ...options };
  
  showProgress('Converting content to Markdown');
  
  // Configure Turndown service
  const turndownService = configureTurndown(converterOptions);
  
  // Convert HTML to Markdown
  const markdown = turndownService.turndown(content);
  
  return {
    markdown,
    metadata: converterOptions.includeMetadata ? {
      title: '',
      url: '',
      date: new Date().toISOString(),
    } : undefined,
  };
}

/**
 * Get default converter options
 * @returns {import('../types/index.js').ConverterOptions} Default options
 */
function getDefaultOptions() {
  return {
    includeMetadata: true,
    codeBlockStyle: 'fenced',
    headingStyle: 'atx',
    bulletListMarker: '-',
  };
}

/**
 * Configure Turndown service with options
 * @param {import('../types/index.js').ConverterOptions} options - Converter options
 * @returns {TurndownService} Configured Turndown service
 */
function configureTurndown(options) {
  const turndownService = new TurndownService({
    headingStyle: options.headingStyle,
    codeBlockStyle: options.codeBlockStyle,
    bulletListMarker: options.bulletListMarker,
  });
  
  // Add custom rules
  turndownService.addRule('codeBlocks', {
    filter: ['pre'],
    replacement(content, _node) {
      return `\`\`\`\n${  content  }\n\`\`\``;
    },
  });
  
  return turndownService;
}

/**
 * Format the final Markdown output with metadata
 * @param {string} markdown - Markdown content
 * @param {Record<string, any>} [metadata={}] - Metadata object
 * @returns {string} Formatted output
 */
export function formatOutput(markdown, metadata = {}) {
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
 * @param {string} content - Content to save
 * @param {string} filePath - File path to save to
 * @returns {Promise<string>} Saved file path
 */
export async function saveToFile(content, filePath) {
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
