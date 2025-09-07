import React, { useState, useMemo, useEffect } from 'react';
import { FaTimes, FaKeyboard, FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { ShortcutHelpModalProps } from '../types/keyboardShortcuts';

const KeyboardShortcutsModal: React.FC<ShortcutHelpModalProps> = ({
  isOpen,
  onClose,
  shortcuts = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['editing', 'navigation']));

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const filteredShortcuts = useMemo(() => {
    if (!shortcuts || !Array.isArray(shortcuts)) return [];
    if (!searchQuery.trim()) return shortcuts;

    const query = searchQuery.toLowerCase();
    return shortcuts.map(group => ({
      ...group,
      shortcuts: group.shortcuts.filter(shortcut =>
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.key.toLowerCase().includes(query)
      )
    })).filter(group => group.shortcuts.length > 0);
  }, [shortcuts, searchQuery]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-border-color dark:border-dark-border-color animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-border-color dark:border-dark-border-color bg-gradient-to-r from-bg-secondary to-header-background dark:from-dark-bg-secondary dark:to-dark-header-background rounded-t-2xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent/10 dark:bg-dark-accent/20 rounded-lg">
                <FaKeyboard className="w-6 h-6 text-accent dark:text-dark-accent" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
                Keyboard Shortcuts
              </h2>
            </div>
            <p className="text-text-secondary dark:text-dark-text-secondary text-lg">
              Master your note editor with these powerful shortcuts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-text-muted hover:text-text-secondary dark:text-dark-text-muted dark:hover:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary rounded-full transition-all duration-200"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-border-color dark:border-dark-border-color">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted dark:text-dark-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-0 rounded-xl bg-bg-secondary dark:bg-dark-bg-primary text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent shadow-sm transition-all duration-200"
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface dark:bg-dark-surface">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-accent/10 to-accent/20 dark:from-dark-accent/20 dark:to-dark-accent/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaKeyboard className="w-8 h-8 text-accent dark:text-dark-accent" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-3">
                No shortcuts found
              </h3>
              <p className="text-text-secondary dark:text-dark-text-secondary mb-6 max-w-md mx-auto">
                Try adjusting your search terms or browse all categories
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-accent hover:bg-accent-hover dark:bg-dark-accent dark:hover:bg-dark-accent-hover text-white rounded-xl font-medium transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredShortcuts.map((group) => (
                <div key={group.category} className="bg-surface dark:bg-dark-surface rounded-xl border border-border-color dark:border-dark-border-color overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleCategory(group.category)}
                    className="w-full p-6 text-left hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                        {group.title}
                      </h3>
                      <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">
                        {group.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted dark:text-dark-text-muted bg-bg-secondary dark:bg-dark-bg-secondary px-2 py-1 rounded-full">
                        {group.shortcuts.length}
                      </span>
                      {expandedCategories.has(group.category) ? (
                        <FaChevronUp className="w-4 h-4 text-text-muted dark:text-dark-text-muted" />
                      ) : (
                        <FaChevronDown className="w-4 h-4 text-text-muted dark:text-dark-text-muted" />
                      )}
                    </div>
                  </button>
                  
                  {expandedCategories.has(group.category) && (
                    <div className="border-t border-border-color dark:border-dark-border-color">
                      <div className="p-6 space-y-4">
                        {group.shortcuts.map((shortcut) => (
                          <div key={shortcut.id} className="flex items-center justify-between py-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                                {shortcut.description}
                              </p>
                            </div>
                            <div className="ml-4">
                              <kbd className="px-3 py-1 bg-bg-secondary dark:bg-dark-bg-secondary text-text-secondary dark:text-dark-text-secondary text-sm font-mono rounded-lg border border-border-color dark:border-dark-border-color">
                                {formatShortcut(shortcut)}
                              </kbd>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-color dark:border-dark-border-color bg-bg-secondary dark:bg-dark-bg-secondary rounded-b-2xl">
          <div className="flex items-center justify-center">
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
              Press <kbd className="px-2 py-1 bg-surface dark:bg-dark-surface text-text-secondary dark:text-dark-text-secondary text-xs font-mono rounded border border-border-color dark:border-dark-border-color">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;