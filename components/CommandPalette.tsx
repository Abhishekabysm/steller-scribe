import React, { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import { Command } from 'cmdk';
import { Note } from '../types';
import { FaPlus, FaSun, FaMoon, FaThumbtack, FaClock } from 'react-icons/fa';
import { FaFileLines } from 'react-icons/fa6';
import { FaSearch, FaStickyNote } from 'react-icons/fa';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  addNote: () => void;
  toggleTheme: () => void;
  handleSummarize: () => void;
  selectNote: (id: string) => void;
  notes: Note[];
  theme: 'light' | 'dark';
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  addNote,
  toggleTheme,
  handleSummarize,
  selectNote,
  notes,
  theme,
}) => {
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredSearch = useDeferredValue(search);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Action handlers
  const handleSelectNote = useCallback(async (noteId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      selectNote(noteId);
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [selectNote, onClose, isLoading]);

  const handleAddNote = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      addNote();
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [addNote, onClose, isLoading]);

  const handleToggleTheme = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      toggleTheme();
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [toggleTheme, onClose, isLoading]);

  const handleSummarizeNote = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      handleSummarize();
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [handleSummarize, onClose, isLoading]);

  // Enhanced keyboard shortcuts with proper dependencies
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Handle ⌘K or Ctrl+K to toggle command palette
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
        return;
      }

      // Only handle other shortcuts when command palette is open
      if (!isOpen) return;

      // Handle ⌘N or Ctrl+N for new note
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleAddNote();
        return;
      }

      // Handle ⌘T or Ctrl+T for theme toggle
      if (e.key === 't' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleToggleTheme();
        return;
      }

      // Handle ⌘S or Ctrl+S for summarize
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSummarizeNote();
        return;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onClose, handleAddNote, handleToggleTheme, handleSummarizeNote]);

  // Time formatting
  const getTimeAgo = useCallback((date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  }, []);

  // Search filtering
  const filteredNotes = useMemo(() => {
    if (!deferredSearch.trim()) return notes.slice(0, 15); // Show more initially
    
    const searchTerm = deferredSearch.toLowerCase();
    return notes.filter(note => {
      const titleMatch = note.title?.toLowerCase().includes(searchTerm);
      const contentMatch = note.content?.toLowerCase().includes(searchTerm);
      const tagMatch = note.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      return titleMatch || contentMatch || tagMatch;
    });
  }, [notes, deferredSearch]);

  // Limited to 5 pinned and 5 recent notes
  const { pinnedNotes, recentNotes } = useMemo(() => {
    const pinned = filteredNotes.filter(note => note.isPinned).slice(0, 5);
    const recent = filteredNotes.filter(note => !note.isPinned).slice(0, 5);
    return { pinnedNotes: pinned, recentNotes: recent };
  }, [filteredNotes]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      {/* Simple backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
      
      {/* Command Palette */}
      <Command
        className="relative w-full max-w-2xl lg:max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // Only handle Escape, let Command handle arrow keys
          if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
        shouldFilter={false}
      >
        {/* Search Input */}
        <div className="flex items-center px-6 py-5 bg-gray-50/50 dark:bg-gray-800/20">
          <FaSearch className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-4" />
          <Command.Input
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder="Search or type a command..."
            className="flex-1 bg-transparent text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
            disabled={isLoading}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="ml-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Results */}
        <Command.List className="max-h-[60vh] overflow-y-auto p-4">
          <Command.Empty className="py-12 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <FaSearch className="w-12 h-12 mx-auto mb-3" />
              <p className="text-base font-medium">No results found</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
            <button 
              onClick={handleAddNote}
              className="mt-4 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              disabled={isLoading}
            >
              Create new note
            </button>
          </Command.Empty>

          {/* Quick Actions */}
          {(!search || ['new', 'theme', 'summary'].some(term => search.toLowerCase().includes(term))) && (
            <>
              {(!search || search.toLowerCase().includes('new')) && (
                <Command.Item 
                  onSelect={handleAddNote}
                  className="flex items-center px-4 py-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer mb-2 transition-colors"
                  disabled={isLoading}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                    <FaPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-medium text-gray-900 dark:text-gray-100">New Note</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Create a blank note</div>
                  </div>
                  <kbd className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded font-mono">⌘N</kbd>
                </Command.Item>
              )}

              {(!search || search.toLowerCase().includes('theme')) && (
                <Command.Item 
                  onSelect={handleToggleTheme}
                  className="flex items-center px-4 py-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer mb-2 transition-colors"
                  disabled={isLoading}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-4">
                    {theme === 'light' ? 
                      <FaMoon className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : 
                      <FaSun className="w-5 h-5 text-yellow-500" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                      Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Toggle theme</div>
                  </div>
                  <kbd className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded font-mono">⌘T</kbd>
                </Command.Item>
              )}

              {(!search || search.toLowerCase().includes('summary')) && (
                <Command.Item 
                  onSelect={handleSummarizeNote}
                  className="flex items-center px-4 py-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer mb-2 transition-colors"
                  disabled={isLoading}
                >
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4">
                    <FaStickyNote className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-medium text-gray-900 dark:text-gray-100">Summarize Note</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Generate AI summary</div>
                  </div>
                  <kbd className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded font-mono">⌘S</kbd>
                </Command.Item>
              )}

              {(pinnedNotes.length > 0 || recentNotes.length > 0) && (
                <div className="h-px bg-gray-100 dark:bg-gray-800 my-4" />
              )}
            </>
          )}

          {/* Pinned Notes - Limited to 5 */}
          {pinnedNotes.length > 0 && (
            <>
              <div className="px-2 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FaThumbtack className="w-4 h-4 mr-2 text-orange-500" />
                  Pinned Notes
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {pinnedNotes.length}{notes.filter(n => n.isPinned).length > 5 && ` of ${notes.filter(n => n.isPinned).length}`}
                </span>
              </div>
              {pinnedNotes.map((note) => (
                <Command.Item 
                  key={`pin-${note.id}`} 
                  onSelect={() => handleSelectNote(note.id)}
                  className="flex items-center px-4 py-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer mb-2 transition-colors"
                  disabled={isLoading}
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-4">
                    <FaThumbtack className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                      {note.title || 'Untitled Note'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {note.content ? note.content.substring(0, 60) + '...' : 'No content'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500 ml-3">
                    {getTimeAgo(new Date(note.updatedAt || note.createdAt))}
                  </div>
                </Command.Item>
              ))}
              {recentNotes.length > 0 && <div className="h-px bg-gray-100 dark:bg-gray-800 my-4" />}
            </>
          )}

          {/* Recent Notes - Limited to 5 */}
          {recentNotes.length > 0 && (
            <>
              <div className="px-2 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FaClock className="w-4 h-4 mr-2 text-blue-500" />
                  Recent Notes
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {recentNotes.length}{notes.filter(n => !n.isPinned).length > 5 && ` of ${notes.filter(n => !n.isPinned).length}`}
                </span>
              </div>
              {recentNotes.map((note) => (
                <Command.Item 
                  key={note.id} 
                  onSelect={() => handleSelectNote(note.id)}
                  className="flex items-center px-4 py-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer mb-2 transition-colors"
                  disabled={isLoading}
                >
                  <div className="relative mr-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FaFileLines className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    {note.isPinned && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <FaThumbtack className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                      {note.title || 'Untitled Note'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {note.content ? note.content.substring(0, 60) + '...' : 'No content'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500 ml-3">
                    {getTimeAgo(new Date(note.updatedAt || note.createdAt))}
                  </div>
                </Command.Item>
              ))}
            </>
          )}
        </Command.List>

        {/* Footer */}
        <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-6">
              <span className="flex items-center">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs mr-1 font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs mr-1 font-mono">↵</kbd>
                select
              </span>
              <span className="flex items-center">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs mr-1 font-mono">esc</kbd>
                close
              </span>
            </div>
            <span className="font-medium">⌘K to open</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-xl">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Command>
    </div>
  );
};

export default CommandPalette;
