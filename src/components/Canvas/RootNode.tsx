import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { cn } from '../../utils';

export interface RootNodeData {
  label: string;
  sessionTitle?: string;
  onBranch?: (nodeId: string) => void;
}

export const RootNode: React.FC<NodeProps & { data: RootNodeData }> = ({
  id,
  data,
  selected,
}) => {
  const { label, sessionTitle, onBranch } = data;

  const handleClick = () => {
    onBranch?.(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className={cn(
        'relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg',
        'min-w-[280px] min-h-[100px] text-white',
        selected ? 'ring-4 ring-blue-300' : '',
        'cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105'
      )}
    >
      {/* Connection Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-white border-2 border-blue-500"
        style={{ bottom: -8 }}
      />

      {/* Root Node Content */}
      <div className="p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"
        >
          <MessageSquare className="w-6 h-6" />
        </motion.div>
        
        <h3 className="font-semibold text-lg mb-1">
          {sessionTitle || 'Conversation Start'}
        </h3>
        
        <p className="text-sm text-white/80">
          {label}
        </p>
        
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="mt-3 text-xs text-white/60 font-medium"
        >
          Click to start conversation
        </motion.div>
      </div>

      {/* Glow Effect */}
      <div className={cn(
        'absolute inset-0 rounded-xl opacity-50 blur-xl transition-opacity duration-300',
        'bg-gradient-to-br from-blue-400 to-purple-500 -z-10',
        selected ? 'opacity-70' : 'opacity-30'
      )} />
    </motion.div>
  );
};

RootNode.displayName = 'RootNode';
