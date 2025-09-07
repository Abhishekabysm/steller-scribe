import { useEffect, useCallback, useRef } from 'react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { createEnhancedShortcuts } from '../services/enhancedShortcuts';
import { KeyboardShortcut } from '../types/keyboardShortcuts';

interface UseEnhancedKeyboardShortcutsProps {
  // Navigation handlers
  toggleSidebar?: () => void;
  focusSearch?: () => void;
  nextNote?: () => void;
  previousNote?: () => void;
  goToTop?: () => void;
  goToBottom?: () => void;
  
  // File operation handlers
  newNote?: () => void;
  duplicateNote?: () => void;
  deleteNote?: () => void;
  saveNote?: () => void;
  exportNote?: () => void;
  importNotes?: () => void;
  
  // View handlers
  togglePreview?: () => void;
  toggleEditor?: () => void;
  toggleSplitView?: () => void;
  toggleFullscreen?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  resetZoom?: () => void;
  
  // AI handlers
  summarizeNote?: () => void;
  improveText?: () => void;
  fixGrammar?: () => void;
  shortenText?: () => void;
  expandText?: () => void;
  generateTitle?: () => void;
  suggestTags?: () => void;
  
  // Search handlers
  findInNote?: () => void;
  findAndReplace?: () => void;
  findNext?: () => void;
  findPrevious?: () => void;
  
  // Help handlers
  showShortcuts?: () => void;
  showCommandPalette?: () => void;
  showVersionHistory?: () => void;
  toggleTheme?: () => void;
  
  // Options
  enableGlobalShortcuts?: boolean;
  enableEditorShortcuts?: boolean;
  disabled?: boolean;
  targetElement?: HTMLElement | null;
}

export const useEnhancedKeyboardShortcuts = (props: UseEnhancedKeyboardShortcutsProps = {}) => {
  const {
    enableGlobalShortcuts = true,
    enableEditorShortcuts = true,
    disabled = false,
    targetElement = null,
    ...handlers
  } = props;

  const shortcutsRef = useRef<KeyboardShortcut[]>([]);
  const { registerShortcut, unregisterShortcut, getAllShortcuts, formatShortcut, isShortcutRegistered } = useKeyboardShortcuts({
    enableGlobalShortcuts,
    enableEditorShortcuts,
    disabled,
    targetElement
  });

  // Create enhanced shortcuts
  const enhancedShortcuts = createEnhancedShortcuts({
    toggleSidebar: handlers.toggleSidebar || (() => {}),
    focusSearch: handlers.focusSearch || (() => {}),
    nextNote: handlers.nextNote || (() => {}),
    previousNote: handlers.previousNote || (() => {}),
    goToTop: handlers.goToTop || (() => {}),
    goToBottom: handlers.goToBottom || (() => {}),
    newNote: handlers.newNote || (() => {}),
    duplicateNote: handlers.duplicateNote || (() => {}),
    deleteNote: handlers.deleteNote || (() => {}),
    saveNote: handlers.saveNote || (() => {}),
    exportNote: handlers.exportNote || (() => {}),
    importNotes: handlers.importNotes || (() => {}),
    togglePreview: handlers.togglePreview || (() => {}),
    toggleEditor: handlers.toggleEditor || (() => {}),
    toggleSplitView: handlers.toggleSplitView || (() => {}),
    toggleFullscreen: handlers.toggleFullscreen || (() => {}),
    zoomIn: handlers.zoomIn || (() => {}),
    zoomOut: handlers.zoomOut || (() => {}),
    resetZoom: handlers.resetZoom || (() => {}),
    summarizeNote: handlers.summarizeNote || (() => {}),
    improveText: handlers.improveText || (() => {}),
    fixGrammar: handlers.fixGrammar || (() => {}),
    shortenText: handlers.shortenText || (() => {}),
    expandText: handlers.expandText || (() => {}),
    generateTitle: handlers.generateTitle || (() => {}),
    suggestTags: handlers.suggestTags || (() => {}),
    findInNote: handlers.findInNote || (() => {}),
    findAndReplace: handlers.findAndReplace || (() => {}),
    findNext: handlers.findNext || (() => {}),
    findPrevious: handlers.findPrevious || (() => {}),
    showShortcuts: handlers.showShortcuts || (() => {}),
    showCommandPalette: handlers.showCommandPalette || (() => {}),
    showVersionHistory: handlers.showVersionHistory || (() => {}),
    toggleTheme: handlers.toggleTheme || (() => {})
  });

  // Register shortcuts
  useEffect(() => {
    if (disabled) return;

    // Clear existing shortcuts
    shortcutsRef.current.forEach(shortcut => {
      unregisterShortcut(shortcut.id);
    });
    shortcutsRef.current = [];

    // Register new shortcuts
    enhancedShortcuts.forEach(shortcut => {
      registerShortcut(shortcut);
      shortcutsRef.current.push(shortcut);
    });

    return () => {
      shortcutsRef.current.forEach(shortcut => {
        unregisterShortcut(shortcut.id);
      });
    };
  }, [disabled, registerShortcut, unregisterShortcut, enhancedShortcuts]);

  // Get shortcuts by category
  const getShortcutsByCategory = useCallback((category: string) => {
    return shortcutsRef.current.filter(shortcut => shortcut.category === category);
  }, []);

  // Get shortcuts by scope
  const getGlobalShortcuts = useCallback(() => {
    return shortcutsRef.current.filter(shortcut => shortcut.global);
  }, []);

  const getEditorShortcuts = useCallback(() => {
    return shortcutsRef.current.filter(shortcut => !shortcut.global);
  }, []);

  // Check if a specific shortcut is available
  const hasShortcut = useCallback((shortcutId: string) => {
    return shortcutsRef.current.some(shortcut => shortcut.id === shortcutId);
  }, []);

  // Get shortcut by ID
  const getShortcut = useCallback((shortcutId: string) => {
    return shortcutsRef.current.find(shortcut => shortcut.id === shortcutId);
  }, []);

  // Get all available shortcuts for display
  const getAvailableShortcuts = useCallback(() => {
    return getAllShortcuts();
  }, [getAllShortcuts]);

  return {
    // Core functionality
    registerShortcut,
    unregisterShortcut,
    getAllShortcuts: getAvailableShortcuts,
    formatShortcut,
    isShortcutRegistered,
    
    // Enhanced functionality
    getShortcutsByCategory,
    getGlobalShortcuts,
    getEditorShortcuts,
    hasShortcut,
    getShortcut,
    
    // Shortcut counts
    totalShortcuts: shortcutsRef.current.length,
    globalShortcutsCount: shortcutsRef.current.filter(s => s.global).length,
    editorShortcutsCount: shortcutsRef.current.filter(s => !s.global).length
  };
};
