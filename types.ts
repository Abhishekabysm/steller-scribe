
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  isPinned: boolean;
}

export type SortOption = 'updatedAt' | 'createdAt' | 'title';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export type AITextAction = 'improve' | 'fix-grammar' | 'shorten' | 'translate' | 'dictionary';