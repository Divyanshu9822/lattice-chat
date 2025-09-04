import { useState, useCallback, useRef } from 'react';
import { getGeminiService, MockGeminiService } from '../services/geminiService';
import { useConversationStore } from '../store';
import type { ConversationMessage } from '../types';

interface UseAIChat {
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, branchId?: string) => Promise<void>;
  streamMessage: (message: string, branchId?: string) => Promise<void>;
  clearError: () => void;
}

export const useAIChat = (): UseAIChat => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    addMessage,
    activeBranchId,
    getConversationHistory,
    startStreaming,
    updateStreamingText,
    finishStreaming,
  } = useConversationStore();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAIService = useCallback(() => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('No API key found, using mock service');
        return new MockGeminiService();
      }
      return getGeminiService(apiKey);
    } catch (error) {
      console.warn('Failed to initialize Gemini service, using mock service');
      return new MockGeminiService();
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string, branchId?: string) => {
      const targetBranchId = branchId || activeBranchId;
      if (!targetBranchId) {
        setError('No active conversation branch');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Add user message
        const userMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          content: message,
          role: 'user',
          timestamp: new Date(),
        };
        addMessage(targetBranchId, userMessage);

        // Get conversation history
        const history = getConversationHistory(targetBranchId);
        
        // Get AI service and generate response
        const aiService = getAIService();
        const response = await aiService.generateResponse(history);

        // Add AI response
        const aiMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          content: response,
          role: 'assistant',
          timestamp: new Date(),
          metadata: {
            model: 'gemini-2.0-flash-exp',
          },
        };
        addMessage(targetBranchId, aiMessage);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        console.error('Error sending message:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [activeBranchId, addMessage, getConversationHistory, getAIService]
  );

  const streamMessage = useCallback(
    async (message: string, branchId?: string) => {
      const targetBranchId = branchId || activeBranchId;
      if (!targetBranchId) {
        setError('No active conversation branch');
        return;
      }

      setIsLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      try {
        // Add user message
        const userMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          content: message,
          role: 'user',
          timestamp: new Date(),
        };
        addMessage(targetBranchId, userMessage);

        // Get conversation history including the new user message
        const history = getConversationHistory(targetBranchId);
        
        // Start streaming
        startStreaming(targetBranchId);
        
        // Get AI service and stream response
        const aiService = getAIService();
        let fullResponse = '';

        for await (const chunk of aiService.streamResponse(history)) {
          // Check if aborted
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          fullResponse += chunk;
          updateStreamingText(fullResponse);
        }

        // Finish streaming
        finishStreaming();

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to stream message';
        setError(errorMessage);
        console.error('Error streaming message:', err);
        finishStreaming(); // Clean up streaming state
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      activeBranchId,
      addMessage,
      getConversationHistory,
      startStreaming,
      updateStreamingText,
      finishStreaming,
      getAIService,
    ]
  );

  // Cleanup on unmount
  // useEffect(() => {
  //   return () => {
  //     if (abortControllerRef.current) {
  //       abortControllerRef.current.abort();
  //     }
  //   };
  // }, []);

  return {
    isLoading,
    error,
    sendMessage,
    streamMessage,
    clearError,
  };
};