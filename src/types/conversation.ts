export interface ConversationMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
    error?: boolean;
    isStreaming?: boolean;
  };
}

export interface ConversationExchange {
  userMessage: ConversationMessage;
  aiResponse?: ConversationMessage;
  isGenerating?: boolean;
}

export interface ConversationNode {
  id: string;
  messageId: string;
  parentNodeId: string | null;
  type: 'user' | 'assistant' | 'root' | 'exchange';
  position: { x: number; y: number };
  data: {
    message?: ConversationMessage;
    exchange?: ConversationExchange;
    label?: string;
    isSelected?: boolean;
    branchPoint?: {
      startIndex: number;
      endIndex: number;
      selectedText: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
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
