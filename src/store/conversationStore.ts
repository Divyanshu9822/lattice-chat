import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  ConversationSession, 
  ConversationCanvas,
  ConversationNode,
  ConversationEdge,
  StreamingState,
  TextSelection,
  ChatMessage
} from '../types';
import { generateId } from '../utils';

interface ConversationStore {
  // State
  sessions: ConversationSession[];
  activeSessionId: string | null;
  activeNodeId: string | null;
  streamingState: StreamingState;
  textSelection: TextSelection | null;

  // Getters
  getActiveSession: () => ConversationSession | null;
  getActiveCanvas: () => ConversationCanvas | null;
  getNode: (nodeId: string) => ConversationNode | null;
  getNodeHistory: (nodeId: string) => ChatMessage[];
  getNodeConversation: (nodeId: string) => ChatMessage[];

  // Session Actions
  createSession: (title?: string) => string;
  setActiveSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;

  // Canvas Actions
  updateCanvasViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  addNode: (node: ConversationNode) => void;
  updateNode: (nodeId: string, updates: Partial<ConversationNode>) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: ConversationEdge) => void;
  removeEdge: (edgeId: string) => void;

  // Node Actions
  createContextualNode: (userMessage: string, parentNodeId?: string, quotedText?: string, sourceNodeId?: string, position?: { x: number; y: number }) => string;
  setActiveNode: (nodeId: string | null) => void;

  // Text Selection Actions
  setTextSelection: (selection: TextSelection | null) => void;

  // Streaming Actions
  startStreaming: (nodeId: string) => void;
  updateStreamingText: (text: string) => void;
  finishStreaming: () => void;

  // Utility Actions
  clearAll: () => void;
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      // Initial State
      sessions: [],
      activeSessionId: null,
      activeNodeId: null,
      streamingState: {
        isStreaming: false,
        currentText: '',
        nodeId: null,
      },
      textSelection: null,

      // Getters
      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find(session => session.id === activeSessionId) || null;
      },

      getActiveCanvas: () => {
        const session = get().getActiveSession();
        return session?.canvas || null;
      },

      getNode: (nodeId: string) => {
        const canvas = get().getActiveCanvas();
        if (!canvas) return null;
        return canvas.nodes.find(node => node.id === nodeId) || null;
      },

      getNodeHistory: (nodeId: string) => {
        const node = get().getNode(nodeId);
        if (!node) return [];

        // Return a shallow copy to prevent external mutation
        return node.messages ? [...node.messages] : [];
      },
      getNodeConversation: (nodeId: string) => {
        const node = get().getNode(nodeId);
        if (!node) return [];
        
        // Return full conversation history including current exchange
        const messages = [...(node.messages || [])];
        
        // Add current exchange if it exists
        if (node.currentExchange?.userMessage) {
          messages.push({
            role: 'user' as const,
            content: node.currentExchange.userMessage,
            timestamp: node.createdAt,
            quotedText: node.currentExchange.quotedText,
          });
        }
        
        if (node.currentExchange?.aiResponse) {
          messages.push({
            role: 'assistant' as const,
            content: node.currentExchange.aiResponse,
            timestamp: node.createdAt,
          });
        }
        
        return messages;
      },

      // Session Actions
      createSession: (title = 'New Conversation') => {
        const sessionId = generateId();
        
        // Create initial empty canvas
        const canvas: ConversationCanvas = {
          id: generateId(),
          title,
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          metadata: {
            nodeCount: 0,
            branchCount: 0,
            lastActivity: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const newSession: ConversationSession = {
          id: sessionId,
          title,
          canvas,
          metadata: {
            totalMessages: 0,
            branchCount: 0,
            lastActivity: new Date(),
          },
        };

        set(state => ({
          sessions: [...state.sessions, newSession],
          activeSessionId: sessionId,
        }));

        return sessionId;
      },

      setActiveSession: (sessionId: string) => {
        set({ activeSessionId: sessionId });
      },

      deleteSession: (sessionId: string) => {
        set(state => ({
          sessions: state.sessions.filter(s => s.id !== sessionId),
          activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
        }));
      },

      // Canvas Actions
      updateCanvasViewport: (viewport: { x: number; y: number; zoom: number }) => {
        const { sessions, activeSessionId } = get();
        if (!activeSessionId) return;

        const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
        if (sessionIndex === -1) return;

        set(state => {
          const updatedSessions = [...state.sessions];
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            canvas: {
              ...updatedSessions[sessionIndex].canvas,
              viewport,
              updatedAt: new Date(),
            },
          };
          return { sessions: updatedSessions };
        });
      },

      addNode: (node: ConversationNode) => {
        const { sessions, activeSessionId } = get();
        if (!activeSessionId) return;

        const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
        if (sessionIndex === -1) return;

        set(state => {
          const updatedSessions = [...state.sessions];
          const canvas = updatedSessions[sessionIndex].canvas;
          
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            canvas: {
              ...canvas,
              nodes: [...canvas.nodes, node],
              metadata: {
                ...canvas.metadata,
                nodeCount: canvas.nodes.length + 1,
                lastActivity: new Date(),
              },
              updatedAt: new Date(),
            },
            metadata: {
              ...updatedSessions[sessionIndex].metadata,
              totalMessages: updatedSessions[sessionIndex].metadata.totalMessages + 1,
              lastActivity: new Date(),
            },
          };
          return { sessions: updatedSessions };
        });
      },

      updateNode: (nodeId: string, updates: Partial<ConversationNode>) => {
        const { sessions, activeSessionId } = get();
        if (!activeSessionId) return;

        const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
        if (sessionIndex === -1) return;

        set(state => {
          const updatedSessions = [...state.sessions];
          const canvas = updatedSessions[sessionIndex].canvas;
          const nodeIndex = canvas.nodes.findIndex(n => n.id === nodeId);
          
          if (nodeIndex !== -1) {
            const updatedNodes = [...canvas.nodes];
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              ...updates,
            };
            
            updatedSessions[sessionIndex] = {
              ...updatedSessions[sessionIndex],
              canvas: {
                ...canvas,
                nodes: updatedNodes,
                updatedAt: new Date(),
              },
              metadata: {
                ...updatedSessions[sessionIndex].metadata,
                lastActivity: new Date(),
              },
            };
          }
          
          return { sessions: updatedSessions };
        });
      },

      removeNode: (nodeId: string) => {
        const { sessions, activeSessionId } = get();
        if (!activeSessionId) return;

        const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
        if (sessionIndex === -1) return;

        set(state => {
          const updatedSessions = [...state.sessions];
          const canvas = updatedSessions[sessionIndex].canvas;
          
          // Count removed messages for metadata update
          const messageRemoved = 1; // Each node represents one conversation exchange
          
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            canvas: {
              ...canvas,
              nodes: canvas.nodes.filter(n => n.id !== nodeId),
              edges: canvas.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
              metadata: {
                ...canvas.metadata,
                nodeCount: canvas.nodes.length - 1,
                lastActivity: new Date(),
              },
              updatedAt: new Date(),
            },
            metadata: {
              ...updatedSessions[sessionIndex].metadata,
              totalMessages: Math.max(0, updatedSessions[sessionIndex].metadata.totalMessages - messageRemoved),
              lastActivity: new Date(),
            },
          };
          return { sessions: updatedSessions };
        });
      },

      addEdge: (edge: ConversationEdge) => {
        const { sessions, activeSessionId } = get();
        if (!activeSessionId) return;

        const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
        if (sessionIndex === -1) return;

        set(state => {
          const updatedSessions = [...state.sessions];
          const canvas = updatedSessions[sessionIndex].canvas;
          
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            canvas: {
              ...canvas,
              edges: [...canvas.edges, edge],
              metadata: {
                ...canvas.metadata,
                branchCount: edge.type === 'branch' ? canvas.metadata.branchCount + 1 : canvas.metadata.branchCount,
                lastActivity: new Date(),
              },
              updatedAt: new Date(),
            },
            metadata: {
              ...updatedSessions[sessionIndex].metadata,
              branchCount: edge.type === 'branch' ? updatedSessions[sessionIndex].metadata.branchCount + 1 : updatedSessions[sessionIndex].metadata.branchCount,
              lastActivity: new Date(),
            },
          };
          return { sessions: updatedSessions };
        });
      },

      removeEdge: (edgeId: string) => {
        const { sessions, activeSessionId } = get();
        if (!activeSessionId) return;

        const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
        if (sessionIndex === -1) return;

        set(state => {
          const updatedSessions = [...state.sessions];
          const canvas = updatedSessions[sessionIndex].canvas;
          
          // Count removed branches for metadata update
          const removedEdge = canvas.edges.find(e => e.id === edgeId);
          const branchRemoved = removedEdge?.type === 'branch' ? 1 : 0;
          
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            canvas: {
              ...canvas,
              edges: canvas.edges.filter(e => e.id !== edgeId),
              metadata: {
                ...canvas.metadata,
                branchCount: Math.max(0, canvas.metadata.branchCount - branchRemoved),
                lastActivity: new Date(),
              },
              updatedAt: new Date(),
            },
            metadata: {
              ...updatedSessions[sessionIndex].metadata,
              branchCount: Math.max(0, updatedSessions[sessionIndex].metadata.branchCount - branchRemoved),
              lastActivity: new Date(),
            },
          };
          return { sessions: updatedSessions };
        });
      },

      // Create a contextual node with proper conversation history inheritance
      createContextualNode: (userMessage: string, parentNodeId?: string, quotedText?: string, sourceNodeId?: string, position?: { x: number; y: number }) => {
        const nodeId = generateId();
        
        // Get COMPLETE parent conversation history if parentNodeId is provided
        // This includes all previous messages AND the parent's current exchange
        let parentHistory: ChatMessage[] = [];
        if (parentNodeId) {
          parentHistory = get().getNodeConversation(parentNodeId); // FIX: Use getNodeConversation instead of getNodeHistory
        }
        
        // Create new node with inherited conversation history
        const node: ConversationNode = {
          id: nodeId,
          parentId: parentNodeId || null,
          messages: [...parentHistory], // Inherit COMPLETE conversation history including parent's exchange
          currentExchange: {
            userMessage: userMessage.trim(),
            aiResponse: '', // Will be filled when AI responds
            quotedText: quotedText || undefined,
            sourceNodeId: sourceNodeId || undefined,
          },
          position: position || { x: 0, y: 0 },
          createdAt: new Date(),
        };

        get().addNode(node);
        
        // Create edge if parent exists
        if (parentNodeId) {
          const edge: ConversationEdge = {
            id: generateId(),
            source: parentNodeId,
            target: nodeId,
            type: quotedText ? 'branch' : 'default',
            animated: quotedText ? true : false,
            style: quotedText ? { stroke: '#3b82f6', strokeWidth: 2 } : undefined,
          };
          get().addEdge(edge);
        }
        
        return nodeId;
      },


      setActiveNode: (nodeId: string | null) => {
        set({ activeNodeId: nodeId });
      },

      // Text Selection Actions
      setTextSelection: (selection: TextSelection | null) => {
        set({ textSelection: selection });
      },

      // Streaming Actions
      startStreaming: (nodeId: string) => {
        set({
          streamingState: {
            isStreaming: true,
            currentText: '',
            nodeId,
          },
        });
      },

      updateStreamingText: (text: string) => {
        set(state => ({
          streamingState: {
            ...state.streamingState,
            currentText: text,
          },
        }));
      },

      finishStreaming: () => {
        const { streamingState } = get();
        if (streamingState.nodeId && streamingState.currentText) {
          // Update the node with the final streamed content in the new structure
          const node = get().getNode(streamingState.nodeId);
          if (node) {
            get().updateNode(streamingState.nodeId, {
              currentExchange: {
                ...node.currentExchange,
                aiResponse: streamingState.currentText,
              },
            });
          }
        }

        set({
          streamingState: {
            isStreaming: false,
            currentText: '',
            nodeId: null,
          },
        });
      },

      // Utility Actions
      clearAll: () => {
        set({
          sessions: [],
          activeSessionId: null,
          activeNodeId: null,
          streamingState: {
            isStreaming: false,
            currentText: '',
            nodeId: null,
          },
          textSelection: null,
        });
      },
    }),
    {
      name: 'conversation-storage',
      version: 4, // Increment version for breaking changes
      migrate: (persistedState: unknown, version: number) => {
        // Clear old data to prevent conflicts with new structure
        if (version < 4) {
          return {
            sessions: [],
            activeSessionId: null,
            activeNodeId: null,
            streamingState: {
              isStreaming: false,
              currentText: '',
              nodeId: null,
            },
            textSelection: null,
          };
        }
        return persistedState;
      },
    }
  )
);
