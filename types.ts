
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  isPinned: boolean;
  isImported?: boolean; // Optional flag to indicate if note was imported from a shared link
  importedAt?: number; // Optional timestamp when the note was imported
  projectId?: string | null; // Project this note belongs to (null = unorganized)
  lastTransaction?: {
    from: number;
    to: number;
    text: string;
    removed: string;
    origin: string;
  };
  // Version control fields
  version?: number; // Current version number
  lastVersionedAt?: number; // Timestamp of last version creation
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  color: string; // Hex color for visual identification
  icon?: string; // Optional emoji or icon
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  isArchived: boolean;
  settings: {
    defaultTags?: string[];
    defaultSorting?: SortOption;
    defaultView?: 'grid' | 'list';
  };
  noteCount: number; // Cached count for performance
  lastActivityAt: number; // Last time a note was modified in this project
}

export interface ProjectStats {
  totalNotes: number;
  pinnedNotes: number;
  lastActivity: number;
  tags: string[];
}

export interface NoteVersion {
  id: string;
  noteId: string;
  version: number;
  title: string;
  content: string;
  createdAt: number;
  changeDescription?: string; // Optional description of what changed
  changeType?: 'auto' | 'manual' | 'restore'; // Type of version creation
  diffStats?: {
    addedLines: number;
    removedLines: number;
    changedChars: number;
  };
}

export interface VersionControlState {
  versions: NoteVersion[];
  currentVersion: number;
  lastSavedVersion: number;
  hasUnsavedChanges: boolean;
}

export type SortOption = 'updatedAt' | 'createdAt' | 'title';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export type AITextAction = 'improve' | 'fix-grammar' | 'shorten' | 'translate' | 'dictionary' | 'beautify' | 'modify-expand';
