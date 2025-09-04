import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useConversationStore } from '../../store';
import { useAIChat } from '../../hooks';
import { cn } from '../../utils';

interface FloatingMessageInputProps {
  className?: string;
  placeholder?: string;
}

export const FloatingMessageInput: React.FC<FloatingMessageInputProps> = ({
  className,
  placeholder = "Enter your message...",
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    activeBranchId,
    getActiveSession,
    createSession,
  } = useConversationStore();

  const { streamMessage, isLoading, error, clearError } = useAIChat();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Clear error when message changes
  useEffect(() => {
    if (error && message) {
      clearError();
    }
  }, [message, error, clearError]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!message.trim() || isLoading) return;

    // Create session if none exists
    let targetBranchId = activeBranchId;
    if (!getActiveSession()) {
      createSession();
      // Get the newly created session's active branch
      targetBranchId = useConversationStore.getState().activeBranchId;
    }

    if (!targetBranchId) {
      console.error('No active branch found');
      return;
    }

    const messageToSend = message.trim();
    setMessage('');

    try {
      await streamMessage(messageToSend, targetBranchId);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = message.trim().length > 0;
  const canSend = hasContent && !isLoading;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50',
        className
      )}
    >
      <form onSubmit={handleSubmit} className="relative">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Container */}
        <motion.div
          layout
          className={cn(
            'bg-white rounded-2xl shadow-lg border transition-all duration-200',
            isFocused 
              ? 'border-blue-300 shadow-xl ring-4 ring-blue-100' 
              : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
          )}
        >
          <div className="flex items-end gap-3 p-4">
            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={isLoading}
                className={cn(
                  'w-full resize-none border-none outline-none',
                  'text-gray-900 placeholder-gray-500 bg-transparent',
                  'text-sm leading-relaxed',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'min-h-[24px] max-h-[120px]'
                )}
                rows={1}
              />
              
              {/* Character count for long messages */}
              {message.length > 500 && (
                <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
                  {message.length}/2000
                </div>
              )}
            </div>

            {/* Send Button */}
            <motion.button
              type="submit"
              disabled={!canSend}
              whileHover={canSend ? { scale: 1.05 } : {}}
              whileTap={canSend ? { scale: 0.95 } : {}}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200 flex-shrink-0',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                canSend
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, rotate: -180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 180 }}
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, rotate: -180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 180 }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Input hints */}
          <AnimatePresence>
            {isFocused && !hasContent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-3 border-t border-gray-100"
              >
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <span>Powered by Gemini AI</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </form>
    </motion.div>
  );
};