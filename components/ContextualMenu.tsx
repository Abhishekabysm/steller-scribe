
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

  return (
    <div
      style={{ top, left }}
      className="contextual-menu-container absolute z-40 bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-lg shadow-xl p-1 flex items-center space-x-1 animate-fade-in transform -translate-x-1/2"
      onClick={(e) => e.stopPropagation()} // Prevent closing the menu when clicking on it
    >
      {actionButtons.map(({ action, icon: Icon, title }) => (
        <button
          key={action}
          title={title}
          onClick={() => handleActionClick(action)}
          disabled={isLoading}
          className="p-2 rounded-md text-text-muted dark:text-dark-text-muted hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-accent dark:hover:text-dark-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && activeAction === action ? (
            <div className="w-5 h-5 border-2 border-text-muted/50 border-t-accent dark:border-dark-text-muted/50 dark:border-t-dark-accent rounded-full animate-spin"></div>
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </button>
      ))}

      {/* Translate Button with Sub-menu */}
      <div className="relative" onMouseEnter={handleTranslateMouseEnter} onMouseLeave={handleTranslateMouseLeave}>
        <button
          title="Translate text"
          disabled={isLoading}
          className="p-2 rounded-md text-text-muted dark:text-dark-text-muted hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-accent dark:hover:text-dark-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading && activeAction === 'translate' ? (
                <div className="w-5 h-5 border-2 border-text-muted/50 border-t-accent dark:border-dark-text-muted/50 dark:border-t-dark-accent rounded-full animate-spin"></div>
            ) : (
                <TranslateIcon className="w-5 h-5" />
            )}
        </button>

        {isTranslateMenuOpen && !isLoading && (
            <div 
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-md shadow-lg animate-fade-in"
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
      <div className="relative" onMouseEnter={handleDictionaryMouseEnter} onMouseLeave={handleDictionaryMouseLeave}>
        <button
          title="Get word meaning"
          disabled={isLoading || isDictionaryLoading}
          className="p-2 rounded-md text-text-muted dark:text-dark-text-muted hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-accent dark:hover:text-dark-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isDictionaryLoading ? (
                <div className="w-5 h-5 border-2 border-text-muted/50 border-t-accent dark:border-dark-text-muted/50 dark:border-t-dark-accent rounded-full animate-spin"></div>
            ) : (
                <DictionaryIcon className="w-5 h-5" />
            )}
        </button>

        {isDictionaryMenuOpen && !isLoading && !isDictionaryLoading && (
            <div 
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-md shadow-lg animate-fade-in z-50"
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
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-md shadow-lg animate-fade-in z-50 p-3">
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
