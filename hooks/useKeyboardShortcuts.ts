import { useEffect, useCallback, useRef } from 'react';
import { keyboardShortcutsService } from '../services/keyboardShortcutsService';
import { KeyboardShortcut } from '../types/keyboardShortcuts';

interface UseKeyboardShortcutsOptions {
  enableGlobalShortcuts?: boolean;
  enableEditorShortcuts?: boolean;
  disabled?: boolean;
  targetElement?: HTMLElement | null;
}

export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions = {}) => {
  const {
    enableGlobalShortcuts = true,
    enableEditorShortcuts = true,
    disabled = false,
    targetElement = null
  } = options;

  const shortcutsRef = useRef<KeyboardShortcut[]>([]);

  // Register a shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    if (disabled) return;
    
    keyboardShortcutsService.registerShortcut(shortcut);
    shortcutsRef.current.push(shortcut);
  }, [disabled]);

  // Unregister a shortcut
  const unregisterShortcut = useCallback((shortcutId: string) => {
    keyboardShortcutsService.unregisterShortcut(shortcutId);
    shortcutsRef.current = shortcutsRef.current.filter(s => s.id !== shortcutId);
  }, []);

  // Handle keydown events
  const handleKeyDown = useCallback((event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    if (disabled) return;

    // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
    const target = keyboardEvent.target as HTMLElement;
    if (target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    )) {
      // Only allow certain shortcuts in input fields
      const allowedInInputs = ['Escape', 'Tab'];
      // Allow AI shortcuts (Ctrl+Alt combinations) in textareas
      const isAiShortcut = keyboardEvent.ctrlKey && keyboardEvent.altKey;
      if (!allowedInInputs.includes(keyboardEvent.key) && !isAiShortcut) {
        return;
      }
    }

    const shortcut = keyboardShortcutsService.getShortcut(
      keyboardEvent.key,
      keyboardEvent.ctrlKey,
      keyboardEvent.shiftKey,
      keyboardEvent.altKey,
      keyboardEvent.metaKey
    );

    // Debug logging for AI shortcuts
    if (keyboardEvent.ctrlKey && keyboardEvent.altKey) {
      console.log('AI shortcut attempt:', {
        key: keyboardEvent.key,
        ctrlKey: keyboardEvent.ctrlKey,
        altKey: keyboardEvent.altKey,
        target: target.tagName
      });
    }

    if (shortcut) {
      // Check if it's a global shortcut or editor shortcut
      const isGlobal = shortcut.global;
      const shouldExecute = (isGlobal && enableGlobalShortcuts) || 
                           (!isGlobal && enableEditorShortcuts);

      if (shouldExecute) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        
        try {
          console.log('Executing shortcut:', shortcut.id, shortcut.key, shortcut.ctrlKey, shortcut.altKey);
          shortcut.action();
        } catch (error) {
          console.error('Error executing keyboard shortcut:', error);
        }
      } else {
        console.log('Shortcut found but not executed due to scope:', shortcut.id, { isGlobal, enableGlobalShortcuts, enableEditorShortcuts });
      }
    } else {
      console.log('No shortcut found for:', {
        key: keyboardEvent.key,
        ctrlKey: keyboardEvent.ctrlKey,
        shiftKey: keyboardEvent.shiftKey,
        altKey: keyboardEvent.altKey,
        metaKey: keyboardEvent.metaKey
      });
    }
  }, [disabled, enableGlobalShortcuts, enableEditorShortcuts]);

  // Set up event listeners
  useEffect(() => {
    if (disabled) return;

    const target = targetElement || document;
    target.addEventListener('keydown', handleKeyDown);

    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, disabled, targetElement]);

  // Cleanup shortcuts on unmount
  useEffect(() => {
    return () => {
      shortcutsRef.current.forEach(shortcut => {
        keyboardShortcutsService.unregisterShortcut(shortcut.id);
      });
    };
  }, []);

  // Get all registered shortcuts
  const getAllShortcuts = useCallback(() => {
    return keyboardShortcutsService.getAllShortcuts();
  }, []);

  // Format shortcut for display
  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    return keyboardShortcutsService.formatShortcut(shortcut);
  }, []);

  // Check if shortcut is registered
  const isShortcutRegistered = useCallback((
    key: string, 
    ctrlKey: boolean, 
    shiftKey: boolean, 
    altKey: boolean, 
    metaKey: boolean
  ) => {
    return keyboardShortcutsService.isShortcutRegistered(key, ctrlKey, shiftKey, altKey, metaKey);
  }, []);

  return {
    registerShortcut,
    unregisterShortcut,
    getAllShortcuts,
    formatShortcut,
    isShortcutRegistered
  };
};
