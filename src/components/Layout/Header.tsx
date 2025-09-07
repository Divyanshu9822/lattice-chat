import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon, Monitor, Settings } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui';
import { AI_CONFIG } from '../../config/app';

export const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const ThemeIcon = themeIcons[theme];

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative z-50 border-b border-secondary-200/50 dark:border-secondary-700/50 backdrop-blur-sm bg-white/80 dark:bg-secondary-900/80"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-medium">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-emerald-500 rounded-full animate-glow-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 tracking-tight">
                Lattice
              </h1>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 -mt-0.5">
                AI Canvas Chat
              </p>
            </div>
          </motion.div>


          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Model Info */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary-100 dark:bg-secondary-800 rounded-lg text-xs text-secondary-700 dark:text-secondary-300">
              <div className="w-2 h-2 bg-accent-amber-500 rounded-full" />
              {AI_CONFIG.modelDisplayName}
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
              className="relative"
              title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
            >
              <ThemeIcon className="w-4 h-4" />
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-3 pt-3 border-t border-secondary-200/50 dark:border-secondary-700/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-secondary-500 dark:text-secondary-400">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-secondary-100 dark:bg-secondary-800 rounded text-xs">⌘K</kbd>
                <span>New conversation</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-secondary-100 dark:bg-secondary-800 rounded text-xs">Select text</kbd>
                <span>Branch conversation</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};
