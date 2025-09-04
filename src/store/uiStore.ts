import { create } from 'zustand';
import type { UIState, CardLayoutConfig, FloatingInputState, StatusIndicatorState } from '../types';

interface UIStore extends UIState {
  // Layout Configuration
  cardLayout: CardLayoutConfig;
  floatingInput: FloatingInputState;
  statusIndicator: StatusIndicatorState;

  // Actions
  setActiveBranch: (branchId: string | null) => void;
  setInputFocus: (focused: boolean) => void;
  updateCardPosition: (branchId: string, position: { x: number; order: number }) => void;
  setScrollPosition: (position: number) => void;
  updateWindowDimensions: (dimensions: { width: number; height: number }) => void;
  
  // Floating Input Actions
  showFloatingInput: (position: { x: number; y: number }, contextBranchId: string) => void;
  hideFloatingInput: () => void;
  
  // Status Actions
  setStatus: (status: Partial<StatusIndicatorState>) => void;
  clearStatus: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial State
  activeBranchId: null,
  isInputFocused: false,
  cardPositions: {},
  scrollPosition: 0,
  windowDimensions: { width: window.innerWidth, height: window.innerHeight },

  // Layout Configuration
  cardLayout: {
    cardWidth: 384, // 96 * 4 (24rem)
    cardMaxHeight: 600,
    horizontalGap: 24,
    verticalPadding: 32,
  },

  floatingInput: {
    isVisible: true,
    position: { x: 0, y: 0 },
    contextBranchId: null,
  },

  statusIndicator: {
    type: 'idle',
    message: '',
  },

  // Actions
  setActiveBranch: (branchId: string | null) => {
    set({ activeBranchId: branchId });
  },

  setInputFocus: (focused: boolean) => {
    set({ isInputFocused: focused });
  },

  updateCardPosition: (branchId: string, position: { x: number; order: number }) => {
    set(state => ({
      cardPositions: {
        ...state.cardPositions,
        [branchId]: position,
      },
    }));
  },

  setScrollPosition: (position: number) => {
    set({ scrollPosition: position });
  },

  updateWindowDimensions: (dimensions: { width: number; height: number }) => {
    set({ windowDimensions: dimensions });
  },

  // Floating Input Actions
  showFloatingInput: (position: { x: number; y: number }, contextBranchId: string) => {
    set({
      floatingInput: {
        isVisible: true,
        position,
        contextBranchId,
      },
    });
  },

  hideFloatingInput: () => {
    set(state => ({
      floatingInput: {
        ...state.floatingInput,
        isVisible: false,
        contextBranchId: null,
      },
    }));
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
}));

// Window resize listener
if (typeof window !== 'undefined') {
  const handleResize = () => {
    useUIStore.getState().updateWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  window.addEventListener('resize', handleResize);
}