import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ConversationMessage } from '../types';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async generateResponse(messages: ConversationMessage[]): Promise<string> {
    try {
      // Format conversation for Gemini API
      const conversationText = this.formatConversationForAPI(messages);

      const result = await this.model.generateContent(conversationText);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async *streamResponse(
    messages: ConversationMessage[]
  ): AsyncGenerator<string, void, unknown> {
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
      console.error('Error streaming response:', error);
      throw new Error('Failed to stream AI response');
    }
  }

  private formatConversationForAPI(messages: ConversationMessage[]): string {
    // Format messages for Gemini API
    const formattedMessages = messages.map(msg => {
      const role = msg.role === 'user' ? 'Human' : 'Assistant';
      return `${role}: ${msg.content}`;
    });

    return formattedMessages.join('\n\n') + '\n\nAssistant:';
  }

  // Alternative method for better conversation context
  async generateResponseWithContext(
    messages: ConversationMessage[],
    systemPrompt?: string
  ): Promise<string> {
    try {
      let prompt = '';
      
      if (systemPrompt) {
        prompt += `System: ${systemPrompt}\n\n`;
      }

      // Build conversation context
      messages.forEach(msg => {
        const role = msg.role === 'user' ? 'Human' : 'Assistant';
        prompt += `${role}: ${msg.content}\n\n`;
      });

      prompt += 'Assistant:';

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating response with context:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // Method to handle different model types
  switchModel(modelName: string) {
    try {
      this.model = this.genAI.getGenerativeModel({ model: modelName });
    } catch (error) {
      console.error('Error switching model:', error);
      // Fallback to default model
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    }
  }

  // Method to get available models (mock implementation)
  getAvailableModels(): string[] {
    return [
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro'
    ];
  }
}

// Singleton instance for the service
let geminiServiceInstance: GeminiService | null = null;

export const getGeminiService = (apiKey?: string): GeminiService => {
  if (!geminiServiceInstance && apiKey) {
    geminiServiceInstance = new GeminiService(apiKey);
  }
  
  if (!geminiServiceInstance) {
    throw new Error('Gemini service not initialized. Please provide an API key.');
  }
  
  return geminiServiceInstance;
};

export const initializeGeminiService = (apiKey: string): GeminiService => {
  geminiServiceInstance = new GeminiService(apiKey);
  return geminiServiceInstance;
};

// Mock service for development/testing
export class MockGeminiService extends GeminiService {
  constructor() {
    // Use a dummy API key for the mock
    super('mock-api-key');
  }

  async generateResponse(messages: ConversationMessage[]): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const lastMessage = messages[messages.length - 1];
    const responses = [
      `That's an interesting question about "${lastMessage.content}". Let me think about that...`,
      `I understand you're asking about "${lastMessage.content}". Here's my perspective on that topic.`,
      `Great question! Regarding "${lastMessage.content}", I think there are several angles to consider.`,
      `Thank you for asking about "${lastMessage.content}". This is a fascinating topic that touches on several important areas.`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async *streamResponse(messages: ConversationMessage[]): AsyncGenerator<string, void, unknown> {
    const response = await this.generateResponse(messages);
    const words = response.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      yield words[i] + ' ';
    }
  }
}