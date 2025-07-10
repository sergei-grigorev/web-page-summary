import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { SummarizerOptions, SummaryResult, SummaryLength } from '../types';
import { getConfig, getApiKey } from './config';
import { showProgress, showError } from './cli';

// Cache for the Gemini model instance
let modelInstance: GenerativeModel | null = null;

/**
 * Initialize the Gemini model
 */
function initializeModel(): GenerativeModel {
  if (!modelInstance) {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    modelInstance = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }
  return modelInstance;
}

/**
 * Generate a prompt for the AI based on content and options
 */
function generatePrompt(content: string, options: SummarizerOptions): string {
  const lengthInstructions = getLengthInstructions(options.length);
  const keyPointsInstruction = options.includeKeyPoints ? 
    'Include a section with 3-5 key points from the article.' : '';
  
  return `
    Summarize the following article ${lengthInstructions}.
    ${keyPointsInstruction}
    Focus on the main ideas and important details.
    Use clear and concise language.
    
    ARTICLE:
    ${content}
  `;
}

/**
 * Get specific instructions based on summary length
 */
function getLengthInstructions(length: SummaryLength): string {
  switch (length) {
    case 'short':
      return 'in a very concise way (about 1-2 paragraphs)';
    case 'medium':
      return 'with moderate detail (about 3-4 paragraphs)';
    case 'long':
      return 'comprehensively, covering all important aspects (about 5-7 paragraphs)';
    default:
      return 'with moderate detail';
  }
}

/**
 * Count words in a text
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Extract key points from summary if available
 */
function extractKeyPoints(summary: string): { summary: string; keyPoints: string[] | undefined } {
  // Look for key points section
  const keyPointsMatch = summary.match(/key points:|main points:|key takeaways:|main takeaways:/i);
  
  if (keyPointsMatch) {
    const splitIndex = keyPointsMatch.index!;
    const mainSummary = summary.substring(0, splitIndex).trim();
    const keyPointsSection = summary.substring(splitIndex);
    
    // Extract bullet points
    const keyPoints = keyPointsSection
      .split(/\n+/)
      .slice(1) // Skip the header
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^[-•\d\.\s]+/, '').trim())
      .filter(Boolean);
    
    return {
      summary: mainSummary,
      keyPoints: keyPoints.length > 0 ? keyPoints : undefined
    };
  }
  
  return { summary, keyPoints: undefined };
}

/**
 * Summarize content using Gemini API
 */
export async function summarize(
  content: string,
  options: SummarizerOptions
): Promise<SummaryResult> {
  const config = getConfig();
  const originalWordCount = countWords(content);
  
  showProgress(`Generating ${options.length} summary with Gemini API`);
  
  try {
    const model = initializeModel();
    const prompt = generatePrompt(content, options);
    
    // Set up retry logic
    const maxRetries = 3;
    let retries = 0;
    let error: Error | null = null;
    
    while (retries < maxRetries) {
      try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const summaryText = response.text();
        
        // Process the summary
        const { summary, keyPoints } = extractKeyPoints(summaryText);
        const summaryWordCount = countWords(summary);
        
        return {
          summary,
          keyPoints,
          originalWordCount,
          summaryWordCount,
        };
      } catch (err: any) {
        error = err;
        retries++;
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, retries) * 1000;
        showProgress(`API error, retrying in ${delay}ms (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we get here, all retries failed
    throw error || new Error('Failed to generate summary after multiple attempts');
  } catch (error: any) {
    showError('Failed to generate summary', error);
    
    // Provide a fallback summary
    return {
      summary: 'Failed to generate summary. Please try again later.',
      originalWordCount,
      summaryWordCount: 0,
    };
  }
}
