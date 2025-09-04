import React from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import type { ConversationMessage } from '../../types';
import { cn, formatTimestamp } from '../../utils';

interface MessageBubbleProps {
  message: ConversationMessage;
  onBranch: () => void;
  showBranchButton: boolean;
  isStreaming?: boolean;
  streamingText?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onBranch,
  showBranchButton,
  isStreaming = false,
  streamingText = '',
}) => {
  const isUser = message.role === 'user';
  const displayContent = isStreaming ? streamingText : message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'relative group mb-4 last:mb-0',
        isUser ? 'flex justify-end' : 'flex justify-start'
      )}
    >
      {/* Message Content */}
      <div
        className={cn(
          'relative max-w-[85%] px-4 py-3 rounded-2xl shadow-sm',
          'transition-all duration-200 ease-in-out',
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md border border-gray-200'
        )}
      >
        {/* Message Text */}
        <div className={cn(
          'text-sm leading-relaxed whitespace-pre-wrap break-words',
          isUser ? 'text-white' : 'text-gray-900'
        )}>
          {displayContent}
          {isStreaming && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
              className="inline-block w-2 h-4 ml-1 bg-current rounded-sm"
            />
          )}
        </div>

        {/* Message Metadata */}
        {message.timestamp && !isStreaming && (
          <div className={cn(
            'mt-1 text-xs opacity-70',
            isUser ? 'text-blue-100' : 'text-gray-500'
          )}>
            {formatTimestamp(message.timestamp)}
            {message.metadata?.model && (
              <span className="ml-2">
                • {message.metadata.model}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Branch Button */}
      {showBranchButton && !isStreaming && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 z-10',
            'w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md',
            'flex items-center justify-center',
            'hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'transition-all duration-200 ease-in-out',
            'group-hover:opacity-100',
            isUser ? '-left-3' : '-right-3'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onBranch();
          }}
          title="Create branch from this message"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-600" />
        </motion.button>
      )}

      {/* Hover Effect */}
      <div className={cn(
        'absolute inset-0 rounded-2xl pointer-events-none',
        'transition-all duration-200 ease-in-out',
        'group-hover:bg-black/5',
        isUser ? 'group-hover:bg-white/10' : 'group-hover:bg-black/5'
      )} />
    </motion.div>
  );
};