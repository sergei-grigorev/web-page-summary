import { GoogleGenAI } from '@google/genai';
import type { SummarizerOptions, SummaryResult, SummaryLength } from '../types';
import { getApiKey } from './config';
import { showProgress, showError } from './cli';

/**
 * Interface for Gemini API response
 */
interface GeminiApiResponse {
  text?: string;
  error?: {
    message: string;
    details?: string;
    statusCode?: number;
  };
}

/**
 * Interface for API error with proper typing
 */
interface ApiError extends Error {
  details?: string;
  statusCode?: number;
  stack?: string;
}

// Configuration constants
const DEFAULT_MAX_RETRIES = 3;
const GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TOP_P = 0.95;
const DEFAULT_TOP_K = 40;

// Cache for the Gemini model instance
let aiInstance: GoogleGenAI | null = null;

/**
 * Initialize the Gemini model
 */
function initializeModel(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = getApiKey();
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
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
    const splitIndex = keyPointsMatch.index ?? 0;
    const mainSummary = summary.substring(0, splitIndex).trim();
    const keyPointsSection = summary.substring(splitIndex);
    
    // Extract bullet points
    const keyPoints = keyPointsSection
      .split(/\n+/)
      .slice(1) // Skip the header
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^[-•\d.\s]+/, '').trim())
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
  const originalWordCount = countWords(content);
  
  showProgress(`Generating ${options.length} summary with Gemini API`);
  
  try {
    const ai = initializeModel();
    const prompt = generatePrompt(content, options);
    
    // Set up retry logic
    const maxRetries = DEFAULT_MAX_RETRIES;
    let retries = 0;
    let error: Error | null = null;
    
    while (retries < maxRetries) {
      try {
        const result = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          config: {
            temperature: DEFAULT_TEMPERATURE,
            topP: DEFAULT_TOP_P,
            topK: DEFAULT_TOP_K,
          },
        });
        
        // Get the response text from the first candidate
        const response = result as GeminiApiResponse;
        const summaryText = response.text ?? '';
        
        // Process the summary
        const { summary, keyPoints } = extractKeyPoints(summaryText);
        const summaryWordCount = countWords(summary);
        
        return {
          summary,
          keyPoints,
          originalWordCount,
          summaryWordCount,
        };
      } catch (err: unknown) {
        const apiError = err as ApiError;
        error = apiError;
        retries++;
        
        // Log detailed error information
        console.error('Gemini API Error:', {
          message: apiError.message,
          details: apiError.details ?? 'No details',
          stack: apiError.stack,
          statusCode: apiError.statusCode ?? 'No status code'
        });
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, retries) * 1000;
        showProgress(`API error, retrying in ${delay}ms (${retries}/${maxRetries})`);
        await new Promise<void>(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we get here, all retries failed
    throw error ?? new Error('Failed to generate summary after multiple attempts');
  } catch (error: unknown) {
    const apiError = error as ApiError;
    showError('Failed to generate summary', apiError);
    
    // Provide a fallback summary
    return {
      summary: 'Failed to generate summary. Please try again later.',
      originalWordCount,
      summaryWordCount: 0,
    };
  }
}
