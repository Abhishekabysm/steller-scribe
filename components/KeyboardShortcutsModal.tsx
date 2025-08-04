import React from 'react';
import { FaXmark, FaKeyboard, FaPlus, FaBold, FaItalic, FaUnderline } from 'react-icons/fa6';
import { FaSearch, FaSun, FaMoon, FaStickyNote } from 'react-icons/fa';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItemProps {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
}

interface ShortcutCategoryProps {
  title: string;
  icon: React.ReactNode;
  shortcuts: Array<{
    keys: string[];
    description: string;
    icon?: React.ReactNode;
  }>;
}

const KeyboardKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-mono rounded border border-gray-300 dark:border-gray-600 shadow-sm">
    {children}
  </kbd>
);

const ShortcutItem: React.FC<ShortcutItemProps> = ({ keys, description, icon }) => (
  <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors group">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {icon && (
        <div className="flex-shrink-0 w-5 h-5 text-text-muted dark:text-dark-text-muted group-hover:text-text-primary dark:group-hover:text-dark-text-primary transition-colors">
          {icon}
        </div>
      )}
      <span className="text-sm text-text-secondary dark:text-dark-text-secondary group-hover:text-text-primary dark:group-hover:text-dark-text-primary transition-colors truncate">
        {description}
      </span>
    </div>
    <div className="flex items-center gap-1 flex-shrink-0 ml-4">
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && (
            <span className="text-xs text-text-muted dark:text-dark-text-muted mx-1">+</span>
          )}
          <KeyboardKey>{key}</KeyboardKey>
        </React.Fragment>
      ))}
    </div>
  </div>
);

const ShortcutCategory: React.FC<ShortcutCategoryProps> = ({ title, icon, shortcuts }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 pb-2 border-b border-border-color dark:border-dark-border-color">
      <div className="w-5 h-5 text-accent dark:text-dark-accent">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
        {title}
      </h3>
    </div>
    <div className="space-y-1">
      {shortcuts.map((shortcut, index) => (
        <ShortcutItem
          key={index}
          keys={shortcut.keys}
          description={shortcut.description}
          icon={shortcut.icon}
        />
      ))}
    </div>
  </div>
);

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutCategories = [
    {
      title: "General",
      icon: <FaKeyboard />,
      shortcuts: [
        { keys: ["Ctrl", "K"], description: "Open command palette", icon: <FaSearch /> },
        { keys: ["Ctrl", "?"], description: "Show keyboard shortcuts", icon: <FaKeyboard /> },
        { keys: ["Ctrl", "/"], description: "Show keyboard shortcuts", icon: <FaKeyboard /> },
        { keys: ["Esc"], description: "Close modal or panel" },
      ]
    },
    {
      title: "Notes",
      icon: <FaPlus />,
      shortcuts: [
        { keys: ["Ctrl", "N"], description: "Create new note", icon: <FaPlus /> },
        { keys: ["Ctrl", "S"], description: "Generate AI summary", icon: <FaStickyNote /> },
        { keys: ["↑", "↓"], description: "Navigate between notes" },
        { keys: ["Enter"], description: "Select note" },
      ]
    },
    {
      title: "Editing",
      icon: <FaBold />,
      shortcuts: [
        { keys: ["Ctrl", "B"], description: "Bold text", icon: <FaBold /> },
        { keys: ["Ctrl", "I"], description: "Italic text", icon: <FaItalic /> },
        { keys: ["Ctrl", "U"], description: "Underline text", icon: <FaUnderline /> },
        { keys: ["Ctrl", "Z"], description: "Undo" },
        { keys: ["Ctrl", "Y"], description: "Redo" },
        { keys: ["Tab"], description: "Accept suggestion" },
      ]
    },
    {
      title: "Interface",
      icon: <FaSun />,
      shortcuts: [
        { keys: ["Ctrl", "T"], description: "Toggle theme", icon: <FaSun /> },
      ]
    }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div 
        className="bg-surface dark:bg-dark-surface rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] border border-border-color dark:border-dark-border-color animate-slide-in flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-color dark:border-dark-border-color bg-gradient-to-r from-accent/10 to-accent/5 dark:from-dark-accent/10 dark:to-dark-accent/5 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 dark:bg-dark-accent/10 rounded-lg">
              <FaKeyboard className="w-5 h-5 text-accent dark:text-dark-accent" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-lg sm:text-xl font-semibold text-text-primary dark:text-dark-text-primary">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-text-muted dark:text-dark-text-muted">
                Speed up your workflow with these shortcuts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
            title="Close shortcuts panel"
          >
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {shortcutCategories.map((category, index) => (
              <ShortcutCategory
                key={index}
                title={category.title}
                icon={category.icon}
                shortcuts={category.shortcuts}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-border-color dark:border-dark-border-color bg-bg-secondary/50 dark:bg-dark-bg-secondary/50 rounded-b-lg">
          <div className="flex items-center gap-2 text-text-muted dark:text-dark-text-muted text-sm">
            <FaKeyboard className="w-4 h-4" />
            <span className="hidden sm:inline">Press</span>
            <KeyboardKey>Ctrl</KeyboardKey>
            <span className="text-xs">+</span>
            <KeyboardKey>/</KeyboardKey>
            <span className="hidden sm:inline">to open this panel</span>
            <span className="sm:hidden">to reopen</span>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;