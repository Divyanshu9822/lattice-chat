import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  ConnectionMode,
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Download } from 'lucide-react';

import { MessageNode } from './MessageNode';
import { RootNode } from './RootNode';
import { FloatingBranchInput } from './FloatingBranchInput';
import { useConversationStore } from '../../store';
import { useAIChat } from '../../hooks/useAIChat';
import type { TextSelection, ConversationNode } from '../../types';
import { cn } from '../../utils';

import 'reactflow/dist/style.css';

// Define node types outside component to prevent recreation warnings
const nodeTypes = {
  message: MessageNode,
  root: RootNode,
};

const edgeTypes = {};

interface ConversationCanvasProps {
  className?: string;
}

const ConversationCanvasInner: React.FC<ConversationCanvasProps> = ({ className }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [showBranchInput, setShowBranchInput] = useState(false);
  const [branchInputPosition, setBranchInputPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    getActiveSession, 
    createSession,
  } = useConversationStore();
  
  const { streamMessage, isLoading } = useAIChat();

  const { 
    setViewport, 
    getViewport, 
    fitView,
    project,
    getNodes,
    getNode,
  } = useReactFlow();

  // Initialize canvas with session data
  useEffect(() => {
    console.log('ConversationCanvas: Initializing canvas...');
    const session = getActiveSession();
    console.log('ConversationCanvas: Active session:', session);
    
    if (!session) {
      // Create initial session if none exists
      console.log('ConversationCanvas: Creating new session...');
      createSession('New Conversation');
      return;
    }

    // For now, always create a fresh canvas to ensure we have a root node
    console.log('ConversationCanvas: Initializing fresh canvas for session:', session.title);
    initializeCanvas(session.title);
    
    // TODO: Uncomment this when canvas data structure is working properly
    // // Convert session data to nodes and edges
    // if (session.canvas && session.canvas.nodes && session.canvas.nodes.length > 0) {
    //   console.log('ConversationCanvas: Loading existing canvas data...', session.canvas);
    //   console.log('ConversationCanvas: Canvas nodes:', session.canvas.nodes);
    //   console.log('ConversationCanvas: Canvas edges:', session.canvas.edges);
    //   setNodes(session.canvas.nodes.map(convertToReactFlowNode));
    //   setEdges(session.canvas.edges);
    //   setViewport(session.canvas.viewport);
    // } else {
    //   // Create initial root node for new sessions
    //   console.log('ConversationCanvas: Initializing new canvas for session:', session.title);
    //   initializeCanvas(session.title);
    // }
  }, [getActiveSession, createSession, setNodes, setEdges, setViewport]);

  const convertToReactFlowNode = (node: ConversationNode): Node => ({
    id: node.id,
    type: node.type === 'root' ? 'root' : 'message',
    position: node.position,
    data: {
      ...node.data,
      onTextSelection: handleTextSelection,
      onBranch: handleBranchRequest,
    },
    selected: node.id === selectedNodeId,
  });

  const initializeCanvas = (sessionTitle: string) => {
    console.log('initializeCanvas: Creating root node for:', sessionTitle);
    const rootNode: Node = {
      id: 'root',
      type: 'root',
      position: { x: 0, y: 0 },
      data: {
        label: 'Start your conversation',
        sessionTitle,
        onBranch: handleBranchRequest,
      },
    };

    console.log('initializeCanvas: Setting nodes:', [rootNode]);
    setNodes([rootNode]);
    setEdges([]);
    
    // Center the view on the root node
    setTimeout(() => {
      console.log('initializeCanvas: Fitting view...');
      fitView({ padding: 0.2 });
    }, 100);
  };

  const handleTextSelection = useCallback((selection: TextSelection) => {
    setTextSelection(selection);
  }, []);

  const handleBranchRequest = useCallback((nodeId: string, selection?: TextSelection) => {
    const node = getNode(nodeId);
    if (!node) return;

    // Convert screen coordinates to canvas coordinates
    // const viewport = getViewport();
    const canvasPosition = {
      x: selection ? node.position.x + 200 : node.position.x + 200,
      y: selection ? node.position.y + 100 : node.position.y + 100,
    };

    setBranchInputPosition(canvasPosition);
    setSelectedNodeId(nodeId);
    setShowBranchInput(true);
  }, [getNode, getViewport, project]);

  const handleBranchSubmit = useCallback(async (message: string) => {
    if (!selectedNodeId || !branchInputPosition) return;

    // Create new user message node
    const newNodeId = `node-${Date.now()}`;
    const userNode: Node = {
      id: newNodeId,
      type: 'message',
      position: branchInputPosition,
      data: {
        message: {
          id: `msg-${Date.now()}`,
          content: message,
          role: 'user' as const,
          timestamp: new Date(),
        },
        onTextSelection: handleTextSelection,
        onBranch: handleBranchRequest,
      },
    };

    // Create edge connecting to parent
    const newEdge: Edge = {
      id: `edge-${selectedNodeId}-${newNodeId}`,
      source: selectedNodeId,
      target: newNodeId,
      type: textSelection ? 'branch' : 'default',
      animated: true,
      style: { stroke: textSelection ? '#3b82f6' : '#6b7280' },
    };

    setNodes((nds) => [...nds, userNode]);
    setEdges((eds) => [...eds, newEdge]);
    
    // Reset branch input state
    setShowBranchInput(false);
    setBranchInputPosition(null);
    setSelectedNodeId(null);
    setTextSelection(null);

    // Generate AI response
    try {
      console.log('Generating AI response for message:', message);
      
      // Create AI response node position
      const aiNodeId = `ai-node-${Date.now()}`;
      const aiPosition = {
        x: branchInputPosition.x,
        y: branchInputPosition.y + 150,
      };
      
      // Create placeholder AI node
      const aiNode: Node = {
        id: aiNodeId,
        type: 'message',
        position: aiPosition,
        data: {
          message: {
            id: `ai-msg-${Date.now()}`,
            content: 'Thinking...',
            role: 'assistant' as const,
            timestamp: new Date(),
            metadata: {
              model: 'gemini-2.0-flash-exp',
              isStreaming: true,
            },
          },
          onTextSelection: handleTextSelection,
          onBranch: handleBranchRequest,
        },
      };
      
      // Create edge from user to AI
      const aiEdge: Edge = {
        id: `edge-${newNodeId}-${aiNodeId}`,
        source: newNodeId,
        target: aiNodeId,
        animated: true,
        style: { stroke: '#10b981' },
      };
      
      setNodes((nds) => [...nds, aiNode]);
      setEdges((eds) => [...eds, aiEdge]);
      
      // For now, simulate AI response since we need to integrate properly with canvas
      setTimeout(async () => {
        try {
          // Get conversation history for AI context
          const conversationHistory = [];
          
          // Simple approach: just send the current message
          // In a full implementation, you'd traverse the node tree to build context
          conversationHistory.push({
            id: `msg-${Date.now()}`,
            content: message,
            role: 'user' as const,
            timestamp: new Date(),
          });
          
          // Try to use real AI service, fallback to mock
          let response = "I'm a simulated response. Please set up your Gemini API key to enable real AI responses.";
          
          try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (apiKey && apiKey !== 'your_gemini_api_key_here') {
              console.log('Using real Gemini API with key:', apiKey.substring(0, 8) + '...');
              const { getGeminiService } = await import('../../services/geminiService');
              const aiService = getGeminiService(apiKey);
              response = await aiService.generateResponse(conversationHistory);
              console.log('AI Response generated:', response.substring(0, 50) + '...');
            } else {
              console.log('No API key configured, using mock response');
              const responses = [
                `That's an interesting question about "${message}". Let me think about this carefully and provide you with a thoughtful response.`,
                `I understand you're asking about "${message}". Here's my perspective on that topic, though I should mention that I'm running in demo mode without a real API connection.`,
                `Great question regarding "${message}"! There are several ways to approach this. To enable full AI responses, please set up your Gemini API key.`,
                `Thank you for asking about "${message}". This is a fascinating area to explore. Note: I'm currently in demo mode - configure your API key for real AI responses.`,
              ];
              response = responses[Math.floor(Math.random() * responses.length)];
            }
          } catch (aiError) {
            console.error('AI service error:', aiError);
            response = `I encountered an error while generating a response: ${aiError instanceof Error ? aiError.message : 'Unknown error'}. Using mock response instead.`;
          }
        
          // Update the AI node with the actual response
          setNodes((nds) => 
            nds.map((node) => 
              node.id === aiNodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      message: {
                        ...node.data.message,
                        content: response,
                        metadata: {
                          model: 'gemini-2.0-flash-exp',
                          isStreaming: false,
                        },
                      },
                    },
                  }
                : node
            )
          );
        } catch (error) {
          console.error('Error in AI response generation:', error);
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
  }, [selectedNodeId, branchInputPosition, textSelection, handleTextSelection, handleBranchRequest]);

  const handleBranchCancel = useCallback(() => {
    setShowBranchInput(false);
    setBranchInputPosition(null);
    setSelectedNodeId(null);
    setTextSelection(null);
  }, []);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 500 });
  }, [fitView]);

  const handleExport = useCallback(() => {
    const data = {
      nodes: getNodes(),
      edges,
      viewport: getViewport(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversation-canvas.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [getNodes, edges, getViewport]);

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
        
        {/* Canvas Controls */}
        <Controls className="bg-white border border-gray-200 rounded-lg shadow-lg" />
        
        {/* Mini Map */}
        <MiniMap 
          className="bg-white border border-gray-200 rounded-lg shadow-lg"
          nodeColor={(node) => {
            switch (node.type) {
              case 'root': return '#3b82f6';
              case 'message': 
                return node.data?.message?.role === 'user' ? '#10b981' : '#f59e0b';
              default: return '#6b7280';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />

        {/* Canvas Control Panel */}
        <Panel position="bottom-right" className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 m-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Canvas Controls</h3>
            
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFitView}
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Fit to screen"
              >
                <Maximize className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                title="Export canvas"
              >
                <Download className="w-4 h-4" />
              </motion.button>
            </div>
            
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              <p>{nodes.length} nodes</p>
              <p>{edges.length} connections</p>
            </div>
          </div>
        </Panel>
      </ReactFlow>

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