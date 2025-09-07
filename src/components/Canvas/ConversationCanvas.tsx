import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  ConnectionMode,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize, 
  GitBranch, 
  Keyboard, 
  ZoomIn, 
  ZoomOut, 
  Layers,
  Activity,
  Compass
} from 'lucide-react';

import { MessageNode } from './MessageNode';
import { FloatingBranchInput } from './FloatingBranchInput';
import { Button, Card, CardContent } from '../ui';
import { useConversationStore } from '../../store';
import { useAIChat } from '../../hooks';
import type { TextSelection } from '../../types';
import { cn } from '../../utils';
import { UI_CONFIG } from '../../config/app';

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
  const [zoomLevel, setZoomLevel] = useState(1);

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
    zoomIn,
    zoomOut,
    setCenter,
    getZoom,
  } = useReactFlow();

  // Track zoom level for UI updates
  useEffect(() => {
    const handleViewportChange = () => {
      setZoomLevel(getZoom());
    };

    const interval = setInterval(handleViewportChange, 100);
    return () => clearInterval(interval);
  }, [getZoom]);

  // Sync store nodes with React Flow nodes
  useEffect(() => {
    const session = getActiveSession();
    if (!session) {
      createSession('New Conversation');
      return;
    }

    // Convert store nodes to React Flow nodes with enhanced styling
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
      style: {
        opacity: streamingState.nodeId === storeNode.id && streamingState.isStreaming ? 0.95 : 1,
      },
    }));

    // Convert store edges to React Flow edges with professional styling
    const flowEdges = session.canvas.edges.map(storeEdge => ({
      id: storeEdge.id,
      source: storeEdge.source,
      target: storeEdge.target,
      type: 'smoothstep',
      animated: streamingState.isStreaming && (storeEdge.target === streamingState.nodeId || storeEdge.source === streamingState.nodeId),
      style: {
        stroke: '#3b82f6',
        strokeWidth: 3,
        strokeOpacity: 0.9,
        strokeDasharray: streamingState.isStreaming && (storeEdge.target === streamingState.nodeId || storeEdge.source === streamingState.nodeId) ? '8,4' : 'none',
      },
      pathOptions: {
        borderRadius: 20,
        offset: 10,
      },
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
      // Canvas navigation shortcuts
      if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault();
        handleFitView();
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
      x: parentFlowNode.position.x + (parentFlowNode.width || 400) + 120,
      y: parentFlowNode.position.y + Math.random() * 100 - 50, // Add slight randomness for visual appeal
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
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      style: {
        stroke: 'var(--primary-400)',
        strokeWidth: 2,
      },
    }, eds));
  }, [setEdges]);

  const handleFitView = useCallback(() => {
    fitView({ 
      padding: 0.15, 
      duration: 600,
      maxZoom: 1.2,
      minZoom: 0.3,
    });
  }, [fitView]);

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 300 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 300 });
  }, [zoomOut]);

  const handleCenterView = useCallback(() => {
    if (nodes.length > 0) {
      const centerNode = nodes[0];
      setCenter(centerNode.position.x + 200, centerNode.position.y, { duration: 400, zoom: 1 });
    }
  }, [nodes, setCenter]);

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
        className="bg-canvas-bg-light dark:bg-canvas-bg-dark transition-colors duration-250"
        style={{ width: '100%', height: '100%' }}
        defaultViewport={{ x: 0, y: 0, zoom: UI_CONFIG.canvas.defaultZoom }}
        minZoom={UI_CONFIG.canvas.minZoom}
        maxZoom={UI_CONFIG.canvas.maxZoom}
        snapToGrid={false}
        snapGrid={[20, 20]}
        deleteKeyCode={null} // Disable delete key
        multiSelectionKeyCode={null} // Disable multi-selection
      >
        {/* Professional Background */}
        <Background 
          variant={BackgroundVariant.Dots}
          gap={32}
          size={1.5}
          className="opacity-30 dark:opacity-20"
          color="var(--canvas-grid-light)"
        />

        {/* Statistics Panel */}
        {nodes.length > 0 && (
          <Panel position="top-left" className="z-40">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card variant="glass" padding="sm" className="backdrop-blur-xl">
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                        <Layers className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {nodes.length}
                        </div>
                        <div className="text-secondary-500 dark:text-secondary-400 -mt-0.5">
                          {nodes.length === 1 ? 'Node' : 'Nodes'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-px h-8 bg-secondary-200 dark:bg-secondary-700" />
                    
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 bg-gradient-to-br from-accent-emerald-500 to-accent-emerald-600 rounded-lg flex items-center justify-center">
                        <GitBranch className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {edges.length}
                        </div>
                        <div className="text-secondary-500 dark:text-secondary-400 -mt-0.5">
                          {edges.length === 1 ? 'Branch' : 'Branches'}
                        </div>
                      </div>
                    </div>

                    <div className="w-px h-8 bg-secondary-200 dark:bg-secondary-700" />
                    
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 bg-gradient-to-br from-accent-amber-500 to-accent-amber-600 rounded-lg flex items-center justify-center">
                        <Activity className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {Math.round(zoomLevel * 100)}%
                        </div>
                        <div className="text-secondary-500 dark:text-secondary-400 -mt-0.5">
                          Zoom
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Panel>
        )}
        
        {/* Professional Canvas Controls */}
        {nodes.length > 0 && (
          <Panel position="bottom-right" className="z-40">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col gap-2"
            >
              <Card variant="glass" padding="sm" className="backdrop-blur-xl">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    className="w-9 h-9 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" 
                    size="icon"
                    onClick={handleZoomOut}
                    className="w-9 h-9 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <div className="w-full h-px bg-secondary-200 dark:bg-secondary-700 my-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFitView}
                    className="w-9 h-9 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                    title="Fit view (⌘+0)"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCenterView}
                    className="w-9 h-9 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                    title="Center view"
                  >
                    <Compass className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </Panel>
        )}
        
        {/* Clean Mini Map - Bottom Left */}
        {nodes.length > UI_CONFIG.minimap.showThreshold && (
          <MiniMap 
            position="bottom-left"
            className="border border-blue-200 rounded-lg shadow-lg bg-slate-50"
            nodeColor={(node) => {
              const nodeData = node.data as { node?: { currentExchange?: { aiResponse?: string } }; isStreaming?: boolean };
              if (nodeData?.node?.currentExchange?.aiResponse) {
                return '#10b981'; // Green for completed conversations
              }
              if (nodeData?.isStreaming) {
                return '#f59e0b'; // Amber for streaming
              }
              return '#3b82f6'; // Blue for pending
            }}
            nodeStrokeColor="#ffffff"
            maskColor="rgba(59, 130, 246, 0.1)"
          />
        )}
      </ReactFlow>

      {/* Enhanced Empty State */}
      {nodes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="canvas-heading"
          aria-describedby="canvas-instructions"
        >
          <Card variant="elevated" className="max-w-lg pointer-events-auto text-center">
            <CardContent className="p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
                className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-2xl mx-auto mb-6"
              >
                <Keyboard className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </motion.div>
              
              <h3 
                id="canvas-heading"
                className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-3"
              >
                Welcome to Lattice
              </h3>
              
              <p id="canvas-instructions" className="text-secondary-600 dark:text-secondary-400 mb-6 leading-relaxed">
                Begin your AI conversation journey on an infinite canvas. Branch conversations, explore ideas, and visualize your thought process.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => setShowMainInput(true)}
                  className="w-full justify-center gap-2 h-12"
                  aria-label="Start conversation - Opens input to begin chatting"
                >
                  <Keyboard className="w-4 h-4" />
                  Start Conversation
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400">
                  <span>or press</span>
                  <kbd className="px-2 py-1 bg-secondary-100 dark:bg-secondary-800 rounded-md font-mono text-xs">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Branch Input */}
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

      {/* Main Input */}
      <AnimatePresence>
        {showMainInput && (
          <div className="absolute inset-0 flex items-end justify-center z-50 pointer-events-none pb-8 px-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-full max-w-2xl mx-auto"
            >
              <FloatingBranchInput
                position={{ x: 0, y: 0 }}
                onSubmit={handleMainInputSubmit}
                onCancel={handleMainInputCancel}
                placeholder="Start your conversation..."
                className="!relative !left-0 !top-0 !transform-none w-full mx-auto"
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
