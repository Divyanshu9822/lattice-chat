import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ConversationCard } from './ConversationCard';
import { useConversationStore } from '../../store';
import { useCardLayout, useConversationBranching } from '../../hooks';
import { cn } from '../../utils';

interface CardContainerProps {
  className?: string;
}

export const CardContainer: React.FC<CardContainerProps> = ({ className }) => {
  const {
    getActiveSession,
    activeBranchId,
    setActiveBranch,
  } = useConversationStore();

  const { createBranchFromMessage } = useConversationBranching();
  const { containerRef, getTotalWidth } = useCardLayout();

  const activeSession = getActiveSession();
  const branches = activeSession?.branches || [];

  // Sort branches by order for consistent display
  const sortedBranches = useMemo(() => {
    return [...branches].sort((a, b) => a.position.order - b.position.order);
  }, [branches]);

  const totalWidth = getTotalWidth(branches.length);

  const handleBranchFromMessage = (branchId: string, messageIndex: number) => {
    createBranchFromMessage(branchId, messageIndex);
  };

  const handleFocusBranch = (branchId: string) => {
    setActiveBranch(branchId);
  };

  if (!activeSession) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-10 h-10 text-gray-400" 
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to Canvas Chat
          </h3>
          <p className="text-gray-500 max-w-md">
            Start a new conversation to explore branching dialogue paths. 
            Create different conversation branches by clicking on any message.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-hidden relative', className)}>
      {/* Horizontal Scrolling Container */}
      <div
        ref={containerRef}
        className={cn(
          'h-full overflow-x-auto overflow-y-hidden',
          'scrollbar-none',
          'px-8 py-8'
        )}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Cards Wrapper */}
        <motion.div
          className="flex gap-6 h-full items-start"
          style={{ minWidth: totalWidth + 64 }} // Add padding
          layout
        >
          <AnimatePresence mode="popLayout">
            {sortedBranches.map((branch) => (
              <ConversationCard
                key={branch.id}
                branch={branch}
                isActive={branch.id === activeBranchId}
                onBranch={(messageIndex) => handleBranchFromMessage(branch.id, messageIndex)}
                onFocus={() => handleFocusBranch(branch.id)}
              />
            ))}
          </AnimatePresence>
          
          {/* Add New Branch Placeholder (Optional) */}
          {branches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'w-96 h-[600px] border-2 border-dashed border-gray-200',
                'rounded-lg flex items-center justify-center',
                'hover:border-gray-300 hover:bg-gray-50/50',
                'transition-all duration-200 cursor-pointer',
                'flex-shrink-0'
              )}
              onClick={() => {
                // Could trigger creation of a new branch
                console.log('Create new branch');
              }}
            >
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
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
                      d="M12 4v16m8-8H4" 
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">New Branch</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Scroll Indicators */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: branches.length > 1 ? 1 : 0 }}
          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center"
        >
          <svg 
            className="w-4 h-4 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
        </motion.div>
      </div>

      <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: branches.length > 1 ? 1 : 0 }}
          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center"
        >
          <svg 
            className="w-4 h-4 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </motion.div>
      </div>

      {/* Branch Count Indicator */}
      {branches.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              {branches.length} branch{branches.length !== 1 ? 'es' : ''}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};