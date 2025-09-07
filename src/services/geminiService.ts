import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ConversationMessage } from '../types';

/**
 * Service class for interacting with Google's Gemini AI API
 */
export class GeminiService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private readonly modelName: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = 'gemini-2.5-flash';
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
  }

  /**
   * Generate a single response from the AI model
   */
  async generateResponse(messages: ConversationMessage[]): Promise<string> {
    if (!messages || messages.length === 0) {
      throw new Error('At least one message is required');
    }

    try {
      const conversationText = this.formatConversationForAPI(messages);
      const result = await this.model.generateContent(conversationText);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream a response from the AI model
   */
  async *streamResponse(messages: ConversationMessage[]): AsyncGenerator<string, void, unknown> {
    if (!messages || messages.length === 0) {
      throw new Error('At least one message is required');
    }

    try {
      const conversationText = this.formatConversationForAPI(messages);
      const result = await this.model.generateContentStream(conversationText);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (error) {
      throw new Error(`Failed to stream AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate response with additional system context
   */
  async generateResponseWithContext(
    messages: ConversationMessage[],
    systemPrompt?: string
  ): Promise<string> {
    if (!messages || messages.length === 0) {
      throw new Error('At least one message is required');
    }

    try {
      let prompt = '';
      
      if (systemPrompt && systemPrompt.trim() !== '') {
        prompt += `System: ${systemPrompt}\n\n`;
      }

      messages.forEach(msg => {
        const role = msg.role === 'user' ? 'Human' : 'Assistant';
        prompt += `${role}: ${msg.content}\n\n`;
      });

      prompt += 'Assistant:';

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Failed to generate AI response with context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the current model name
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Format conversation messages for the Gemini API
   */
  private formatConversationForAPI(messages: ConversationMessage[]): string {
    const formattedMessages = messages.map(msg => {
      const role = msg.role === 'user' ? 'Human' : 'Assistant';
      let content = msg.content;
      
      // Add quoted text context if present
      if (msg.quotedText && msg.quotedText.trim() !== '') {
        content = `[Referencing: "${msg.quotedText}"]\n\n${content}`;
      }
      
      return `${role}: ${content}`;
    });

    return formattedMessages.join('\n\n') + '\n\nAssistant:';
  }
}

/**
 * Singleton instance for the service
 */
let geminiServiceInstance: GeminiService | null = null;

/**
 * Get the existing Gemini service instance or create a new one
 */
export const getGeminiService = (apiKey?: string): GeminiService => {
  if (!geminiServiceInstance && apiKey) {
    geminiServiceInstance = new GeminiService(apiKey);
  }
  
  if (!geminiServiceInstance) {
    throw new Error('Gemini service not initialized. Please provide a valid API key.');
  }
  
  return geminiServiceInstance;
};

/**
 * Initialize the Gemini service with an API key
 */
export const initializeGeminiService = (apiKey: string): GeminiService => {
  geminiServiceInstance = new GeminiService(apiKey);
  return geminiServiceInstance;
};

/**
 * Reset the service instance (useful for testing)
 */
export const resetGeminiService = (): void => {
  geminiServiceInstance = null;
};
