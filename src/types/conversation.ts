export interface ConversationMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  quotedText?: string; // Referenced text from previous messages
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
    error?: boolean;
    isStreaming?: boolean;
  };
}

// Core message interface for conversation history
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quotedText?: string;
}


export interface ConversationNode {
  id: string;
  parentId: string | null;
  messages: ChatMessage[]; // Full conversation history up to this point
  currentExchange: {
    userMessage: string;
    aiResponse: string;
    quotedText?: string; // Selected text that created this branch
    sourceNodeId?: string; // Node where the text was selected from
  };
  position: { x: number; y: number };
  createdAt: Date;
}

export interface ConversationEdge {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'branch' | 'continuation';
  animated?: boolean;
  style?: Record<string, unknown>;
}

export interface ConversationCanvas {
  id: string;
  title: string;
  nodes: ConversationNode[];
  edges: ConversationEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  metadata: {
    nodeCount: number;
    branchCount: number;
    lastActivity: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationSession {
  id: string;
  title: string;
  canvas: ConversationCanvas;
  metadata: {
    totalMessages: number;
    branchCount: number;
    lastActivity: Date;
  };
}

export interface BranchingContext {
  sessionId: string;
  nodeId: string;
  selectedText?: string;
  position?: { x: number; y: number };
}

export interface StreamingState {
  isStreaming: boolean;
  currentText: string;
  nodeId: string | null;
}

export interface TextSelection {
  nodeId: string;
  startIndex: number;
  endIndex: number;
  selectedText: string;
  position: { x: number; y: number };
}
