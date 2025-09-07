import { KeyboardShortcut } from '../types/keyboardShortcuts';

// Enhanced shortcuts that integrate with existing functionality
export const createEnhancedShortcuts = (handlers: {
  // Navigation
  toggleSidebar: () => void;
  focusSearch: () => void;
  nextNote: () => void;
  previousNote: () => void;
  goToTop: () => void;
  goToBottom: () => void;
  
  // File Operations
  newNote: () => void;
  duplicateNote: () => void;
  deleteNote: () => void;
  saveNote: () => void;
  exportNote: () => void;
  importNotes: () => void;
  
  // View & Display
  togglePreview: () => void;
  toggleEditor: () => void;
  toggleSplitView: () => void;
  toggleFullscreen: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  
  // AI Features
  summarizeNote: () => void;
  improveText: () => void;
  fixGrammar: () => void;
  shortenText: () => void;
  expandText: () => void;
  generateTitle: () => void;
  suggestTags: () => void;
  
  // Search & Find
  findInNote: () => void;
  findAndReplace: () => void;
  findNext: () => void;
  findPrevious: () => void;
  
  // Help & Info
  showShortcuts: () => void;
  showCommandPalette: () => void;
  showVersionHistory: () => void;
  toggleTheme: () => void;
}): KeyboardShortcut[] => {
  return [
    // Navigation Shortcuts
    {
      id: 'toggle-sidebar',
      key: 'b',
      ctrlKey: true,
      description: 'Toggle Sidebar',
      category: 'navigation',
      action: handlers.toggleSidebar,
      global: true
    },
    {
      id: 'focus-search',
      key: 'f',
      ctrlKey: true,
      description: 'Focus Search',
      category: 'navigation',
      action: handlers.focusSearch,
      global: true
    },
    {
      id: 'next-note',
      key: 'ArrowDown',
      ctrlKey: true,
      description: 'Next Note',
      category: 'navigation',
      action: handlers.nextNote,
      global: true
    },
    {
      id: 'previous-note',
      key: 'ArrowUp',
      ctrlKey: true,
      description: 'Previous Note',
      category: 'navigation',
      action: handlers.previousNote,
      global: true
    },
    {
      id: 'go-to-top',
      key: 'Home',
      ctrlKey: true,
      description: 'Go to Top of Note',
      category: 'navigation',
      action: handlers.goToTop,
      global: false
    },
    {
      id: 'go-to-bottom',
      key: 'End',
      ctrlKey: true,
      description: 'Go to Bottom of Note',
      category: 'navigation',
      action: handlers.goToBottom,
      global: false
    },

    // File Operations
    {
      id: 'new-note',
      key: 'n',
      ctrlKey: true,
      description: 'New Note',
      category: 'file',
      action: handlers.newNote,
      global: true
    },
    {
      id: 'duplicate-note',
      key: 'd',
      ctrlKey: true,
      shiftKey: true,
      description: 'Duplicate Note',
      category: 'file',
      action: handlers.duplicateNote,
      global: true
    },
    {
      id: 'delete-note',
      key: 'Delete',
      ctrlKey: true,
      description: 'Delete Note',
      category: 'file',
      action: handlers.deleteNote,
      global: true
    },
    {
      id: 'save-note',
      key: 's',
      ctrlKey: true,
      description: 'Save Note',
      category: 'file',
      action: handlers.saveNote,
      global: true
    },
    {
      id: 'export-note',
      key: 'e',
      ctrlKey: true,
      shiftKey: true,
      description: 'Export Note',
      category: 'file',
      action: handlers.exportNote,
      global: true
    },
    {
      id: 'import-notes',
      key: 'i',
      ctrlKey: true,
      shiftKey: true,
      description: 'Import Notes',
      category: 'file',
      action: handlers.importNotes,
      global: true
    },

    // View & Display
    {
      id: 'toggle-preview',
      key: 'p',
      ctrlKey: true,
      description: 'Toggle Preview',
      category: 'view',
      action: handlers.togglePreview,
      global: true
    },
    {
      id: 'toggle-editor',
      key: 'e',
      ctrlKey: true,
      description: 'Toggle Editor',
      category: 'view',
      action: handlers.toggleEditor,
      global: true
    },
    {
      id: 'toggle-split-view',
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      description: 'Toggle Split View',
      category: 'view',
      action: handlers.toggleSplitView,
      global: true
    },
    {
      id: 'toggle-fullscreen',
      key: 'f',
      ctrlKey: true,
      shiftKey: true,
      description: 'Toggle Fullscreen',
      category: 'view',
      action: handlers.toggleFullscreen,
      global: true
    },
    {
      id: 'zoom-in',
      key: '=',
      ctrlKey: true,
      description: 'Zoom In',
      category: 'view',
      action: handlers.zoomIn,
      global: true
    },
    {
      id: 'zoom-out',
      key: '-',
      ctrlKey: true,
      description: 'Zoom Out',
      category: 'view',
      action: handlers.zoomOut,
      global: true
    },
    {
      id: 'reset-zoom',
      key: '0',
      ctrlKey: true,
      description: 'Reset Zoom',
      category: 'view',
      action: handlers.resetZoom,
      global: true
    },

    // AI Features
    {
      id: 'summarize-note',
      key: 's',
      ctrlKey: true,
      altKey: true,
      description: 'Summarize Note',
      category: 'ai',
      action: handlers.summarizeNote,
      global: true
    },
    {
      id: 'improve-text',
      key: 'j',
      ctrlKey: true,
      altKey: true,
      description: 'Improve Selected Text',
      category: 'ai',
      action: handlers.improveText,
      global: false
    },
    {
      id: 'fix-grammar',
      key: 'f',
      ctrlKey: true,
      altKey: true,
      description: 'Fix Grammar',
      category: 'ai',
      action: handlers.fixGrammar,
      global: false
    },
    {
      id: 'shorten-text',
      key: 'q',
      ctrlKey: true,
      altKey: true,
      description: 'Shorten Text',
      category: 'ai',
      action: handlers.shortenText,
      global: false
    },
    {
      id: 'expand-text',
      key: 'w',
      ctrlKey: true,
      altKey: true,
      description: 'Expand Text',
      category: 'ai',
      action: handlers.expandText,
      global: false
    },
    {
      id: 'generate-title',
      key: 'r',
      ctrlKey: true,
      altKey: true,
      description: 'Generate Title',
      category: 'ai',
      action: handlers.generateTitle,
      global: true
    },
    {
      id: 'suggest-tags',
      key: 'y',
      ctrlKey: true,
      altKey: true,
      description: 'Suggest Tags',
      category: 'ai',
      action: handlers.suggestTags,
      global: true
    },

    // Search & Find
    {
      id: 'find-in-note',
      key: 'f',
      ctrlKey: true,
      description: 'Find in Note',
      category: 'search',
      action: handlers.findInNote,
      global: false
    },
    {
      id: 'find-and-replace',
      key: 'h',
      ctrlKey: true,
      description: 'Find and Replace',
      category: 'search',
      action: handlers.findAndReplace,
      global: false
    },
    {
      id: 'find-next',
      key: 'g',
      ctrlKey: true,
      description: 'Find Next',
      category: 'search',
      action: handlers.findNext,
      global: false
    },
    {
      id: 'find-previous',
      key: 'g',
      ctrlKey: true,
      shiftKey: true,
      description: 'Find Previous',
      category: 'search',
      action: handlers.findPrevious,
      global: false
    },

    // Help & Info
    {
      id: 'show-shortcuts',
      key: '?',
      ctrlKey: true,
      description: 'Show Keyboard Shortcuts',
      category: 'help',
      action: handlers.showShortcuts,
      global: true
    },
    {
      id: 'show-command-palette',
      key: 'k',
      ctrlKey: true,
      description: 'Show Command Palette',
      category: 'help',
      action: handlers.showCommandPalette,
      global: true
    },
    {
      id: 'show-version-history',
      key: 'h',
      ctrlKey: true,
      description: 'Show Version History',
      category: 'help',
      action: handlers.showVersionHistory,
      global: true
    },
    {
      id: 'toggle-theme',
      key: ';',
      ctrlKey: true,
      description: 'Toggle Theme',
      category: 'help',
      action: handlers.toggleTheme,
      global: true
    }
  ];
};
