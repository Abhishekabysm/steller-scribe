import React, { useState, useEffect } from 'react';
import { FaKeyboard, FaTimes } from 'react-icons/fa';

interface KeyboardShortcutHintsProps {
  shortcuts: Array<{
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    description: string;
  }>;
  isVisible: boolean;
  onClose: () => void;
}

const KeyboardShortcutHints: React.FC<KeyboardShortcutHintsProps> = ({
  shortcuts,
  isVisible,
  onClose
}) => {
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowHints(true);
      const timer = setTimeout(() => {
        setShowHints(false);
        setTimeout(onClose, 300); // Close after fade out
      }, 3000); // Show for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const formatShortcut = (shortcut: any) => {
    const parts = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.metaKey) parts.push('Cmd');
    
    // Format the main key
    let key = shortcut.key;
    if (key === ' ') key = 'Space';
    else if (key === 'ArrowUp') key = '↑';
    else if (key === 'ArrowDown') key = '↓';
    else if (key === 'ArrowLeft') key = '←';
    else if (key === 'ArrowRight') key = '→';
    else if (key === 'Enter') key = 'Enter';
    else if (key === 'Escape') key = 'Esc';
    else if (key === 'Backspace') key = 'Backspace';
    else if (key === 'Delete') key = 'Delete';
    else if (key === 'Tab') key = 'Tab';
    else if (key === 'Home') key = 'Home';
    else if (key === 'End') key = 'End';
    else if (key === 'PageUp') key = 'Page Up';
    else if (key === 'PageDown') key = 'Page Down';
    else key = key.toUpperCase();
    
    parts.push(key);
    return parts.join(' + ');
  };

  if (!isVisible || !showHints) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl border border-gray-200 dark:border-dark-border-color p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaKeyboard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-secondary transition-colors"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
        
        <div className="space-y-2">
          {shortcuts.slice(0, 5).map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-dark-text-secondary">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-secondary font-mono rounded border border-gray-300 dark:border-dark-border-color">
                {formatShortcut(shortcut)}
              </kbd>
            </div>
          ))}
          {shortcuts.length > 5 && (
            <div className="text-xs text-gray-500 dark:text-dark-text-muted text-center pt-1">
              +{shortcuts.length - 5} more shortcuts available
            </div>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border-color">
          <p className="text-xs text-gray-500 dark:text-dark-text-muted text-center">
            Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-secondary font-mono rounded text-xs">?</kbd> for full list
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutHints;
