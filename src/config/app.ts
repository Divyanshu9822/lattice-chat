// Application Configuration
export const APP_CONFIG = {
  // AI Model Configuration
  ai: {
    modelName: 'gemini-2.5-flash',
    modelDisplayName: 'Gemini 2.5 Flash',
    provider: 'Google',
  },

  // Application Info
  app: {
    name: 'Lattice',
    description: 'AI Canvas Chat',
    version: '1.0.0',
  },

  // UI Configuration
  ui: {
    animations: {
      defaultDuration: 300,
      fastDuration: 150,
      slowDuration: 500,
    },
    canvas: {
      minZoom: 0.1,
      maxZoom: 2,
      defaultZoom: 0.8,
      fitViewPadding: 0.15,
    },
    minimap: {
      showThreshold: 3, // Show minimap when more than 3 nodes
      width: 192, // 48 * 4 (12rem equivalent)
      height: 128, // 32 * 4 (8rem equivalent)
    },
  },
} as const;

// Export individual configs for convenience
export const { ai: AI_CONFIG, app: APP_CONFIG_INFO, ui: UI_CONFIG } = APP_CONFIG;
