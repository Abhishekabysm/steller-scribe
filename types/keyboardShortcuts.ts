export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  category: ShortcutCategory;
  action: () => void;
  disabled?: boolean;
  global?: boolean; // Whether it works globally or only in editor
}

export type ShortcutCategory = 
  | 'navigation'
  | 'editing'
  | 'formatting'
  | 'ai'
  | 'file'
  | 'view'
  | 'search'
  | 'help';

export interface ShortcutGroup {
  category: ShortcutCategory;
  title: string;
  description: string;
  shortcuts: KeyboardShortcut[];
}

export interface KeyboardShortcutConfig {
  enableGlobalShortcuts: boolean;
  enableEditorShortcuts: boolean;
  showHints: boolean;
  customShortcuts: Record<string, Partial<KeyboardShortcut>>;
}

export interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutGroup[];
}
