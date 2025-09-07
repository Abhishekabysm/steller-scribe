import { KeyboardShortcut, ShortcutGroup, ShortcutCategory, KeyboardShortcutConfig } from '../types/keyboardShortcuts';

class KeyboardShortcutsService {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private globalShortcuts: Map<string, KeyboardShortcut> = new Map();
  private config: KeyboardShortcutConfig = {
    enableGlobalShortcuts: true,
    enableEditorShortcuts: true,
    showHints: true,
    customShortcuts: {}
  };

  // Register a keyboard shortcut
  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    
    if (shortcut.global) {
      this.globalShortcuts.set(key, shortcut);
    } else {
      this.shortcuts.set(key, shortcut);
    }
  }

  // Unregister a keyboard shortcut
  unregisterShortcut(shortcutId: string): void {
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (shortcut.id === shortcutId) {
        this.shortcuts.delete(key);
        break;
      }
    }
    for (const [key, shortcut] of this.globalShortcuts.entries()) {
      if (shortcut.id === shortcutId) {
        this.globalShortcuts.delete(key);
        break;
      }
    }
  }

  // Get shortcut by key combination
  getShortcut(key: string, ctrlKey: boolean, shiftKey: boolean, altKey: boolean, metaKey: boolean): KeyboardShortcut | undefined {
    const shortcutKey = this.getShortcutKey({ key, ctrlKey, shiftKey, altKey, metaKey } as KeyboardShortcut);
    return this.shortcuts.get(shortcutKey) || this.globalShortcuts.get(shortcutKey);
  }

  // Get all shortcuts grouped by category
  getAllShortcuts(): ShortcutGroup[] {
    const groups: Map<ShortcutCategory, KeyboardShortcut[]> = new Map();
    
    // Initialize categories
    const categories: ShortcutCategory[] = ['navigation', 'editing', 'formatting', 'ai', 'file', 'view', 'search', 'help'];
    categories.forEach(cat => groups.set(cat, []));

    // Add shortcuts to groups
    [...this.shortcuts.values(), ...this.globalShortcuts.values()].forEach(shortcut => {
      if (!shortcut.disabled) {
        const group = groups.get(shortcut.category);
        if (group) {
          group.push(shortcut);
        }
      }
    });

    // Convert to ShortcutGroup array
    return categories.map(category => ({
      category,
      title: this.getCategoryTitle(category),
      description: this.getCategoryDescription(category),
      shortcuts: groups.get(category) || []
    })).filter(group => group.shortcuts.length > 0);
  }

  // Get shortcut key string
  private getShortcutKey(shortcut: Pick<KeyboardShortcut, 'key' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>): string {
    const modifiers = [];
    if (shortcut.ctrlKey) modifiers.push('ctrl');
    if (shortcut.shiftKey) modifiers.push('shift');
    if (shortcut.altKey) modifiers.push('alt');
    if (shortcut.metaKey) modifiers.push('meta');
    
    return modifiers.length > 0 
      ? `${modifiers.join('+')}+${shortcut.key.toLowerCase()}`
      : shortcut.key.toLowerCase();
  }

  // Get category title
  private getCategoryTitle(category: ShortcutCategory): string {
    const titles: Record<ShortcutCategory, string> = {
      navigation: 'Navigation',
      editing: 'Editing',
      formatting: 'Formatting',
      ai: 'AI Features',
      file: 'File Operations',
      view: 'View & Display',
      search: 'Search & Find',
      help: 'Help & Info'
    };
    return titles[category];
  }

  // Get category description
  private getCategoryDescription(category: ShortcutCategory): string {
    const descriptions: Record<ShortcutCategory, string> = {
      navigation: 'Navigate through your notes and content',
      editing: 'Edit and manipulate text content',
      formatting: 'Format text and apply styling',
      ai: 'Access AI-powered features and tools',
      file: 'Manage files and documents',
      view: 'Control display and view options',
      search: 'Search and find content',
      help: 'Get help and access information'
    };
    return descriptions[category];
  }

  // Format shortcut for display
  formatShortcut(shortcut: KeyboardShortcut): string {
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
  }

  // Update configuration
  updateConfig(newConfig: Partial<KeyboardShortcutConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): KeyboardShortcutConfig {
    return { ...this.config };
  }

  // Clear all shortcuts
  clearAll(): void {
    this.shortcuts.clear();
    this.globalShortcuts.clear();
  }

  // Check if a key combination is already registered
  isShortcutRegistered(key: string, ctrlKey: boolean, shiftKey: boolean, altKey: boolean, metaKey: boolean): boolean {
    const shortcutKey = this.getShortcutKey({ key, ctrlKey, shiftKey, altKey, metaKey } as KeyboardShortcut);
    return this.shortcuts.has(shortcutKey) || this.globalShortcuts.has(shortcutKey);
  }
}

export const keyboardShortcutsService = new KeyboardShortcutsService();
