import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { cn } from '../../utils';

interface FloatingBranchInputProps {
  position: { x: number; y: number };
  onSubmit: (message: string) => void;
  onCancel: () => void;
  selectedText?: string;
}

export const FloatingBranchInput: React.FC<FloatingBranchInputProps> = ({
  position,
  onSubmit,
  onCancel,
  selectedText,
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus the input when it appears
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!message.trim()) return;
    
    onSubmit(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const canSend = message.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed z-50"
      style={{
        left: position.x - 150, // Center the input on the position
        top: position.y - 80,   // Position above the click point
      }}
    >
      {/* Pointer Arrow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          layout
          className={cn(
            'bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden',
            'min-w-[300px] max-w-[400px]',
            isFocused ? 'ring-2 ring-blue-500 border-blue-300' : ''
          )}
        >
          {/* Header */}
          {selectedText && (
            <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
              <p className="text-xs text-blue-700 font-medium">Branching from:</p>
              <p className="text-sm text-blue-900 truncate" title={selectedText}>
                "{selectedText}"
              </p>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={selectedText 
                    ? "Continue the conversation from this point..." 
                    : "Start a new branch..."}
                  className={cn(
                    'w-full resize-none border-none outline-none bg-transparent',
                    'text-sm text-gray-900 placeholder-gray-500',
                    'min-h-[40px] max-h-[120px]'
                  )}
                  rows={2}
                />
              </div>

              <div className="flex gap-1">
                {/* Send Button */}
                <motion.button
                  type="submit"
                  disabled={!canSend}
                  whileHover={canSend ? { scale: 1.05 } : {}}
                  whileTap={canSend ? { scale: 0.95 } : {}}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    canSend
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                  title="Send message (Enter)"
                >
                  <Send className="w-4 h-4" />
                </motion.button>

                {/* Cancel Button */}
                <motion.button
                  type="button"
                  onClick={onCancel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Cancel (Esc)"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Hint */}
            <div className="mt-2 text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line, Esc to cancel
            </div>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
};