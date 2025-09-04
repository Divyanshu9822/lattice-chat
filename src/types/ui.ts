export interface UIState {
  activeNodeId: string | null;
  isInputFocused: boolean;
  canvasViewport: { x: number; y: number; zoom: number };
  windowDimensions: { width: number; height: number };
  textSelection: TextSelection | null;
  showBranchInput: boolean;
  branchInputPosition: { x: number; y: number } | null;
}

export interface TextSelection {
  nodeId: string;
  startIndex: number;
  endIndex: number;
  selectedText: string;
  boundingRect: { x: number; y: number; width: number; height: number };
}

export interface NodeInteraction {
  type: 'select' | 'branch' | 'drag' | 'connect';
  nodeId: string;
  data?: any;
}

export interface FloatingInputState {
  isVisible: boolean;
  position: { x: number; y: number };
  contextNodeId: string | null;
  branchContext?: {
    selectedText: string;
    startIndex: number;
    endIndex: number;
  };
}

export interface StatusIndicatorState {
  type: 'success' | 'error' | 'loading' | 'idle';
  message: string;
  nodeCount?: number;
  branchCount?: number;
  lastActivity?: Date;
}

export interface AnimationConfig {
  duration: number;
  ease: string;
  delay?: number;
}

export interface CanvasConfig {
  nodeTypes: Record<string, any>;
  edgeTypes: Record<string, any>;
  defaultNodeSize: { width: number; height: number };
  nodeSpacing: { x: number; y: number };
  canvasLimits: {
    minZoom: number;
    maxZoom: number;
    panExtent: [[number, number], [number, number]];
  };
}