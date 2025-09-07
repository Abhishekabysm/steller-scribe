import React, { useState } from 'react';
import { useEnhancedKeyboardShortcuts } from '../hooks/useEnhancedKeyboardShortcuts';
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal';
import KeyboardShortcutHints from '../components/KeyboardShortcutHints';
import ShortcutIndicator from '../components/ShortcutIndicator';

// Example component showing how to integrate enhanced keyboard shortcuts
const EnhancedKeyboardShortcutsExample: React.FC = () => {
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showHints, setShowHints] = useState(false);

  // Enhanced keyboard shortcuts integration
  const {
    getAllShortcuts,
    getGlobalShortcuts,
    getEditorShortcuts,
    getShortcutsByCategory,
    formatShortcut,
    totalShortcuts,
    globalShortcutsCount,
    editorShortcutsCount
  } = useEnhancedKeyboardShortcuts({
    // Navigation handlers
    toggleSidebar: () => {
      console.log('Toggle sidebar');
      // Your existing toggle sidebar logic
    },
    focusSearch: () => {
      console.log('Focus search');
      // Focus search input
    },
    nextNote: () => {
      console.log('Next note');
      // Navigate to next note
    },
    previousNote: () => {
      console.log('Previous note');
      // Navigate to previous note
    },
    goToTop: () => {
      console.log('Go to top');
      // Scroll to top of editor
    },
    goToBottom: () => {
      console.log('Go to bottom');
      // Scroll to bottom of editor
    },

    // File operation handlers
    newNote: () => {
      console.log('New note');
      // Your existing new note logic
    },
    duplicateNote: () => {
      console.log('Duplicate note');
      // Duplicate current note
    },
    deleteNote: () => {
      console.log('Delete note');
      // Delete current note
    },
    saveNote: () => {
      console.log('Save note');
      // Save current note
    },
    exportNote: () => {
      console.log('Export note');
      // Export current note
    },
    importNotes: () => {
      console.log('Import notes');
      // Open import modal
    },

    // View handlers
    togglePreview: () => {
      console.log('Toggle preview');
      // Toggle preview mode
    },
    toggleEditor: () => {
      console.log('Toggle editor');
      // Toggle editor mode
    },
    toggleSplitView: () => {
      console.log('Toggle split view');
      // Toggle split view mode
    },
    toggleFullscreen: () => {
      console.log('Toggle fullscreen');
      // Toggle fullscreen mode
    },
    zoomIn: () => {
      console.log('Zoom in');
      // Increase zoom level
    },
    zoomOut: () => {
      console.log('Zoom out');
      // Decrease zoom level
    },
    resetZoom: () => {
      console.log('Reset zoom');
      // Reset zoom to 100%
    },

    // AI handlers
    summarizeNote: () => {
      console.log('Summarize note');
      // Your existing summarize logic
    },
    improveText: () => {
      console.log('Improve text');
      // Improve selected text
    },
    fixGrammar: () => {
      console.log('Fix grammar');
      // Fix grammar of selected text
    },
    shortenText: () => {
      console.log('Shorten text');
      // Shorten selected text
    },
    expandText: () => {
      console.log('Expand text');
      // Expand selected text
    },
    generateTitle: () => {
      console.log('Generate title');
      // Generate title for note
    },
    suggestTags: () => {
      console.log('Suggest tags');
      // Suggest tags for note
    },

    // Search handlers
    findInNote: () => {
      console.log('Find in note');
      // Open find dialog
    },
    findAndReplace: () => {
      console.log('Find and replace');
      // Open find and replace dialog
    },
    findNext: () => {
      console.log('Find next');
      // Find next occurrence
    },
    findPrevious: () => {
      console.log('Find previous');
      // Find previous occurrence
    },

    // Help handlers
    showShortcuts: () => {
      setShowShortcutsModal(true);
    },
    showCommandPalette: () => {
      console.log('Show command palette');
      // Your existing command palette logic
    },
    showVersionHistory: () => {
      console.log('Show version history');
      // Your existing version history logic
    },
    toggleTheme: () => {
      console.log('Toggle theme');
      // Your existing theme toggle logic
    },

    // Options
    enableGlobalShortcuts: true,
    enableEditorShortcuts: true,
    disabled: false
  });

  const allShortcuts = getAllShortcuts();
  const globalShortcuts = getGlobalShortcuts();
  const editorShortcuts = getEditorShortcuts();

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
          Enhanced Keyboard Shortcuts
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
          Power user features for maximum productivity
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-8">
          <ShortcutIndicator shortcut="Ctrl + K" description="Command Palette" variant="primary" />
          <ShortcutIndicator shortcut="Ctrl + ?" description="Show Shortcuts" variant="secondary" />
          <ShortcutIndicator shortcut="Ctrl + B" description="Bold Text" variant="accent" />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-dark-border-color">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
            Total Shortcuts
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {totalShortcuts}
          </p>
        </div>
        
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-dark-border-color">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
            Global Shortcuts
          </h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {globalShortcutsCount}
          </p>
        </div>
        
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-dark-border-color">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
            Editor Shortcuts
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {editorShortcutsCount}
          </p>
        </div>
      </div>

      {/* Shortcut Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allShortcuts.map((group) => (
          <div key={group.category} className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-dark-border-color">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
              {group.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
              {group.description}
            </p>
            <div className="space-y-2">
              {group.shortcuts.slice(0, 3).map((shortcut) => (
                <div key={shortcut.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-dark-text-secondary">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-secondary font-mono rounded text-xs">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
              {group.shortcuts.length > 3 && (
                <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                  +{group.shortcuts.length - 3} more
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setShowShortcutsModal(true)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
        >
          View All Shortcuts
        </button>
        
        <button
          onClick={() => setShowHints(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
        >
          Show Hints
        </button>
      </div>

      {/* Modals */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        shortcuts={allShortcuts}
      />

      <KeyboardShortcutHints
        shortcuts={globalShortcuts.slice(0, 5)}
        isVisible={showHints}
        onClose={() => setShowHints(false)}
      />
    </div>
  );
};

export default EnhancedKeyboardShortcutsExample;
