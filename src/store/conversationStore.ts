import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  ConversationSession, 
  ConversationMessage,
  ConversationCanvas,
  ConversationNode,
  ConversationEdge,
  StreamingState,
  TextSelection
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
  getNodeHistory: (nodeId: string) => ConversationMessage[];

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
  createMessageNode: (parentNodeId: string, message: ConversationMessage, position: { x: number; y: number }) => string;
  createBranchNode: (parentNodeId: string, message: ConversationMessage, position: { x: number; y: number }, textSelection?: TextSelection) => string;
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
        const canvas = get().getActiveCanvas();
        if (!canvas) return [];
        
        // Build conversation history by traversing from root to this node
        const messages: ConversationMessage[] = [];
        let currentNodeId: string | null = nodeId;
        
        while (currentNodeId) {
          const node = canvas.nodes.find(n => n.id === currentNodeId);
          if (!node) break;
          
          if (node.data.message) {
            messages.unshift(node.data.message);
          }
          
          // Find parent node
          const parentEdge = canvas.edges.find(edge => edge.target === currentNodeId);
          currentNodeId = parentEdge?.source || null;
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
              totalMessages: updatedSessions[sessionIndex].metadata.totalMessages + (node.data.message ? 1 : 0),
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
              updatedAt: new Date(),
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
          const removedNode = canvas.nodes.find(n => n.id === nodeId);
          const messageRemoved = removedNode?.data.message ? 1 : 0;
          
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

      // Node Actions
      createMessageNode: (parentNodeId: string, message: ConversationMessage, position: { x: number; y: number }) => {
        const nodeId = generateId();
        
        const node: ConversationNode = {
          id: nodeId,
          messageId: message.id,
          parentNodeId,
          type: message.role,
          position,
          data: {
            message,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const edge: ConversationEdge = {
          id: generateId(),
          source: parentNodeId,
          target: nodeId,
          type: 'default',
        };

        get().addNode(node);
        get().addEdge(edge);
        
        return nodeId;
      },

      createBranchNode: (parentNodeId: string, message: ConversationMessage, position: { x: number; y: number }, textSelection?: TextSelection) => {
        const nodeId = generateId();
        
        const node: ConversationNode = {
          id: nodeId,
          messageId: message.id,
          parentNodeId,
          type: message.role,
          position,
          data: {
            message,
            branchPoint: textSelection ? {
              startIndex: textSelection.startIndex,
              endIndex: textSelection.endIndex,
              selectedText: textSelection.selectedText,
            } : undefined,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const edge: ConversationEdge = {
          id: generateId(),
          source: parentNodeId,
          target: nodeId,
          type: 'branch',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        };

        get().addNode(node);
        get().addEdge(edge);
        
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
          // Update the node with the final streamed content
          const node = get().getNode(streamingState.nodeId);
          if (node && node.data.message) {
            get().updateNode(streamingState.nodeId, {
              data: {
                ...node.data,
                message: {
                  ...node.data.message,
                  content: streamingState.currentText,
                },
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
