import { useEffect } from 'react';
import { Header, ConversationCanvas } from './components';
import { useConversationStore } from './store';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function AppContent() {
  const { sessions, createSession } = useConversationStore();

  // Initialize with a session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('Welcome to Lattice');
    }
  }, [sessions.length, createSession]);

  return (
    <div className="h-screen bg-canvas-bg-light dark:bg-canvas-bg-dark flex flex-col overflow-hidden transition-colors duration-250">
      {/* Header */}
      <Header />

      {/* Main Canvas Area */}
      <main className="flex-1 relative overflow-hidden">
        <ConversationCanvas className="w-full h-full" />
      </main>

      {/* Professional Background Grid Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <svg 
          className="absolute inset-0 w-full h-full" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern 
              id="professional-grid" 
              width="32" 
              height="32" 
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="16"
                cy="16"
                r="1"
                fill="currentColor"
                className="text-canvas-grid-light dark:text-canvas-grid-dark"
                opacity="0.3"
              />
            </pattern>
            <pattern 
              id="professional-grid-large" 
              width="128" 
              height="128" 
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="64"
                cy="64"
                r="2"
                fill="currentColor"
                className="text-canvas-grid-light dark:text-canvas-grid-dark"
                opacity="0.15"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#professional-grid)" />
          <rect width="100%" height="100%" fill="url(#professional-grid-large)" />
        </svg>
      </div>

      {/* Ambient background gradient */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-500/5 dark:bg-primary-400/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent-purple-500/5 dark:bg-accent-purple-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-accent-emerald-500/5 dark:bg-accent-emerald-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
