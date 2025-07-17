import { GoogleGenAI } from '@google/genai';
import { getApiKey } from './config.js';
import { showProgress, showError } from './cli.js';

// Cache for the Gemini model instance
let aiInstance = null;

/**
 * Initialize the Gemini model
 */
function initializeModel() {
  if (!aiInstance) {
    const apiKey = getApiKey();
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

/**
 * Generate a prompt for the AI based on content and options
 * @param {string} content - Content to summarize
 * @param {import('../types/index.js').SummarizerOptions} options - Summarizer options
 * @returns {string} Generated prompt
 */
function generatePrompt(content, options) {
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
 * @param {import('../types/index.js').SummaryLength} length - Summary length
 * @returns {string} Length instructions
 */
function getLengthInstructions(length) {
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
 * @param {string} text - Text to count words in
 * @returns {number} Word count
 */
function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Extract key points from summary if available
 * @param {string} summary - Summary text
 * @returns {{summary: string, keyPoints: string[] | undefined}} Extracted summary and key points
 */
function extractKeyPoints(summary) {
  // Look for key points section
  const keyPointsMatch = summary.match(/key points:|main points:|key takeaways:|main takeaways:/i);
  
  if (keyPointsMatch) {
    const splitIndex = keyPointsMatch.index || 0;
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
      keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
    };
  }
  
  return { summary, keyPoints: undefined };
}

/**
 * Summarize content using Gemini API
 * @param {string} content - Content to summarize
 * @param {import('../types/index.js').SummarizerOptions} options - Summarizer options
 * @returns {Promise<import('../types/index.js').SummaryResult>} Summary result
 */
export async function summarize(content, options) {
  const originalWordCount = countWords(content);
  
  showProgress(`Generating ${options.length} summary with Gemini API`);
  
  try {
    const ai = initializeModel();
    const prompt = generatePrompt(content, options);
    
    // Set up retry logic
    const maxRetries = 3;
    let retries = 0;
    let error = null;
    
    while (retries < maxRetries) {
      try {
        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          config: {
            temperature: 0.2,
            topP: 0.95,
            topK: 40,
          },
        });
        
        // Get the response text from the first candidate
        const response = result;
        const summaryText = response.text || '';
        
        // Process the summary
        const { summary, keyPoints } = extractKeyPoints(summaryText);
        const summaryWordCount = countWords(summary);
        
        return {
          summary,
          keyPoints,
          originalWordCount,
          summaryWordCount,
        };
      } catch (err) {
        error = err;
        retries++;
        
        // Log detailed error information
        console.error('Gemini API Error:', {
          message: err.message,
          details: err.details || 'No details',
          stack: err.stack,
          statusCode: err.statusCode || 'No status code',
        });
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, retries) * 1000;
        showProgress(`API error, retrying in ${delay}ms (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we get here, all retries failed
    throw error || new Error('Failed to generate summary after multiple attempts');
  } catch (error) {
    showError('Failed to generate summary', error);
    
    // Provide a fallback summary
    return {
      summary: 'Failed to generate summary. Please try again later.',
      originalWordCount,
      summaryWordCount: 0,
    };
  }
}
