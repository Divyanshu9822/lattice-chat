import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
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
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Circle, GitBranch, Keyboard } from 'lucide-react';

import { MessageNode } from './MessageNode';
import { FloatingBranchInput } from './FloatingBranchInput';
import { useConversationStore } from '../../store';
import { useAIChat } from '../../hooks';
import type { TextSelection } from '../../types';
import { cn } from '../../utils';

import '@xyflow/react/dist/style.css';

const nodeTypes = {
  message: MessageNode,
};

interface ConversationCanvasProps {
  className?: string;
}

const ConversationCanvasInner: React.FC<ConversationCanvasProps> = ({ className }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [showBranchInput, setShowBranchInput] = useState(false);
  const [branchInputPosition, setBranchInputPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showMainInput, setShowMainInput] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const { 
    getActiveSession, 
    createSession,
    createContextualNode,
    getNode: getStoreNode,
    updateNode,
    streamingState,
  } = useConversationStore();

  const { streamMessage } = useAIChat();

  const { 
    fitView,
    getNode: getFlowNode,
  } = useReactFlow();

  // Sync store nodes with React Flow nodes
  useEffect(() => {
    const session = getActiveSession();
    if (!session) {
      createSession('New Conversation');
      return;
    }

    // Convert store nodes to React Flow nodes
    const flowNodes = session.canvas.nodes.map(storeNode => ({
      id: storeNode.id,
      type: 'message',
      position: storeNode.position,
      data: {
        node: storeNode,
        isStreaming: streamingState.nodeId === storeNode.id ? streamingState.isStreaming : false,
        streamingText: streamingState.nodeId === storeNode.id ? streamingState.currentText : undefined,
        onTextSelection: handleTextSelection,
        onBranch: handleBranchRequest,
      },
    }));

    // Convert store edges to React Flow edges
    const flowEdges = session.canvas.edges.map(storeEdge => ({
      id: storeEdge.id,
      source: storeEdge.source,
      target: storeEdge.target,
      type: storeEdge.type,
      animated: storeEdge.animated,
      style: storeEdge.style,
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [getActiveSession, streamingState, createSession]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setShowMainInput(true);
      }
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

  const handleTextSelection = useCallback((selection: TextSelection) => {
    setTextSelection(selection);
  }, []);

  const handleBranchRequest = useCallback((nodeId: string, selection?: TextSelection) => {
    const node = getFlowNode(nodeId);
    if (!node) return;

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
  }, [getFlowNode]);

  const handleMainInputSubmit = useCallback(async (message: string) => {
    // Create new contextual node (root node)
    const nodeId = createContextualNode(message, undefined, undefined, undefined, { x: 0, y: 0 });
    setShowMainInput(false);
    
    try {
      // Generate AI response
      const response = await streamMessage(message, nodeId);
      
      // Update the node with the AI response
      const storeNode = getStoreNode(nodeId);
      if (storeNode) {
        updateNode(nodeId, {
          currentExchange: {
            ...storeNode.currentExchange,
            aiResponse: response,
          },
        });
      }
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      // Update with error message
      const storeNode = getStoreNode(nodeId);
      if (storeNode) {
        updateNode(nodeId, {
          currentExchange: {
            ...storeNode.currentExchange,
            aiResponse: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please check your API configuration and try again.`,
          },
        });
      }
    }
  }, [createContextualNode, streamMessage, getStoreNode, updateNode]);

  const handleBranchSubmit = useCallback(async (message: string) => {
    if (!selectedNodeId || !branchInputPosition) return;

    const parentFlowNode = getFlowNode(selectedNodeId);
    if (!parentFlowNode) return;
    
    const newNodePosition = {
      x: parentFlowNode.position.x + (parentFlowNode.width || 400) + 100,
      y: parentFlowNode.position.y + 50,
    };
    
    // Create new contextual node as branch
    const nodeId = createContextualNode(
      message,
      selectedNodeId,
      textSelection?.selectedText,
      textSelection?.nodeId,
      newNodePosition
    );
    
    resetBranchInput();

    try {
      // Generate AI response
      const response = await streamMessage(message, nodeId);
      
      // Update the node with the AI response
      const storeNode = getStoreNode(nodeId);
      if (storeNode) {
        updateNode(nodeId, {
          currentExchange: {
            ...storeNode.currentExchange,
            aiResponse: response,
          },
        });
      }
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      // Update with error message
      const storeNode = getStoreNode(nodeId);
      if (storeNode) {
        updateNode(nodeId, {
          currentExchange: {
            ...storeNode.currentExchange,
            aiResponse: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please check your API configuration and try again.`,
          },
        });
      }
    }
  }, [selectedNodeId, branchInputPosition, textSelection, getFlowNode, createContextualNode, streamMessage, getStoreNode, updateNode]);

  const resetBranchInput = () => {
    setShowBranchInput(false);
    setBranchInputPosition(null);
    setSelectedNodeId(null);
    setTextSelection(null);
  };

  const handleBranchCancel = useCallback(() => {
    resetBranchInput();
  }, []);

  const handleMainInputCancel = useCallback(() => {
    setShowMainInput(false);
  }, []);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 500 });
  }, [fitView]);

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
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
        style={{ width: '100%', height: '100%' }}
      >
        <Background color="#94a3b8" gap={20} size={1} />
        
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
        
        {nodes.length > 0 && (
          <MiniMap 
            className="bg-white border border-gray-200 rounded-lg shadow-lg"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        )}
      </ReactFlow>

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

      <AnimatePresence>
        {showBranchInput && branchInputPosition && (
          <FloatingBranchInput
            position={branchInputPosition}
            onSubmit={handleBranchSubmit}
            onCancel={handleBranchCancel}
            selectedText={textSelection?.selectedText}
            quotedText={textSelection?.selectedText}
          />
        )}
      </AnimatePresence>

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

export const ConversationCanvas: React.FC<ConversationCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ConversationCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
