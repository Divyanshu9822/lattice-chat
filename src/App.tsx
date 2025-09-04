import React, { useEffect } from 'react';
import { Header, ConversationCanvas } from './components';
import { useConversationStore } from './store';
import './App.css';

function App() {
  const { sessions, createSession } = useConversationStore();

  // Initialize with a session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('Welcome to Canvas Chat');
    }
  }, [sessions.length, createSession]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Canvas Area */}
      <main className="flex-1 relative overflow-hidden">
        <ConversationCanvas className="w-full h-full" />
      </main>

      {/* Background Grid Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <svg 
          className="absolute inset-0 w-full h-full" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern 
              id="grid" 
              width="50" 
              height="50" 
              patternUnits="userSpaceOnUse"
            >
              <path 
                d="M 50 0 L 0 0 0 50" 
                fill="none" 
                stroke="#f1f5f9" 
                strokeWidth="1" 
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
}

export default App;
