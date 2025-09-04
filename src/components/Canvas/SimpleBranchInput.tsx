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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[300px]"
      style={{
        left: position.x - 150,
        top: position.y - 80,
      }}
    >
      {selectedText && (
        <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
          <span className="text-blue-600 font-medium">Branching from: </span>
          <span className="text-blue-800">"{selectedText}"</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Continue the conversation..."
          className="flex-1 p-2 border border-gray-300 rounded resize-none min-h-[60px] text-sm"
          rows={2}
        />
        <div className="flex flex-col gap-1">
          <button
            type="submit"
            disabled={!message.trim()}
            className={cn(
              'p-2 rounded transition-colors',
              message.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};