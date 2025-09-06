import { useState, useCallback, useRef, useEffect } from 'react';
import { getGeminiService } from '../services/geminiService';
import { useConversationStore } from '../store';
import type { ConversationMessage } from '../types';

interface UseAIChat {
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, nodeId?: string) => Promise<string>;
  streamMessage: (message: string, nodeId?: string) => Promise<string>;
  clearError: () => void;
}

/**
 * Custom hook for AI chat functionality
 * Provides methods to send messages and stream responses from the AI service
 */
export const useAIChat = (): UseAIChat => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    getNodeHistory,
    startStreaming,
    updateStreamingText,
    finishStreaming,
  } = useConversationStore();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get the AI service instance with proper error handling
   */
  const getAIService = useCallback(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }
    
    return getGeminiService(apiKey);
  }, []);

  /**
   * Send a message and get a complete response
   */
  const sendMessage = useCallback(
    async (message: string, nodeId?: string): Promise<string> => {
      if (!message.trim()) {
        const error = 'Message cannot be empty';
        setError(error);
        throw new Error(error);
      }

      if (!nodeId) {
        const error = 'Node ID is required for message context';
        setError(error);
        throw new Error(error);
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get conversation history for the specified node
        const history = getNodeHistory(nodeId);
        
        // Add the new user message to history for AI context
        const userMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          content: message.trim(),
          role: 'user',
          timestamp: new Date(),
        };
        const updatedHistory = [...history, userMessage];

        // Get AI service and generate response
        const aiService = getAIService();
        const response = await aiService.generateResponse(updatedHistory);

        return response;

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getNodeHistory, getAIService]
  );

  /**
   * Stream a message response with real-time updates
   */
  const streamMessage = useCallback(
    async (message: string, nodeId?: string): Promise<string> => {
      if (!message.trim()) {
        const error = 'Message cannot be empty';
        setError(error);
        throw new Error(error);
      }

      if (!nodeId) {
        const error = 'Node ID is required for message context';
        setError(error);
        throw new Error(error);
      }

      setIsLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      try {
        // Get conversation history for the specified node
        const history = getNodeHistory(nodeId);
        
        // Add the new user message to history for AI context
        const userMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          content: message.trim(),
          role: 'user',
          timestamp: new Date(),
        };
        const updatedHistory = [...history, userMessage];
        
        // Start streaming state
        startStreaming(nodeId);
        
        // Get AI service and stream response
        const aiService = getAIService();
        let fullResponse = '';

        for await (const chunk of aiService.streamResponse(updatedHistory)) {
          // Check if streaming was aborted
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          fullResponse += chunk;
          updateStreamingText(fullResponse);
        }

        finishStreaming();
        return fullResponse;

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to stream message';
        setError(errorMessage);
        finishStreaming(); // Clean up streaming state
        throw err;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      getNodeHistory,
      startStreaming,
      updateStreamingText,
      finishStreaming,
      getAIService,
    ]
  );

  /**
   * Abort any ongoing streaming operation
   */
  const abortStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortStreaming();
    };
  }, [abortStreaming]);

  return {
    isLoading,
    error,
    sendMessage,
    streamMessage,
    clearError,
  };
};
