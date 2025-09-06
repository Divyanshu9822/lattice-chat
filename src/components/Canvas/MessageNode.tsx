import React, { useState, useRef, useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { MoreHorizontal, User, Bot, Plus } from 'lucide-react';
import type { ConversationMessage, TextSelection } from '../../types';
import { cn, formatTimestamp } from '../../utils';

export interface MessageNodeData {
  exchange?: {
    userMessage: ConversationMessage;
    aiResponse?: ConversationMessage;
    isGenerating?: boolean;
  };
  message?: ConversationMessage; // Keep for backward compatibility
  isSelected?: boolean;
  onTextSelection?: (selection: TextSelection) => void;
  onBranch?: (nodeId: string, selection?: TextSelection) => void;
}

export const MessageNode: React.FC<NodeProps<MessageNodeData>> = ({
  id,
  data,
  selected,
}) => {
  const [showBranchButton, setShowBranchButton] = useState(false);
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const userContentRef = useRef<HTMLDivElement>(null);
  const aiContentRef = useRef<HTMLDivElement>(null);

  const { exchange, message, onTextSelection, onBranch } = data;
  
  // Support both exchange mode and legacy single message mode
  const isExchangeMode = !!exchange;
  const userMessage = exchange?.userMessage || (message?.role === 'user' ? message : null);
  const aiResponse = exchange?.aiResponse || (message?.role === 'assistant' ? message : null);
  const isGenerating = exchange?.isGenerating || false;

  const handleTextSelection = useCallback((contentType: 'user' | 'ai') => {
    const selection = window.getSelection();
    const contentRef = contentType === 'user' ? userContentRef : aiContentRef;
    
    if (!selection || selection.isCollapsed || !contentRef.current) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    
    const selectionData: TextSelection = {
      nodeId: id,
      startIndex: range.startOffset,
      endIndex: range.endOffset,
      selectedText,
    };

    setTextSelection(selectionData);
    onTextSelection?.(selectionData);
    setShowBranchButton(true);
  }, [id, onTextSelection]);

  const handleBranchClick = useCallback(() => {
    onBranch?.(id, textSelection || undefined);
    setShowBranchButton(false);
    setTextSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [id, onBranch, textSelection]);

  const handleMouseLeave = useCallback(() => {
    if (!textSelection) {
      setShowBranchButton(false);
    }
  }, [textSelection]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative bg-white rounded-lg shadow-lg border-2 transition-all duration-200',
        'min-w-[380px] max-w-[520px]',
        selected ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-gray-300',
        'cursor-default'
      )}
      onMouseLeave={handleMouseLeave}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        style={{ bottom: -6 }}
      />

      {isExchangeMode ? (
        /* Exchange Mode: User Question + AI Response */
        <>
          {/* User Message Section */}
          {userMessage && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-3 bg-blue-50 flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">You</p>
                </div>
                <p className="text-xs text-gray-500">
                  {formatTimestamp(userMessage.timestamp)}
                </p>
              </div>
              <div className="p-4">
                <div
                  ref={userContentRef}
                  className="text-sm leading-relaxed text-gray-900 whitespace-pre-wrap break-words select-text"
                  onMouseUp={() => handleTextSelection('user')}
                >
                  {userMessage.content}
                </div>
              </div>
            </div>
          )}

          {/* AI Response Section */}
          <div>
            <div className="px-4 py-3 bg-green-50 flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">Assistant</p>
              </div>
              {aiResponse?.metadata?.model && (
                <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                  {aiResponse.metadata.model}
                </span>
              )}
              {aiResponse && (
                <p className="text-xs text-gray-500">
                  {formatTimestamp(aiResponse.timestamp)}
                </p>
              )}
            </div>
            <div className="p-4 relative">
              {isGenerating ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm">Thinking...</span>
                </div>
              ) : aiResponse ? (
                <div
                  ref={aiContentRef}
                  className="text-sm leading-relaxed text-gray-900 whitespace-pre-wrap break-words select-text"
                  onMouseUp={() => handleTextSelection('ai')}
                >
                  {aiResponse.content}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic">
                  Response pending...
                </div>
              )}

              {/* Branch Button for Text Selection */}
              {showBranchButton && textSelection && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleBranchClick}
                  className="absolute z-10 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors duration-200"
                  style={{
                    right: 8,
                    top: 8,
                  }}
                  title="Create branch from selection"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Legacy Mode: Single Message */
        <>
          {/* Node Header */}
          <div className={cn(
            'px-4 py-3 border-b border-gray-100 flex items-center gap-3',
            message?.role === 'user' ? 'bg-blue-50' : 'bg-green-50'
          )}>
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              message?.role === 'user' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
            )}>
              {message?.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900">
                {message?.role === 'user' ? 'You' : 'Assistant'}
              </p>
              {message && (
                <p className="text-xs text-gray-500">
                  {formatTimestamp(message.timestamp)}
                </p>
              )}
            </div>
            {message?.metadata?.model && (
              <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                {message.metadata.model}
              </span>
            )}
          </div>

          {/* Message Content */}
          <div className="p-4 relative">
            {message && (
              <div
                ref={userContentRef}
                className="text-sm leading-relaxed text-gray-900 whitespace-pre-wrap break-words select-text"
                onMouseUp={() => handleTextSelection('user')}
              >
                {message.content}
              </div>
            )}

            {/* Branch Button for Text Selection */}
            {showBranchButton && textSelection && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleBranchClick}
                className="absolute z-10 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors duration-200"
                style={{
                  left: 100,
                  top: 20,
                }}
                title="Create branch from selection"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </>
      )}

      {/* General Branch Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: selected ? 1 : 0 }}
        className="absolute top-2 right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
        onClick={() => onBranch?.(id)}
        title="Create branch from this exchange"
      >
        <MoreHorizontal className="w-3 h-3 text-gray-600" />
      </motion.button>

      {/* Node Status Indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
      )}
    </motion.div>
  );
};

MessageNode.displayName = 'MessageNode';