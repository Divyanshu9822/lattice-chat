import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Quote, ArrowUpRight } from 'lucide-react';
import { Button } from '../ui';
import { cn } from '../../utils';

interface FloatingBranchInputProps {
  position: { x: number; y: number };
  onSubmit: (message: string) => void;
  onCancel: () => void;
  selectedText?: string;
  quotedText?: string;
  placeholder?: string;
  className?: string;
}

export const FloatingBranchInput: React.FC<FloatingBranchInputProps> = ({
  position,
  onSubmit,
  onCancel,
  selectedText,
  quotedText,
  placeholder,
  className,
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus the input when it appears
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        
        // If there's quoted text, position cursor after it
        if (quotedText) {
          const cursorPosition = 0; // Start at beginning for user to type their question
          textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [quotedText]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 80), 200)}px`;
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
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn("fixed z-50", className)}
      style={className?.includes('!relative') ? {} : {
        left: Math.max(20, Math.min(position.x - 200, window.innerWidth - 420)),
        top: Math.max(20, position.y - 100),
      }}
    >
      {/* Connection Line to Source (visual enhancement) */}
      {!className?.includes('!relative') && selectedText && (
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="absolute -top-12 left-1/2 transform -translate-x-1/2"
        >
          <svg width="2" height="48" className="text-primary-300 dark:text-primary-600">
            <line
              x1="1" y1="0" x2="1" y2="48"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="animate-glow-pulse"
            />
          </svg>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          layout
          className={cn(
            'bg-white/95 dark:bg-secondary-900/95 backdrop-blur-xl rounded-2xl overflow-hidden',
            'border border-secondary-200/50 dark:border-secondary-700/50 shadow-xl',
            className?.includes('!relative') ? 'w-full max-w-2xl mx-auto' : 'min-w-[380px] max-w-[500px]',
            isFocused ? 'shadow-glow-lg border-primary-300/50 dark:border-primary-600/50' : ''
          )}
        >
          {/* Reference Header */}
          {selectedText && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="px-5 py-3 bg-gradient-to-r from-primary-50/80 via-primary-50/60 to-transparent dark:from-primary-950/40 dark:via-primary-950/20 dark:to-transparent border-b border-primary-200/30 dark:border-primary-800/30"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-soft">
                    <Quote className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wide">
                    Referencing
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="ml-auto -mr-1 -mt-1 h-6 w-6 p-0 hover:bg-primary-100 dark:hover:bg-primary-900/50"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Elegant Quote Display */}
              <motion.blockquote
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mt-3 pl-4 border-l-3 border-primary-300 dark:border-primary-600 relative"
              >
                <p className="text-sm text-primary-800 dark:text-primary-200 font-medium leading-relaxed line-clamp-3">
                  "{selectedText}"
                </p>
                <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-primary-400 to-primary-600 dark:from-primary-500 dark:to-primary-400" />
              </motion.blockquote>
            </motion.div>
          )}

          {/* Input Section */}
          <div className="p-5">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={placeholder || (selectedText 
                    ? "Ask a follow-up question or continue the conversation..." 
                    : "Start a new conversation...")}
                  className={cn(
                    'w-full resize-none border-none outline-none bg-transparent',
                    'text-sm text-secondary-900 dark:text-secondary-100 placeholder-secondary-500 dark:placeholder-secondary-400',
                    'min-h-[60px] max-h-[200px] leading-relaxed font-medium',
                    'selection:bg-primary-200 dark:selection:bg-primary-800'
                  )}
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pb-1">
                <Button
                  type="submit"
                  disabled={!canSend}
                  size="icon"
                  className={cn(
                    'h-10 w-10 rounded-xl shadow-medium transition-all duration-200',
                    canSend
                      ? 'bg-primary-600 hover:bg-primary-700 text-white hover:scale-105 hover:shadow-large'
                      : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-500 dark:text-secondary-400 cursor-not-allowed'
                  )}
                  title="Send message"
                >
                  <ArrowUpRight className={cn(
                    'transition-transform duration-200',
                    canSend ? 'w-4 h-4' : 'w-4 h-4'
                  )} />
                </Button>
              </div>
            </div>

            {/* Enhanced Keyboard Shortcuts */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-4 pt-3 border-t border-secondary-200/50 dark:border-secondary-700/50"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-secondary-500 dark:text-secondary-400">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-secondary-100 dark:bg-secondary-800 rounded text-xs font-mono border border-secondary-300 dark:border-secondary-600">
                      Enter
                    </kbd>
                    <span>Send</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-secondary-100 dark:bg-secondary-800 rounded text-xs font-mono border border-secondary-300 dark:border-secondary-600">
                      Shift
                    </kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 bg-secondary-100 dark:bg-secondary-800 rounded text-xs font-mono border border-secondary-300 dark:border-secondary-600">
                      Enter
                    </kbd>
                    <span>New line</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-secondary-100 dark:bg-secondary-800 rounded text-xs font-mono border border-secondary-300 dark:border-secondary-600">
                      Esc
                    </kbd>
                    <span>Cancel</span>
                  </div>
                </div>
                
                {/* Character counter for long messages */}
                {message.length > 100 && (
                  <div className={cn(
                    'text-xs font-medium',
                    message.length > 1000 
                      ? 'text-accent-amber-600 dark:text-accent-amber-400' 
                      : 'text-secondary-400 dark:text-secondary-500'
                  )}>
                    {message.length.toLocaleString()} characters
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </form>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 -z-10 bg-primary-500/5 dark:bg-primary-400/5 rounded-2xl blur-xl" />
    </motion.div>
  );
};
