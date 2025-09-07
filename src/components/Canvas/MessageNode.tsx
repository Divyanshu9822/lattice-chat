import React, { useState, useRef, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { User, Bot, GitBranch } from 'lucide-react';
import type { ConversationMessage, TextSelection } from '../../types';
import { cn, formatTimestamp } from '../../utils';

export interface MessageNodeData {
  exchange: {
    userMessage: ConversationMessage;
    aiResponse?: ConversationMessage;
    isGenerating?: boolean;
  };
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

  const { exchange, onTextSelection, onBranch } = data;
  const { userMessage, aiResponse, isGenerating } = exchange;

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
      // Create a range from the start of aiContent to the selection start
      const prefixRange = document.createRange();
      prefixRange.setStart(aiContentElement, 0);
      prefixRange.setEnd(range.startContainer, range.startOffset);
      
      // Compute startIndex as the length of the prefix text
      const startIndex = prefixRange.toString().length;
      
      // Compute endIndex based on startIndex + selectedText length
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative bg-white rounded-lg shadow-lg border-2 transition-all duration-200',
          'min-w-[380px] max-w-[520px]',
          selected ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-gray-300',
          'cursor-default'
        )}
        style={{ pointerEvents: 'auto' }}
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

        {/* User Message Section */}
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
          <div className="nodrag p-4" style={{ userSelect: 'text' }}>
            <div className="nodrag text-sm leading-relaxed text-gray-900 whitespace-pre-wrap break-words select-text cursor-text">
              {userMessage.content}
            </div>
          </div>
        </div>

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
          <div className="nodrag p-4 relative" style={{ userSelect: 'text' }}>
            {isGenerating ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            ) : aiResponse ? (
              <div
                ref={aiContentRef}
                className="nodrag text-sm leading-relaxed text-gray-900 whitespace-pre-wrap break-words select-text cursor-text"
                onMouseUp={handleTextSelection}
                style={{ userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text' }}
              >
                {aiResponse.content}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">
                Response pending...
              </div>
            )}
          </div>
        </div>

        {/* Branch Button - Only shows when text is selected from AI response */}
        {textSelection && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-2 right-2 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
            onClick={() => {
              onBranch?.(id, textSelection);
              setTextSelection(null);
              window.getSelection()?.removeAllRanges();
            }}
            title={`Create branch from: "${textSelection.selectedText.slice(0, 30)}..."`}
          >
            <GitBranch className="w-4 h-4 text-white" />
          </motion.button>
        )}

        {/* Node Status Indicator */}
        {selected && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
        )}
      </motion.div>
    </>
  );
};

MessageNode.displayName = 'MessageNode';
