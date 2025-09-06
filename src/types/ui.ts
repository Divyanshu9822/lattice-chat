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
}

export interface CanvasConfig {
  defaultNodeSize: { width: number; height: number };
  nodeSpacing: { x: number; y: number };
  canvasLimits: {
    minZoom: number;
    maxZoom: number;
    panExtent: [[number, number], [number, number]];
  };
}
