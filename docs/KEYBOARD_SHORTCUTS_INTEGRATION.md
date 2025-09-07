# Enhanced Keyboard Shortcuts Integration Guide

## Overview

This guide shows how to integrate the enhanced keyboard shortcuts system with your existing note editor. The system builds upon your current shortcuts and adds power-user features.

## What You Already Have

Your existing keyboard shortcuts system includes:

### Global Shortcuts (App.tsx)
- `Ctrl/Cmd + K` - Toggle Command Palette
- `Ctrl/Cmd + ?` - Toggle Keyboard Shortcuts Help
- `Ctrl/Cmd + /` - Toggle Keyboard Shortcuts Help  
- `Ctrl/Cmd + H` - Toggle Version History
- `Ctrl/Cmd + ;` - Toggle Theme

### Editor Shortcuts (NoteEditor.tsx)
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + B` - Bold text (`**text**`)
- `Ctrl/Cmd + I` - Italic text (`_text_`)
- `Ctrl/Cmd + U` - Underline text (`<u>text</u>`)
- `Ctrl/Cmd + K` - Link text (`[text](url)`)
- `Ctrl/Cmd + L` - Numbered list
- `Ctrl/Cmd + M` - Checkbox list
- Text wrapping shortcuts for quotes, parentheses, brackets, etc.

## New Enhanced Features

### 1. Comprehensive Shortcut Registry
- Centralized shortcut management
- Category-based organization
- Global vs Editor scope separation
- Easy registration/unregistration

### 2. Enhanced UI Components
- **KeyboardShortcutsModal**: Beautiful modal with search and categories
- **KeyboardShortcutHints**: Floating hints for quick reference
- **ShortcutIndicator**: Visual shortcut indicators in UI

### 3. Power User Shortcuts
- Navigation shortcuts (next/previous note, go to top/bottom)
- File operations (duplicate, export, import)
- View controls (toggle modes, zoom, fullscreen)
- AI features (improve text, fix grammar, generate title)
- Search & find (find in note, find & replace)

## Integration Steps

### Step 1: Update Your App Component

```tsx
import { useEnhancedKeyboardShortcuts } from './hooks/useEnhancedKeyboardShortcuts';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';

