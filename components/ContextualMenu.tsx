
import React, { useState, useEffect } from 'react';
import { AITextAction } from '../types';
import WandSparklesIcon from './icons/WandSparklesIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import TextShrinkIcon from './icons/TextShrinkIcon';
import TranslateIcon from './icons/TranslateIcon';
import DictionaryIcon from './icons/DictionaryIcon';
import { getWordMeaning } from '../services/dictionaryService';

interface ContextualMenuProps {
  top: number;
  left: number;
  onAction: (action: AITextAction, language?: string) => void;
  isLoading: boolean;
  selectedText?: string;
}

const actionButtons = [
    { action: 'improve', icon: WandSparklesIcon, title: 'Improve writing clarity and flow' },
    { action: 'fix-grammar', icon: CheckBadgeIcon, title: 'Correct spelling and grammar' },
    { action: 'shorten', icon: TextShrinkIcon, title: 'Make text more concise' },
] as const;

const languages = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Japanese'] as const;
const dictionaryLanguages = ['English', 'Hindi', 'Spanish', 'French', 'German'] as const;

const ContextualMenu: React.FC<ContextualMenuProps> = ({ top, left, onAction, isLoading, selectedText }) => {
  const [activeAction, setActiveAction] = useState<AITextAction | null>(null);
  const [isTranslateMenuOpen, setTranslateMenuOpen] = useState(false);
  const [isDictionaryMenuOpen, setDictionaryMenuOpen] = useState(false);
  const [dictionaryResult, setDictionaryResult] = useState<{word: string, meaning: string} | null>(null);
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(false);
  const [translateTimer, setTranslateTimer] = useState<NodeJS.Timeout | null>(null);
  const [dictionaryTimer, setDictionaryTimer] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (translateTimer) clearTimeout(translateTimer);
      if (dictionaryTimer) clearTimeout(dictionaryTimer);
    };
  }, [translateTimer, dictionaryTimer]);

  const handleActionClick = (action: AITextAction, language?: string) => {
    if (isLoading) return;
    setActiveAction(action);
    onAction(action, language);
    setTranslateMenuOpen(false);
    setDictionaryMenuOpen(false);
  };

  const handleTranslateMouseEnter = () => {
    if (translateTimer) clearTimeout(translateTimer);
    setTranslateMenuOpen(true);
  };

  const handleTranslateMouseLeave = () => {
    const timer = setTimeout(() => setTranslateMenuOpen(false), 200);
    setTranslateTimer(timer);
  };

  const handleDictionaryMouseEnter = () => {
    if (dictionaryTimer) clearTimeout(dictionaryTimer);
    setDictionaryMenuOpen(true);
  };

  const handleDictionaryMouseLeave = () => {
    const timer = setTimeout(() => setDictionaryMenuOpen(false), 200);
    setDictionaryTimer(timer);
  };

  const handleDictionaryClick = async (language: string) => {
    if (!selectedText || isDictionaryLoading) return;
    
    setIsDictionaryLoading(true);
    setDictionaryMenuOpen(false);
    setDictionaryResult(null);
    
    try {
      const meaning = await getWordMeaning(selectedText, language.toLowerCase());
      setDictionaryResult({ word: selectedText, meaning });
    } catch (error) {
      setDictionaryResult({ word: selectedText, meaning: 'Failed to get meaning' });
    } finally {
      setIsDictionaryLoading(false);
    }
  };

  // Get viewport dimensions for better mobile positioning
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const isMobile = viewportWidth < 768;
  
  // Calculate responsive positioning
  const getResponsivePosition = () => {
    if (isMobile) {
      // For mobile, center the menu horizontally and position it carefully vertically
      const menuWidth = 320; // Approximate menu width on mobile
      const menuHeight = 60; // Approximate menu height
      
      // Center horizontally in viewport
      const centeredLeft = Math.max(10, Math.min(viewportWidth - menuWidth - 10, left));
      
      // Position vertically with better spacing
      let adjustedTop = top;
      
      // If menu would be too close to bottom of screen, move it up
      if (top + menuHeight > viewportHeight - 20) {
        adjustedTop = Math.max(10, viewportHeight - menuHeight - 20);
      }
      
      // If menu would be too close to top, move it down
      if (adjustedTop < 10) {
        adjustedTop = 10;
      }
      
      return { top: adjustedTop, left: centeredLeft };
    }
    
    // Desktop positioning (existing logic)
    return { top, left };
  };
  
  const { top: finalTop, left: finalLeft } = getResponsivePosition();

  return (
    <div
      style={{ top: finalTop, left: finalLeft }}
      className={`contextual-menu-container absolute z-50 bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-lg shadow-2xl p-1.5 sm:p-1 flex items-center gap-1.5 sm:gap-1 animate-fade-in touch-manipulation min-h-[44px] sm:min-h-auto ${isMobile ? 'flex-wrap justify-center max-w-[calc(100vw-20px)]' : ''}`}
      onClick={(e) => e.stopPropagation()} // Prevent closing the menu when clicking on it
      onTouchStart={(e) => e.stopPropagation()} // Prevent closing the menu when touching it
    >
      {actionButtons.map(({ action, icon: Icon, title }) => (
        <button
          key={action}
          title={title}
          onClick={() => handleActionClick(action)}
          disabled={isLoading}
          className="p-2.5 sm:p-2 rounded-md text-text-muted dark:text-dark-text-muted hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-accent dark:hover:text-dark-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto flex items-center justify-center"
        >
          {isLoading && activeAction === action ? (
            <div className="w-5 h-5 border-2 border-text-muted/50 border-t-accent dark:border-dark-text-muted/50 dark:border-t-dark-accent rounded-full animate-spin"></div>
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </button>
      ))}

      {/* Translate Button with Sub-menu */}
      <div className="relative" 
           onMouseEnter={handleTranslateMouseEnter} 
           onMouseLeave={handleTranslateMouseLeave}
           onTouchStart={handleTranslateMouseEnter}>
        <button
          title="Translate text"
          disabled={isLoading}
          onClick={() => setTranslateMenuOpen(!isTranslateMenuOpen)}
          className="p-2.5 sm:p-2 rounded-md text-text-muted dark:text-dark-text-muted hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-accent dark:hover:text-dark-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto flex items-center justify-center"
        >
            {isLoading && activeAction === 'translate' ? (
                <div className="w-5 h-5 border-2 border-text-muted/50 border-t-accent dark:border-dark-text-muted/50 dark:border-t-dark-accent rounded-full animate-spin"></div>
            ) : (
                <TranslateIcon className="w-5 h-5" />
            )}
        </button>

        {isTranslateMenuOpen && !isLoading && (
            <div 
              className={`absolute top-full mt-1 w-32 bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-md shadow-lg animate-fade-in z-50 ${
                isMobile 
                  ? 'right-0' // Align to right edge on mobile to prevent cutoff
                  : 'left-1/2 -translate-x-1/2'
              }`}
              onMouseEnter={handleTranslateMouseEnter}
              onMouseLeave={handleTranslateMouseLeave}
            >
                <ul className="py-1">
                    {languages.map(lang => (
                        <li key={lang}>
                            <button
                                onClick={() => handleActionClick('translate', lang)}
                                className="w-full text-left px-3 py-1.5 text-sm text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary"
                            >
                                {lang}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>

      {/* Dictionary Button with Sub-menu */}
      <div className="relative" 
           onMouseEnter={handleDictionaryMouseEnter} 
           onMouseLeave={handleDictionaryMouseLeave}
           onTouchStart={handleDictionaryMouseEnter}>
        <button
          title="Get word meaning"
          disabled={isLoading || isDictionaryLoading}
          onClick={() => setDictionaryMenuOpen(!isDictionaryMenuOpen)}
          className="p-2.5 sm:p-2 rounded-md text-text-muted dark:text-dark-text-muted hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-accent dark:hover:text-dark-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto flex items-center justify-center"
        >
            {isDictionaryLoading ? (
                <div className="w-5 h-5 border-2 border-text-muted/50 border-t-accent dark:border-dark-text-muted/50 dark:border-t-dark-accent rounded-full animate-spin"></div>
            ) : (
                <DictionaryIcon className="w-5 h-5" />
            )}
        </button>

        {isDictionaryMenuOpen && !isLoading && !isDictionaryLoading && (
            <div 
              className={`absolute top-full mt-1 w-32 bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-md shadow-lg animate-fade-in z-50 ${
                isMobile 
                  ? 'right-0' // Align to right edge on mobile to prevent cutoff
                  : 'left-1/2 -translate-x-1/2'
              }`}
              onMouseEnter={handleDictionaryMouseEnter}
              onMouseLeave={handleDictionaryMouseLeave}
            >
                <ul className="py-1">
                    {dictionaryLanguages.map(lang => (
                        <li key={lang}>
                            <button
                                onClick={() => handleDictionaryClick(lang)}
                                className="w-full text-left px-3 py-1.5 text-sm text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary"
                            >
                                {lang}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {/* Dictionary Result */}
        {dictionaryResult && (
            <div className={`absolute top-full mt-2 bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-md shadow-lg animate-fade-in z-50 p-3 ${
              isMobile 
                ? 'right-0 w-72 max-w-[calc(100vw-20px)]' // Align to right edge on mobile
                : 'left-1/2 -translate-x-1/2 w-64'
            }`}>
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-text-primary dark:text-dark-text-primary text-sm">Dictionary</h4>
                    <button
                        onClick={() => setDictionaryResult(null)}
                        className="text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary"
                    >
                        ✕
                    </button>
                </div>
                <div className="text-sm">
                    <span className="font-medium text-accent dark:text-dark-accent">"{dictionaryResult.word}"</span>
                    <span className="text-text-muted dark:text-dark-text-muted mx-2">→</span>
                    <span className="text-text-secondary dark:text-dark-text-secondary">{dictionaryResult.meaning}</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ContextualMenu;
