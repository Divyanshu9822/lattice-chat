import { useCallback } from 'react';
import { useConversationStore } from '../store';
import type { ConversationMessage } from '../types';
import { generateId } from '../utils';

export const useConversationBranching = () => {
  const {
    createBranch,
    addMessage,
    setActiveBranch,
    getConversationHistory,
    activeBranchId,
  } = useConversationStore();

  const createBranchFromMessage = useCallback(
    (parentBranchId: string, messageIndex: number, newMessage?: string): string => {
      try {
        const newBranchId = createBranch(parentBranchId, messageIndex, newMessage);
        if (newBranchId) {
          setActiveBranch(newBranchId);
        }
        return newBranchId;
      } catch (error) {
        console.error('Error creating branch:', error);
        return '';
      }
    },
    [createBranch, setActiveBranch]
  );

  const addMessageToBranch = useCallback(
    (branchId: string, content: string, role: 'user' | 'assistant'): string => {
      const message: ConversationMessage = {
        id: generateId(),
        content,
        role,
        timestamp: new Date(),
      };

      addMessage(branchId, message);
      return message.id;
    },
    [addMessage]
  );

  const getBranchHistory = useCallback(
    (branchId: string) => {
      return getConversationHistory(branchId);
    },
    [getConversationHistory]
  );

  const getActiveBranchHistory = useCallback(() => {
    if (!activeBranchId) return [];
    return getConversationHistory(activeBranchId);
  }, [activeBranchId, getConversationHistory]);

  const switchToActiveBranch = useCallback(
    (branchId: string) => {
      setActiveBranch(branchId);
    },
    [setActiveBranch]
  );

  return {
    createBranchFromMessage,
    addMessageToBranch,
    getBranchHistory,
    getActiveBranchHistory,
    switchToActiveBranch,
    activeBranchId,
  };
};