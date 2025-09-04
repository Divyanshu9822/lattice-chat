import React, { useState, useRef, useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { MoreHorizontal, User, Bot, Plus } from 'lucide-react';
import type { ConversationMessage, TextSelection } from '../../types';
import { cn, formatTimestamp } from '../../utils';

export interface MessageNodeData {
  message: ConversationMessage;
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
  const contentRef = useRef<HTMLDivElement>(null);

  const { message, onTextSelection, onBranch } = data;
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    const contentElement = contentRef.current;
    // const rect = range.getBoundingClientRect();
    // const contentRect = contentElement.getBoundingClientRect();

    // Calculate relative position within the node
    // const relativeX = rect.left - contentRect.left + rect.width / 2;
    // const relativeY = rect.top - contentRect.top;

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
        'min-w-[320px] max-w-[480px] min-h-[120px]',
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

      {/* Node Header */}
      <div className={cn(
        'px-4 py-3 border-b border-gray-100 flex items-center gap-3',
        isUser ? 'bg-blue-50' : isAssistant ? 'bg-green-50' : 'bg-gray-50'
      )}>
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-blue-500 text-white' : isAssistant ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm text-gray-900">
            {isUser ? 'You' : 'Assistant'}
          </p>
          <p className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
        {message.metadata?.model && (
          <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
            {message.metadata.model}
          </span>
        )}
      </div>

      {/* Message Content */}
      <div className="p-4 relative">
        <div
          ref={contentRef}
          className="text-sm leading-relaxed text-gray-900 whitespace-pre-wrap break-words select-text"
          onMouseUp={handleTextSelection}
        >
          {message.content}
        </div>

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

        {/* General Branch Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: selected ? 1 : 0 }}
          className="absolute top-2 right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
          onClick={() => onBranch?.(id)}
          title="Create branch from this message"
        >
          <MoreHorizontal className="w-3 h-3 text-gray-600" />
        </motion.button>
      </div>

      {/* Node Status Indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
      )}
    </motion.div>
  );
};

MessageNode.displayName = 'MessageNode';