const AppContent: React.FC = () => {
  // ... your existing state and handlers

  // Enhanced keyboard shortcuts
  const { getAllShortcuts } = useEnhancedKeyboardShortcuts({
    // Navigation handlers
    toggleSidebar: () => setIsSidebarOpen(prev => !prev),
    focusSearch: () => {
      // Focus your search input
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      searchInput?.focus();
    },
    nextNote: () => {
      // Navigate to next note logic
    },
    previousNote: () => {
      // Navigate to previous note logic
    },
    goToTop: () => {
      // Scroll to top of editor
    },
    goToBottom: () => {
      // Scroll to bottom of editor
    },

    // File operation handlers
    newNote: handleAddNote,
    duplicateNote: () => {
      // Duplicate current note logic
    },
    deleteNote: () => {
      // Delete current note logic
    },
    saveNote: () => {
      // Save current note logic
    },
    exportNote: () => {
      // Export current note logic
    },
    importNotes: () => setIsImportModalOpen(true),

    // View handlers
    togglePreview: () => setViewMode(prev => prev === 'preview' ? 'split' : 'preview'),
    toggleEditor: () => setViewMode(prev => prev === 'editor' ? 'split' : 'editor'),
    toggleSplitView: () => setViewMode('split'),
    toggleFullscreen: () => {
      // Toggle fullscreen logic
    },
    zoomIn: () => {
      // Zoom in logic
    },
    zoomOut: () => {
      // Zoom out logic
    },
    resetZoom: () => {
      // Reset zoom logic
    },

    // AI handlers
    summarizeNote: handleSummarize,
    improveText: () => {
      // Improve selected text logic
    },
    fixGrammar: () => {
      // Fix grammar logic
    },
    shortenText: () => {
      // Shorten text logic
    },
    expandText: () => {
      // Expand text logic
    },
    generateTitle: () => {
      // Generate title logic
    },
    suggestTags: () => {
      // Suggest tags logic
    },

    // Search handlers
    findInNote: () => {
      // Find in note logic
    },
    findAndReplace: () => {
      // Find and replace logic
    },
    findNext: () => {
      // Find next logic
    },
    findPrevious: () => {
      // Find previous logic
    },

    // Help handlers
    showShortcuts: () => setIsKeyboardShortcutsOpen(true),
    showCommandPalette: () => setIsCommandPaletteOpen(true),
    showVersionHistory: () => setIsVersionHistoryOpen(true),
    toggleTheme: toggleTheme
  });

  // ... rest of your component

  return (
    <div className="app">
      {/* Your existing JSX */}
      
      {/* Enhanced Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
        shortcuts={getAllShortcuts()}
      />
    </div>
  );
};
```

### Step 2: Add Shortcut Indicators to UI

```tsx
import ShortcutIndicator from './components/ShortcutIndicator';

// In your toolbar or buttons
<div className="toolbar">
  <button onClick={handleNewNote}>
    New Note
    <ShortcutIndicator shortcut="Ctrl + N" size="sm" />
  </button>
  
  <button onClick={handleSummarize}>
    Summarize
    <ShortcutIndicator shortcut="Ctrl + Alt + S" size="sm" />
  </button>
</div>
```

### Step 3: Add Floating Hints

```tsx
import KeyboardShortcutHints from './components/KeyboardShortcutHints';

// In your component
const [showHints, setShowHints] = useState(false);

// Show hints when user first opens the app or after inactivity
useEffect(() => {
  const timer = setTimeout(() => {
    setShowHints(true);
  }, 5000); // Show after 5 seconds

  return () => clearTimeout(timer);
}, []);

// In your JSX
<KeyboardShortcutHints
  shortcuts={getGlobalShortcuts().slice(0, 5)}
  isVisible={showHints}
  onClose={() => setShowHints(false)}
/>
```

## Available Shortcuts

### Navigation (Ctrl + ...)
- `B` - Toggle Sidebar
- `F` - Focus Search
- `↓` - Next Note
- `↑` - Previous Note
- `Home` - Go to Top of Note
- `End` - Go to Bottom of Note

### File Operations (Ctrl + ...)
- `N` - New Note
- `Shift + D` - Duplicate Note
- `Delete` - Delete Note
- `S` - Save Note
- `Shift + E` - Export Note
- `Shift + I` - Import Notes

### View & Display (Ctrl + ...)
- `P` - Toggle Preview
- `E` - Toggle Editor
- `Shift + S` - Toggle Split View
- `Shift + F` - Toggle Fullscreen
- `=` - Zoom In
- `-` - Zoom Out
- `0` - Reset Zoom

### AI Features (Ctrl + Alt + ...)
- `S` - Summarize Note
- `I` - Improve Selected Text
- `G` - Fix Grammar
- `H` - Shorten Text
- `X` - Expand Text
- `T` - Generate Title
- `Shift + T` - Suggest Tags

### Search & Find (Ctrl + ...)
- `F` - Find in Note
- `H` - Find and Replace
- `G` - Find Next
- `Shift + G` - Find Previous

### Help & Info (Ctrl + ...)
- `?` - Show Keyboard Shortcuts
- `K` - Show Command Palette
- `H` - Show Version History
- `;` - Toggle Theme

## Customization

### Adding Custom Shortcuts

```tsx
const { registerShortcut } = useEnhancedKeyboardShortcuts({...});

// Register a custom shortcut
registerShortcut({
  id: 'custom-shortcut',
  key: 'q',
  ctrlKey: true,
  description: 'Custom Action',
  category: 'custom',
  action: () => {
    // Your custom action
  },
  global: true
});
```

### Modifying Existing Shortcuts

```tsx
// Override default behavior
const customHandlers = {
  ...defaultHandlers,
  newNote: () => {
    // Your custom new note logic
    console.log('Custom new note action');
  }
};
```

## Best Practices

1. **Consistent Key Combinations**: Use standard combinations (Ctrl/Cmd + letter)
2. **Avoid Conflicts**: Check for existing shortcuts before adding new ones
3. **User Feedback**: Show visual feedback when shortcuts are triggered
4. **Accessibility**: Ensure shortcuts are discoverable and documented
5. **Testing**: Test shortcuts across different browsers and devices

## Troubleshooting

### Common Issues

1. **Shortcuts Not Working**: Check if the target element is focused
2. **Conflicts**: Use `isShortcutRegistered()` to check for conflicts
3. **Performance**: Avoid heavy operations in shortcut actions
4. **Memory Leaks**: Always unregister shortcuts on component unmount

### Debug Mode

```tsx
// Enable debug logging
const { getAllShortcuts } = useEnhancedKeyboardShortcuts({
  ...handlers,
  debug: true // Add this to see shortcut registration logs
});
```

## Conclusion

The enhanced keyboard shortcuts system provides a powerful foundation for power users while maintaining compatibility with your existing shortcuts. The modular design allows for easy customization and extension as your application grows.
