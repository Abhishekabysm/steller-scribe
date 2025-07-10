
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  isPinned: boolean;
  lastTransaction?: {
    from: number;
    to: number;
    text: string;
    removed: string;
    origin: string;
  };
}

export type SortOption = 'updatedAt' | 'createdAt' | 'title';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export type AITextAction = 'improve' | 'fix-grammar' | 'shorten' | 'translate' | 'dictionary';
