import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import type { ConversationBranch } from '../../types';
import { cn } from '../../utils';
import { useConversationStore } from '../../store';

interface ConversationCardProps {
  branch: ConversationBranch;
  isActive: boolean;
  onBranch: (messageIndex: number) => void;
  onFocus: () => void;
  isStreaming?: boolean;
  streamingText?: string;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  branch,
  isActive,
  onBranch,
  onFocus,
  isStreaming = false,
  streamingText = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { streamingState } = useConversationStore();
  
  const isStreamingToBranch = streamingState.isStreaming && streamingState.branchId === branch.id;

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [branch.messages.length, isStreamingToBranch, streamingState.currentText]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger focus if not clicking on interactive elements
    const target = e.target as HTMLElement;
    if (!target.closest('button')) {
      onFocus();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={{ 
        duration: 0.3, 
        ease: 'easeOut',
        layout: { duration: 0.3 }
      }}
      className={cn(
        'bg-white rounded-lg shadow-sm border transition-all duration-200 ease-in-out',
        'cursor-pointer select-none flex-shrink-0',
        'hover:shadow-md hover:border-gray-300',
        isActive 
          ? 'ring-2 ring-blue-500 border-blue-200 shadow-md' 
          : 'border-gray-200 hover:border-gray-300',
        'w-96 h-[600px] flex flex-col'
      )}
      onClick={handleCardClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Card Header */}
      <div className={cn(
        'px-6 py-4 border-b border-gray-100 flex-shrink-0',
        'bg-gray-50/50 rounded-t-lg'
      )}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 truncate">
              {branch.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {branch.messages.length} messages
              {branch.parentBranchId && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  Branch
                </span>
              )}
            </p>
          </div>
          
          {/* Activity Indicator */}
          {isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3 bg-blue-500 rounded-full"
            />
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={scrollRef}
        className={cn(
          'flex-1 overflow-y-auto px-6 py-4 space-y-1',
          'scrollbar-none'
        )}
      >
        {branch.messages.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg 
                  className="w-6 h-6 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Start a conversation</p>
            </div>
          </div>
        ) : (
          /* Messages */
          <>
            {branch.messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                onBranch={() => onBranch(index)}
                showBranchButton={index < branch.messages.length - 1 || !isStreamingToBranch}
                isStreaming={false}
              />
            ))}
            
            {/* Streaming Message */}
            {isStreamingToBranch && streamingState.currentText && (
              <MessageBubble
                message={{
                  id: 'streaming',
                  content: streamingState.currentText,
                  role: 'assistant',
                  timestamp: new Date(),
                }}
                onBranch={() => {}}
                showBranchButton={false}
                isStreaming={true}
                streamingText={streamingState.currentText}
              />
            )}
          </>
        )}
      </div>

      {/* Card Footer */}
      <div className={cn(
        'px-6 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50/30',
        'flex items-center justify-between text-xs text-gray-500'
      )}>
        <span>
          Updated {new Date(branch.updatedAt).toLocaleTimeString()}
        </span>
        {isStreamingToBranch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 text-blue-600"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full"
            />
            <span>AI thinking...</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};