import React, { useState, useRef, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { User, Bot, GitBranch, Quote, Clock, Zap } from 'lucide-react';
import type { ConversationNode, TextSelection } from '../../types';
import { Button } from '../ui';
import { cn, formatTimestamp } from '../../utils';
import { AI_CONFIG } from '../../config/app';

export interface MessageNodeData {
  node: ConversationNode;
  isStreaming?: boolean;
  streamingText?: string;
  onTextSelection?: (selection: TextSelection) => void;
  onBranch?: (nodeId: string, selection?: TextSelection) => void;
}

export const MessageNode: React.FC<NodeProps & { data: MessageNodeData }> = ({
  id,
  data,
  selected,
}) => {
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const aiContentRef = useRef<HTMLDivElement>(null);

  const { node, isStreaming, streamingText, onTextSelection, onBranch } = data;
  const { currentExchange } = node;
  
  // Get conversation context indicators
  const messageCount = node.messages?.length || 0;
  const hasQuotedText = currentExchange?.quotedText;

  const handleTextSelection = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setTextSelection(null);
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText) {
        setTextSelection(null);
        return;
      }

      // Only track selection if it's in AI content
      const range = selection.getRangeAt(0);
      const aiContentElement = aiContentRef.current;
      
      if (!aiContentElement || !aiContentElement.contains(range.commonAncestorContainer)) {
        setTextSelection(null);
        return;
      }

      // Compute offsets relative to the full AI content text
      const prefixRange = document.createRange();
      prefixRange.setStart(aiContentElement, 0);
      prefixRange.setEnd(range.startContainer, range.startOffset);
      
      const startIndex = prefixRange.toString().length;
      const endIndex = startIndex + selectedText.length;

      const selectionData: TextSelection = {
        nodeId: id,
        startIndex,
        endIndex,
        selectedText,
        position: { x: 0, y: 0 },
      };

      setTextSelection(selectionData);
      onTextSelection?.(selectionData);
    }, 100);
  }, [id, onTextSelection]);

  const handleSelectionClear = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setTextSelection(null);
    }
  }, []);

  // Listen for selection changes globally
  React.useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionClear);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionClear);
    };
  }, [handleSelectionClear]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'relative rounded-2xl transition-all duration-250 ease-smooth',
          'min-w-[400px] max-w-[600px]',
          selected 
            ? 'shadow-glow-lg scale-[1.02]' 
            : 'shadow-large hover:shadow-xl hover:scale-[1.01]',
          'cursor-default bg-canvas-node-bg-light dark:bg-canvas-node-bg-dark',
          'border border-canvas-node-border-light dark:border-canvas-node-border-dark',
          selected && 'border-primary-300 dark:border-primary-600'
        )}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Top}
          className={cn(
            'w-3 h-3 border-2 transition-colors duration-200',
            selected 
              ? 'bg-primary-500 border-primary-300 dark:border-primary-600' 
              : 'bg-secondary-400 border-white dark:border-secondary-800'
          )}
          style={{ top: -6 }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className={cn(
            'w-3 h-3 border-2 transition-colors duration-200',
            selected 
              ? 'bg-primary-500 border-primary-300 dark:border-primary-600' 
              : 'bg-secondary-400 border-white dark:border-secondary-800'
          )}
          style={{ bottom: -6 }}
        />

        {/* Context Header */}
        {(messageCount > 0 || hasQuotedText) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-5 py-3 bg-secondary-50/50 dark:bg-secondary-900/30 border-b border-secondary-200/50 dark:border-secondary-700/50 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 text-xs">
              {messageCount > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary-200/70 dark:bg-secondary-700/70 rounded-lg">
                  <Clock className="w-3 h-3 text-secondary-500 dark:text-secondary-400" />
                  <span className="text-secondary-700 dark:text-secondary-300 font-medium">
                    {messageCount} in history
                  </span>
                </div>
              )}
              {hasQuotedText && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Quote className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  <span className="text-primary-700 dark:text-primary-300 font-medium">
                    "{hasQuotedText.slice(0, 25)}..."
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* User Message Section */}
        <div className="border-b border-secondary-200/50 dark:border-secondary-700/50">
          <div className="px-5 py-3 bg-gradient-to-r from-primary-50/70 via-primary-50/50 to-transparent dark:from-primary-950/30 dark:via-primary-950/20 dark:to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-medium">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-secondary-900 dark:text-secondary-100">
                    You
                  </span>
                  <div className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">
                    {formatTimestamp(node.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="nodrag px-5 py-4" style={{ userSelect: 'text' }}>
            <div className="nodrag text-sm leading-relaxed text-secondary-900 dark:text-secondary-100 whitespace-pre-wrap break-words select-text cursor-text font-medium">
              {currentExchange?.userMessage}
            </div>
          </div>
        </div>

        {/* AI Response Section */}
        <div>
          <div className="px-5 py-3 bg-gradient-to-r from-accent-emerald-50/70 via-accent-emerald-50/50 to-transparent dark:from-accent-emerald-950/30 dark:via-accent-emerald-950/20 dark:to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-accent-emerald-500 to-accent-emerald-600 rounded-xl flex items-center justify-center shadow-medium">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-secondary-900 dark:text-secondary-100">
                    Assistant
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent-amber-100 dark:bg-accent-amber-900/30 rounded-md">
                    <Zap className="w-2.5 h-2.5 text-accent-amber-600 dark:text-accent-amber-400" />
                    <span className="text-xs font-medium text-accent-amber-700 dark:text-accent-amber-300">
                      {AI_CONFIG.modelDisplayName}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-secondary-500 dark:text-secondary-400">
                {formatTimestamp(node.createdAt)}
              </span>
            </div>
          </div>
          
          <div className="nodrag px-5 py-4 relative" style={{ userSelect: 'text' }}>
            {isStreaming ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-accent-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-accent-emerald-600 dark:text-accent-emerald-400 font-medium animate-glow-pulse">
                    Thinking...
                  </span>
                </div>
                {streamingText && (
                  <motion.div
                    ref={aiContentRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="nodrag text-sm leading-relaxed text-secondary-800 dark:text-secondary-200 whitespace-pre-wrap break-words select-text cursor-text"
                    onMouseUp={handleTextSelection}
                    style={{ userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text' }}
                  >
                    {streamingText}
                    <motion.span 
                      className="inline-block w-2 h-4 bg-accent-emerald-500 ml-1"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                    />
                  </motion.div>
                )}
              </div>
            ) : currentExchange?.aiResponse ? (
              <div
                ref={aiContentRef}
                className="nodrag text-sm leading-relaxed text-secondary-800 dark:text-secondary-200 whitespace-pre-wrap break-words select-text cursor-text"
                onMouseUp={handleTextSelection}
                style={{ userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text' }}
              >
                {currentExchange.aiResponse}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400">
                <div className="w-4 h-4 border-2 border-secondary-300 dark:border-secondary-600 border-t-transparent rounded-full animate-spin" />
                <span className="italic">Awaiting response...</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Branch Button */}
        {textSelection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute -top-6 -right-4 z-50"
            style={{ 
              pointerEvents: 'auto',
              transform: 'translateZ(0)', // Force hardware acceleration
            }}
          >
            <Button
              size="sm"
              onClick={() => {
                onBranch?.(id, textSelection);
                setTextSelection(null);
                window.getSelection()?.removeAllRanges();
              }}
              className="shadow-xl bg-primary-600 hover:bg-primary-700 text-white border-2 border-white gap-2 px-4 py-2 whitespace-nowrap rounded-full"
              title={`Create branch from: "${textSelection.selectedText.slice(0, 30)}..."`}
            >
              <GitBranch className="w-4 h-4" />
              <span className="text-xs font-semibold">Branch</span>
            </Button>
          </motion.div>
        )}

        {/* Selection Indicator */}
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 rounded-full border-2 border-white dark:border-secondary-900 shadow-medium flex items-center justify-center"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-glow-pulse" />
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

MessageNode.displayName = 'MessageNode';
