import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  MiniMap,
  Background,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  ConnectionMode,
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Circle, GitBranch, Keyboard } from 'lucide-react';

import { MessageNode } from './MessageNode';
import { FloatingBranchInput } from './FloatingBranchInput';
import { useConversationStore } from '../../store';
import { useAIChat } from '../../hooks';
import type { TextSelection, ConversationMessage } from '../../types';
import { cn, generateId } from '../../utils';

import 'reactflow/dist/style.css';

/**
 * Node types configuration for ReactFlow
 */
const nodeTypes = {
  message: MessageNode,
};

const edgeTypes = {};

interface ConversationCanvasProps {
  className?: string;
}

/**
 * Inner canvas component that handles the conversation flow
 */
const ConversationCanvasInner: React.FC<ConversationCanvasProps> = ({ className }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [showBranchInput, setShowBranchInput] = useState(false);
  const [branchInputPosition, setBranchInputPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showMainInput, setShowMainInput] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const { 
    getActiveSession, 
    createSession,
  } = useConversationStore();

  const { streamMessage } = useAIChat();

  const { 
    fitView,
    getNode,
  } = useReactFlow();

  /**
   * Initialize canvas with session data
   */
  useEffect(() => {
    const session = getActiveSession();
    
    if (!session) {
      createSession('New Conversation');
      return;
    }

    initializeEmptyCanvas();
  }, [getActiveSession, createSession]);

  /**
   * Set up keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K on Mac or Ctrl+K on Windows/Linux to open main input
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setShowMainInput(true);
      }
      // Escape to close inputs
      if (event.key === 'Escape') {
        setShowMainInput(false);
        setShowBranchInput(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  /**
   * Initialize an empty canvas
   */
  const initializeEmptyCanvas = () => {
    setNodes([]);
    setEdges([]);
    
    // Center the view after a brief delay
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  };

  /**
   * Handle text selection in messages
   */
  const handleTextSelection = useCallback((selection: TextSelection) => {
    setTextSelection(selection);
  }, []);

  /**
   * Handle branch request from a message node
   */
  const handleBranchRequest = useCallback((nodeId: string, selection?: TextSelection) => {
    const node = getNode(nodeId);
    if (!node) return;

    // Position the branch input at the center of the screen for visibility
    const screenPosition = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    setBranchInputPosition(screenPosition);
    setSelectedNodeId(nodeId);
    setShowBranchInput(true);
    
    if (selection) {
      setTextSelection(selection);
    }
  }, [getNode]);

  /**
   * Handle main conversation input (from empty canvas)
   */
  const handleMainInputSubmit = useCallback(async (message: string) => {
    const exchangeNodeId = generateId();
    
    // Create user message
    const userMessage: ConversationMessage = {
      id: generateId(),
      content: message.trim(),
      role: 'user',
      timestamp: new Date(),
    };
    
    // Create exchange node as the root of the conversation
    const exchangeNode: Node = {
      id: exchangeNodeId,
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        exchange: {
          userMessage,
          isGenerating: true,
        },
        onTextSelection: handleTextSelection,
        onBranch: handleBranchRequest,
      },
    };

    setNodes([exchangeNode]);
    setEdges([]);
    setShowMainInput(false);
    
    // Generate AI response
    try {
      await generateAIResponse(exchangeNodeId, userMessage);
    } catch (error) {
      handleAIError(exchangeNodeId, userMessage, error);
    }
  }, [handleBranchRequest, handleTextSelection]);

  /**
   * Handle branch submission
   */
  const handleBranchSubmit = useCallback(async (message: string) => {
    if (!selectedNodeId || !branchInputPosition) return;

    const exchangeNodeId = generateId();
    
    // Get parent node to calculate position
    const parentNode = getNode(selectedNodeId);
    if (!parentNode) return;
    
    // Calculate position for the new node
    const newNodePosition = {
      x: parentNode.position.x + (parentNode.width || 400) + 100,
      y: parentNode.position.y + 50,
    };
    
    // Create user message
    const userMessage: ConversationMessage = {
      id: generateId(),
      content: message.trim(),
      role: 'user',
      timestamp: new Date(),
    };
    
    // Create exchange node
    const exchangeNode: Node = {
      id: exchangeNodeId,
      type: 'message',
      position: newNodePosition,
      data: {
        exchange: {
          userMessage,
          isGenerating: true,
        },
        onTextSelection: handleTextSelection,
        onBranch: handleBranchRequest,
      },
    };

    // Create edge connecting to parent
    const newEdge: Edge = {
      id: generateId(),
      source: selectedNodeId,
      target: exchangeNodeId,
      type: textSelection ? 'branch' : 'default',
      animated: true,
      style: { stroke: textSelection ? '#3b82f6' : '#6b7280' },
    };

    setNodes((nds) => [...nds, exchangeNode]);
    setEdges((eds) => [...eds, newEdge]);
    
    // Reset branch input state
    resetBranchInput();

    // Generate AI response
    try {
      // For simplicity, just send the current message as context
      // In a full implementation, you'd traverse the node tree to build full context
      await generateAIResponse(exchangeNodeId, userMessage);
    } catch (error) {
      handleAIError(exchangeNodeId, userMessage, error);
    }
  }, [selectedNodeId, branchInputPosition, textSelection, handleTextSelection, handleBranchRequest, getNode]);

  /**
   * Generate AI response for a conversation exchange
   */
  const generateAIResponse = async (
    exchangeNodeId: string, 
    userMessage: ConversationMessage
  ) => {
    const response = await streamMessage(userMessage.content, exchangeNodeId);
    
    // Create AI response message
    const aiMessage: ConversationMessage = {
      id: generateId(),
      content: response,
      role: 'assistant',
      timestamp: new Date(),
      metadata: {
        model: 'gemini-2.5-flash',
      },
    };
    
    // Update the exchange node with the AI response
    setNodes((nds) => 
      nds.map((node) => 
        node.id === exchangeNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                exchange: {
                  userMessage,
                  aiResponse: aiMessage,
                  isGenerating: false,
                },
              },
            }
          : node
      )
    );
  };

  /**
   * Handle AI generation errors
   */
  const handleAIError = (
    exchangeNodeId: string, 
    userMessage: ConversationMessage,
    error: unknown
  ) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    const aiMessage: ConversationMessage = {
      id: generateId(),
      content: `Error: ${errorMessage}. Please check your API configuration and try again.`,
      role: 'assistant',
      timestamp: new Date(),
      metadata: {
        model: 'gemini-2.5-flash',
        error: true,
      },
    };
    
    setNodes((nds) => 
      nds.map((node) => 
        node.id === exchangeNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                exchange: {
                  userMessage,
                  aiResponse: aiMessage,
                  isGenerating: false,
                },
              },
            }
          : node
      )
    );
  };

  /**
   * Reset branch input state
   */
  const resetBranchInput = () => {
    setShowBranchInput(false);
    setBranchInputPosition(null);
    setSelectedNodeId(null);
    setTextSelection(null);
  };

  /**
   * Handle branch input cancellation
   */
  const handleBranchCancel = useCallback(() => {
    resetBranchInput();
  }, []);

  /**
   * Handle main input cancellation
   */
  const handleMainInputCancel = useCallback(() => {
    setShowMainInput(false);
  }, []);

  /**
   * Handle ReactFlow connections
   */
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  /**
   * Handle fit view action
   */
  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 500 });
  }, [fitView]);

  /**
   * Memoized node color function for MiniMap
   */
  const getNodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'message': 
        return node.data?.exchange?.userMessage ? '#10b981' : '#f59e0b';
      default: return '#6b7280';
    }
  }, []);

  return (
    <div 
      ref={reactFlowWrapper} 
      className={cn('w-full h-full relative', className)} 
      style={{ width: '100%', height: '100%', minHeight: '600px' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Canvas Background */}
        <Background color="#94a3b8" gap={20} size={1} />
        
        {/* Canvas Statistics Panel */}
        {nodes.length > 0 && (
          <Panel position="top-left" className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 m-4 z-40">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-600" title="Total conversation nodes">
                <Circle className="w-3 h-3" />
                <span className="font-medium">{nodes.length}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600" title="Total connections between nodes">
                <GitBranch className="w-3 h-3" />
                <span className="font-medium">{edges.length}</span>
              </div>
            </div>
          </Panel>
        )}
        
        {/* Recenter Button - Only show when there are nodes */}
        {nodes.length > 0 && (
          <div className="absolute bottom-48 right-4 z-50">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFitView}
              className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg border border-gray-200"
              title="Recenter view"
              aria-label="Recenter view"
            >
              <Maximize className="w-5 h-5" aria-hidden="true" />
            </motion.button>
          </div>
        )}
        
        {/* MiniMap - Only show when there are nodes */}
        {nodes.length > 0 && (
          <MiniMap 
            className="bg-white border border-gray-200 rounded-lg shadow-lg"
            nodeColor={getNodeColor}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        )}
      </ReactFlow>

      {/* Empty Canvas Instructions - Outside ReactFlow to avoid pointer event conflicts */}
      {nodes.length === 0 && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="canvas-heading"
          aria-describedby="canvas-instructions"
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 max-w-md pointer-events-auto">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <Keyboard className="w-8 h-8 text-blue-600" />
              </div>
              <h3 
                id="canvas-heading"
                className="font-semibold text-lg text-gray-900 mb-2"
                aria-describedby="canvas-instructions"
              >
                Start Your Conversation
              </h3>
              <p id="canvas-instructions" className="text-sm text-gray-600 mb-4">
                Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">⌘K</kbd> on Mac or <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+K</kbd> on Windows/Linux to open the input box and begin your conversation.
              </p>
              <button
                type="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMainInput(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMainInput(true);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                aria-label="Start conversation - Opens input box to begin chatting"
              >
                Start conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Branch Input */}
      <AnimatePresence>
        {showBranchInput && branchInputPosition && (
          <FloatingBranchInput
            position={branchInputPosition}
            onSubmit={handleBranchSubmit}
            onCancel={handleBranchCancel}
            selectedText={textSelection?.selectedText}
          />
        )}
      </AnimatePresence>

      {/* Main Input - Positioned Higher and Wider */}
      <AnimatePresence>
        {showMainInput && (
          <div className="absolute inset-x-0 bottom-20 flex justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="pointer-events-auto"
            >
              <FloatingBranchInput
                position={{ x: 0, y: 0 }}
                onSubmit={handleMainInputSubmit}
                onCancel={handleMainInputCancel}
                placeholder="Start your conversation..."
                className="!relative !left-0 !top-0 !transform-none !min-w-[400px] !max-w-[600px]"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Main ConversationCanvas component with ReactFlow provider
 */
export const ConversationCanvas: React.FC<ConversationCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ConversationCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
