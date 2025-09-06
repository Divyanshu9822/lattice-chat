import { create } from 'zustand';
import type { FloatingInputState, StatusIndicatorState } from '../types';

interface UIStore {
  // Core UI State
  floatingInput: FloatingInputState;
  statusIndicator: StatusIndicatorState;
  windowDimensions: { width: number; height: number };
  
  // Floating Input Actions
  showFloatingInput: (position: { x: number; y: number }, contextNodeId: string) => void;
  hideFloatingInput: () => void;
  
  // Status Actions
  setStatus: (status: Partial<StatusIndicatorState>) => void;
  clearStatus: () => void;
  
  // Window Actions
  updateWindowDimensions: (dimensions: { width: number; height: number }) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial State
  floatingInput: {
    isVisible: false,
    position: { x: 0, y: 0 },
    contextNodeId: null,
  },

  statusIndicator: {
    type: 'idle',
    message: '',
  },

  windowDimensions: { 
    width: typeof window !== 'undefined' ? window.innerWidth : 1024, 
    height: typeof window !== 'undefined' ? window.innerHeight : 768 
  },

  // Floating Input Actions
  showFloatingInput: (position: { x: number; y: number }, contextNodeId: string) => {
    set({
      floatingInput: {
        isVisible: true,
        position,
        contextNodeId,
      },
    });
  },

  hideFloatingInput: () => {
    set({
      floatingInput: {
        isVisible: false,
        position: { x: 0, y: 0 },
        contextNodeId: null,
      },
    });
  },

  // Status Actions
  setStatus: (status: Partial<StatusIndicatorState>) => {
    set(state => ({
      statusIndicator: {
        ...state.statusIndicator,
        ...status,
      },
    }));
  },

  clearStatus: () => {
    set({
      statusIndicator: {
        type: 'idle',
        message: '',
      },
    });
  },

  // Window Actions
  updateWindowDimensions: (dimensions: { width: number; height: number }) => {
    set({ windowDimensions: dimensions });
  },
}));

/**
 * Window resize listener
 * Only set up if we're in a browser environment
 */
if (typeof window !== 'undefined') {
  const handleResize = () => {
    useUIStore.getState().updateWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  window.addEventListener('resize', handleResize);
}
