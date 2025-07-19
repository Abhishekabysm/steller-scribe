import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Command } from 'cmdk';
import { Note } from '../types';
import { FaPlus, FaSun, FaMoon, FaThumbtack, FaClock, FaStar, FaKeyboard } from 'react-icons/fa';
import { FaFileLines } from 'react-icons/fa6';
import { FaSearch, FaStickyNote } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  addNote: () => void;
  toggleTheme: () => void;
  handleSummarize: () => void;
  selectNote: (id: string) => void;
  togglePinNote: (id: string) => void;
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
  togglePinNote,
  notes,
  theme,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onClose]);

  // Reset and focus when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelectNote = useCallback((noteId: string) => {
    selectNote(noteId);
    onClose();
  }, [selectNote, onClose]);

  const handleTogglePinNote = useCallback((noteId: string) => {
    togglePinNote(noteId);
    onClose();
  }, [togglePinNote, onClose]);

  const handleAddNote = useCallback(() => {
    addNote();
    onClose();
  }, [addNote, onClose]);

  const handleToggleTheme = useCallback(() => {
    toggleTheme();
    onClose();
  }, [toggleTheme, onClose]);

  const handleSummarizeNote = useCallback(() => {
    handleSummarize();
    onClose();
  }, [handleSummarize, onClose]);

  if (!isOpen) return null;

  // Get time ago for notes
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Get word count for notes
  const getWordCount = (content: string) => {
    return content.trim().split(/\s+/).length;
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={onClose}
    >
      {/* Enhanced backdrop with animated gradient */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 animate-gradient" />
      </div>
      
      {/* Glassy Command Palette with scale animation */}
      <div className="relative min-h-screen flex items-start justify-center pt-10 sm:pt-[12vh] px-2 md:px-4">
        <Command
          className="relative w-full max-w-2xl overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 scale-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
        >
          {/* Enhanced glassy container */}
          <div className="relative rounded-2xl overflow-hidden">
            {/* Animated gradient border */}
            <div className="absolute inset-0 p-[1px] rounded-2xl bg-gradient-to-br from-white/40 via-white/20 to-white/10 dark:from-white/20 dark:via-white/10 dark:to-white/5">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 animate-pulse" />
            </div>
            
            {/* Main content with enhanced glass effect */}
            <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-md backdrop-saturate-200 rounded-2xl m-[1px]">
              
              {/* Search Header with floating effect */}
              <div className="relative">
                {/* Subtle top highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent" />
                
                <div className="relative bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/30 dark:to-transparent">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-6">
                    <div className="relative">
                      <FaSearch className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <div className="absolute inset-0 animate-ping">
                        <FaSearch className="w-5 h-5 text-blue-400 dark:text-blue-500 opacity-30" />
                      </div>
                    </div>
                  </div>
                  <Command.Input
                    ref={inputRef}
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search for notes and commands..."
                    className="w-full bg-transparent py-6 pl-16 pr-6 text-lg font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none border-0"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Animated divider */}
              <div className="relative h-px overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 dark:via-blue-500 to-transparent animate-shimmer" />
              </div>

              {/* Results with enhanced scrollbar */}
              <Command.List className="max-h-[60vh] sm:max-h-[55vh] overflow-y-auto px-2 py-2 scroll-smooth custom-scrollbar">
                <Command.Empty className="flex flex-col items-center justify-center py-20 px-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-inner">
                      <FaSearch className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">?</span>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mt-6">No results found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Try searching with different keywords</p>
                </Command.Empty>

                {/* Favorites Section with enhanced styling */}
                <Command.Group>
                  <div className="flex items-center gap-2 px-4 py-3 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-10">
                    <div className="relative">
                      <FaStar className="w-3.5 h-3.5 text-yellow-500" />
                      <IoSparkles className="w-2 h-2 text-yellow-400 absolute -top-1 -right-1" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-gray-600 to-gray-500 dark:from-gray-400 dark:to-gray-300 bg-clip-text text-transparent">
                      Favorites
                    </span>
                  </div>
                  
                  <Command.Item 
                    onSelect={handleAddNote}
                    className="group relative flex items-center gap-4 px-4 py-3.5 mx-2 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    data-selected={selectedIndex === 0}
                  >
                    {/* Hover background effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity" />
                    
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 group-hover:scale-110 transition-all duration-200">
                      <FaPlus className="w-5 h-5 text-white" />
                      <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="relative flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 group-data-[selected=true]:text-gray-900 dark:group-data-[selected=true]:text-gray-100">New Note</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 group-data-[selected=true]:text-gray-600 dark:group-data-[selected=true]:text-gray-300">Create a blank note</div>
                    </div>
                    <div className="relative flex items-center gap-2">
                      <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">Quick</span>
                      <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        ⌘N
                      </kbd>
                    </div>
                  </Command.Item>

                  <Command.Item 
                    onSelect={handleToggleTheme}
                    className="group relative flex items-center gap-4 px-4 py-3.5 mx-2 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    data-selected={selectedIndex === 1}
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-50 to-purple-50/50 dark:from-purple-900/20 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity" />
                    
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 group-hover:scale-110 transition-all duration-200">
                      {theme === 'light' ? 
                        <FaMoon className="w-5 h-5 text-white" /> : 
                        <FaSun className="w-5 h-5 text-white" />
                      }
                      <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="relative flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 group-data-[selected=true]:text-gray-900 dark:group-data-[selected=true]:text-gray-100">Toggle Theme</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 group-data-[selected=true]:text-gray-600 dark:group-data-[selected=true]:text-gray-300">Switch to {theme === 'light' ? 'dark' : 'light'} mode</div>
                    </div>
                    <div className="relative flex items-center gap-2">
                      <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">System</span>
                      <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        ⌘T
                      </kbd>
                    </div>
                  </Command.Item>

                  <Command.Item 
                    onSelect={handleSummarizeNote}
                    className="group relative flex items-center gap-4 px-4 py-3.5 mx-2 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    data-selected={selectedIndex === 2}
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-50 to-green-50/50 dark:from-green-900/20 dark:to-green-900/10 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity" />
                    
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 group-hover:scale-110 transition-all duration-200">
                      <FaStickyNote className="w-5 h-5 text-white" />
                      <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="relative flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 group-data-[selected=true]:text-gray-900 dark:group-data-[selected=true]:text-gray-100">Summarize Note</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 group-data-[selected=true]:text-gray-600 dark:group-data-[selected=true]:text-gray-300">Generate AI summary</div>
                    </div>
                    <div className="relative flex items-center gap-2">
                      <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <IoSparkles className="w-2.5 h-2.5" />
                        AI
                      </span>
                      <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        ⌘S
                      </kbd>
                    </div>
                  </Command.Item>
                </Command.Group>

                {/* Suggestions Section - Recent Notes */}
                {notes.length > 0 && (
                  <Command.Group>
                    <div className="flex items-center gap-2 px-4 py-3 mt-2 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-10">
                      <FaClock className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-gray-600 to-gray-500 dark:from-gray-400 dark:to-gray-300 bg-clip-text text-transparent">
                        Recent
                      </span>
                      <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">
                        {notes.length} notes
                      </span>
                    </div>
                    {notes.slice(0, 5).map((note, index) => (
                      <Command.Item 
                        key={note.id} 
                        onSelect={() => handleSelectNote(note.id)}
                        className="group relative flex items-center gap-4 px-4 py-3.5 mx-2 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                        data-selected={selectedIndex === 3 + index}
                      >
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-800/30 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity" />
                        
                        <div className="relative">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            <FaFileLines className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          </div>
                          {note.isPinned && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
                              <FaThumbtack className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="relative flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 truncate group-data-[selected=true]:text-gray-900 dark:group-data-[selected=true]:text-gray-100">
                            {note.title || 'Untitled Note'}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 group-data-[selected=true]:text-gray-600 dark:group-data-[selected=true]:text-gray-300">
                              {note.content ? note.content.substring(0, 60) + '...' : 'No content'}
                            </span>
                            {note.content && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                                {getWordCount(note.content)} words
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="relative flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {getTimeAgo(new Date(note.updatedAt || note.createdAt))}
                          </span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Pinned Notes Section */}
                {notes.some(note => note.isPinned) && (
                  <Command.Group>
                    <div className="flex items-center gap-2 px-4 py-3 mt-2 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-10">
                      <FaThumbtack className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-gray-600 to-gray-500 dark:from-gray-400 dark:to-gray-300 bg-clip-text text-transparent">
                        Pinned
                      </span>
                      <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">
                        {notes.filter(n => n.isPinned).length} pinned
                      </span>
                    </div>
                    {notes.filter(note => note.isPinned).map((note, index) => (
                      <Command.Item 
                        key={`pin-${note.id}`} 
                        onSelect={() => handleTogglePinNote(note.id)}
                        className="group relative flex items-center gap-4 px-4 py-3.5 mx-2 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                        data-selected={selectedIndex === 3 + notes.slice(0, 5).length + index}
                      >
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-50 to-orange-50/50 dark:from-orange-900/20 dark:to-orange-900/10 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity" />
                        
                        <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 group-hover:scale-110 transition-all duration-200">
                          <FaThumbtack className="w-5 h-5 text-white" />
                          <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="relative flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 group-data-[selected=true]:text-gray-900 dark:group-data-[selected=true]:text-gray-100">Unpin: {note.title || 'Untitled Note'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 group-data-[selected=true]:text-gray-600 dark:group-data-[selected=true]:text-gray-300">Remove from pinned notes</div>
                        </div>
                        <div className="relative flex items-center gap-2">
                          <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">Action</span>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>

              {/* Enhanced Footer with Pro Tips */}
              <div className="relative border-t border-gray-200/50 dark:border-gray-700/50">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-gray-900/30" />
                
                <div className="relative px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <FaKeyboard className="w-3.5 h-3.5" />
                        <span className="font-medium">Navigation</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-[10px] font-semibold shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">↑↓</kbd>
                          <span className="text-gray-600 dark:text-gray-300">Move</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-[10px] font-semibold shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">↵</kbd>
                          <span className="text-gray-600 dark:text-gray-300">Select</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-[10px] font-semibold shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">esc</kbd>
                          <span className="text-gray-600 dark:text-gray-300">Close</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ready</span>
                    </div>
                  </div>
                  
                  {/* Pro tip */}
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                    <IoSparkles className="w-3 h-3" />
                    <span>Pro tip: Use <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-semibold">⌘K</kbd> to quickly open this palette</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
};

export default CommandPalette;