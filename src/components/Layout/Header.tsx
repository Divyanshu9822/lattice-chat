import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, MoreHorizontal, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useConversationStore } from '../../store';
import { cn } from '../../utils';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  
  const {
    getActiveSession,
    sessions,
    createSession,
    deleteSession,
    setActiveSession,
    clearAll,
  } = useConversationStore();

  const activeSession = getActiveSession();
  const branchCount = activeSession?.metadata.branchCount || 0;

  const handleNewSession = () => {
    createSession();
    setShowSessionMenu(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length > 1) {
      deleteSession(sessionId);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSession(sessionId);
    setShowSessionMenu(false);
  };

  return (
    <header className={cn(
      'bg-white border-b border-gray-200 px-6 py-4 relative z-40',
      className
    )}>
      <div className="flex items-center justify-between">
        {/* Left Side - Logo and Model */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Canvas Chat</h1>
              <p className="text-xs text-gray-500">Branching Conversations</p>
            </div>
          </motion.div>

          {/* Model Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">Gemini 2.0 Flash</span>
          </div>
        </div>

        {/* Center - Session Info */}
        {activeSession && (
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{activeSession.metadata.totalMessages} messages</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <div className="flex items-center gap-2">
              <span>{branchCount} branch{branchCount !== 1 ? 'es' : ''}</span>
            </div>
          </div>
        )}

        {/* Right Side - Controls */}
        <div className="flex items-center gap-3">
          {/* Session Selector */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSessionMenu(!showSessionMenu)}
              className={cn(
                'p-2 hover:bg-gray-100 rounded-lg transition-colors',
                'flex items-center gap-2 text-sm font-medium text-gray-700',
                showSessionMenu && 'bg-gray-100'
              )}
            >
              <span className="hidden sm:inline">
                {activeSession?.title || 'No Session'}
              </span>
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>

            {/* Session Dropdown */}
            <AnimatePresence>
              {showSessionMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                >
                  {/* New Session Button */}
                  <button
                    onClick={handleNewSession}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-600">New Conversation</span>
                  </button>

                  {sessions.length > 0 && (
                    <>
                      <hr className="my-2 border-gray-100" />
                      
                      {/* Session List */}
                      <div className="max-h-64 overflow-y-auto">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className={cn(
                              'px-4 py-2 hover:bg-gray-50 flex items-center justify-between group',
                              session.id === activeSession?.id && 'bg-blue-50'
                            )}
                          >
                            <button
                              onClick={() => handleSelectSession(session.id)}
                              className="flex-1 text-left"
                            >
                              <div className="flex items-center gap-3">
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {session.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {session.metadata.totalMessages} messages • {session.metadata.branchCount} branches
                                  </p>
                                </div>
                              </div>
                            </button>
                            
                            {sessions.length > 1 && (
                              <button
                                onClick={(e) => handleDeleteSession(session.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {sessions.length > 1 && (
                        <>
                          <hr className="my-2 border-gray-100" />
                          <button
                            onClick={() => {
                              clearAll();
                              setShowSessionMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Clear All Sessions</span>
                          </button>
                        </>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showSessionMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSessionMenu(false)}
        />
      )}
    </header>
  );
};