import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Note, SortOption } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { ToastProvider, useToasts } from './hooks/useToasts';
import { getSharedNoteFromUrl, clearShareFromUrl } from './utils/shareUtils';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import ImportModal from './components/ImportModal';
import ConfirmationModal from './components/ConfirmationModal';
import SummaryModal from './components/SummaryModal'; 
import CommandPalette from './components/CommandPalette'; 
import { summarizeText } from './services/geminiService'; 
import { FaBars } from 'react-icons/fa6';
import { FaSun, FaMoon, FaSearch, FaStar } from 'react-icons/fa';

const AppContent: React.FC = () => {
  const [notes, setNotes] = useLocalStorage<Note[]>('stellar-scribe-notes-v2', []);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [theme, toggleTheme] = useTheme();
  const [sortOption, setSortOption] = useState<SortOption>('updatedAt');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [sharedNote, setSharedNote] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false); // New state for summarizing
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false); // New state for summary modal
  const [summaryContent, setSummaryContent] = useState(''); // New state for summary content
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false); // New state for command palette
  const { addToast } = useToasts();
  
  // Effect to check for shared notes on app load
  useEffect(() => {
    const importNote = async () => {
      const shared = await getSharedNoteFromUrl();
      if (shared) {
        setSharedNote(shared);
        setIsImportModalOpen(true);
      } else if (window.location.hash.startsWith('#share_id=')) {
        addToast('The shared link is invalid, expired, or corrupted.', 'error');
        clearShareFromUrl();
      }
    };

    if (window.location.hash.startsWith('#share_id=')) {
      importNote();
    }
  }, [addToast]);

  // Effect to set the initial active note
  useEffect(() => {
    const sortedNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    if (activeNoteId === null && sortedNotes.length > 0) {
      setActiveNoteId(sortedNotes[0].id);
    }
  }, [notes, activeNoteId]);

  // Effect to handle window resizing for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth <= 768) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Prevent body scroll and lock position
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Store scroll position
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // Restore scroll position
      const scrollY = document.body.dataset.scrollY;
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
        delete document.body.dataset.scrollY;
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      delete document.body.dataset.scrollY;
    };
  }, [isSidebarOpen]);

  const selectNote = useCallback((id: string) => {
    setActiveNoteId(id);
    if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
    }
  }, []);

  const addNote = useCallback(() => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'New Note',
      content: '# Welcome to your new note!\n\nStart typing here.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      isPinned: false,
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
    selectNote(newNote.id);
    addToast('New note created!', 'success');
  }, [setNotes, selectNote, addToast]);

  const deleteNote = useCallback((id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    const remainingNotes = notes.filter(note => note.id !== id);
    setNotes(remainingNotes);

    if (activeNoteId === id) {
        if (remainingNotes.length > 0) {
             const sortedNotes = [...remainingNotes].sort((a, b) => b.updatedAt - a.updatedAt);
             selectNote(sortedNotes[0].id);
         } else {
            setActiveNoteId(null);
        }
    }
    addToast(`Deleted "${noteToDelete?.title || 'note'}"`, 'info');
  }, [activeNoteId, notes, setNotes, selectNote, addToast]);

  const updateNote = useCallback((updatedFields: Partial<Note>) => {
    if (!activeNoteId) return;

    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === activeNoteId 
          ? { ...note, ...updatedFields, updatedAt: Date.now() } 
          : note
      )
    );
  }, [activeNoteId, setNotes]);
  
  const togglePinNote = useCallback((id: string) => {
      setNotes(prevNotes => {
          const noteToPin = prevNotes.find(note => note.id === id);
          if (noteToPin && window.innerWidth > 768) {
              addToast(noteToPin.isPinned ? `Unpinned "${noteToPin.title}"` : `Pinned "${noteToPin.title}"`, 'info');
          }
          return prevNotes.map(note => 
              note.id === id ? { ...note, isPinned: !note.isPinned } : note
          )
      });
  }, [setNotes, addToast]);

  const handleImportSharedNote = useCallback(() => {
    if (!sharedNote) return;
    
    const now = Date.now();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: sharedNote.title,
      content: sharedNote.content,
      createdAt: now,
      updatedAt: now,
      tags: sharedNote.tags,
      isPinned: false,
      isImported: true, // Mark as imported note
      importedAt: now, // Store import timestamp
    };
    
    setNotes(prevNotes => [newNote, ...prevNotes]);
    selectNote(newNote.id);
    setIsImportModalOpen(false);
    setSharedNote(null);
    clearShareFromUrl();
    addToast(`Imported note: "${newNote.title}"`, 'success');
  }, [sharedNote, setNotes, selectNote, addToast]);

  const handleCancelImport = useCallback(() => {
    setIsImportModalOpen(false);
    setSharedNote(null);
    clearShareFromUrl();
  }, []);

  const handleDeletePinnedNote = useCallback((note: Note) => {
    setNoteToDelete(note);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id);
      setNoteToDelete(null);
      setIsDeleteModalOpen(false);
    }
  }, [noteToDelete, deleteNote]);

  const handleCancelDelete = useCallback(() => {
    setNoteToDelete(null);
    setIsDeleteModalOpen(false);
  }, []);

  const activeNote = useMemo(() => notes.find(note => note.id === activeNoteId), [notes, activeNoteId]);

  const handleSummarize = useCallback(async () => {
    if (!activeNote) return;
    setIsSummarizing(true);
    setIsSummaryModalOpen(true);
    setSummaryContent('');

    try {
      const summary = await summarizeText(activeNote.content);
      setSummaryContent(summary);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to get summary.', 'error');
      setIsSummaryModalOpen(false);
    } finally {
      setIsSummarizing(false);
    }
  }, [activeNote, addToast]);

  const handleAddSummaryToNote = useCallback(() => {
    if (!activeNote || !summaryContent) return;
    const summarySection = `\n\n---\n\n**AI Summary:**\n*${summaryContent}*`;
    updateNote({ content: activeNote.content + summarySection });
    addToast('Summary added to note!', 'success');
  }, [activeNote, summaryContent, updateNote, addToast]);
 
  // Effect to handle keyboard shortcut for command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col font-sans antialiased">
      <header className="flex-shrink-0 bg-surface dark:bg-dark-surface border-b border-border-color dark:border-dark-border-color px-4 py-3 flex items-center justify-between z-30 shadow-sm">
        <div className="flex items-center space-x-3 flex-shrink-0 min-w-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary transition-all duration-200 ${isSidebarOpen ? 'md:hidden' : ''}`}
            title="Toggle sidebar"
          >
            <FaBars className="w-5 h-5"/>
          </button>
          <div className="flex items-center space-x-2 min-w-0">
            <FaStar className="w-8 h-8 text-accent dark:text-dark-accent flex-shrink-0" />
            <h1 className="text-xl font-bold text-text-primary dark:text-dark-text-primary hidden sm:block truncate">
              Stellar Scribe
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 flex-grow max-w-md ml-4">
  <div className="relative flex-grow">
    {/* Glassy search container */}
    <div className="relative group">
      {/* Subtle gradient glow on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-60 group-focus-within:opacity-80 blur transition duration-300"></div>
      
      {/* Search input with enhanced glass effect */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <FaSearch className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors duration-200" />
        </div>
        <input
          type="search"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-16 py-3 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white/90 dark:focus:bg-gray-900/70 transition-all duration-200 border border-gray-200/60 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-gray-300/80 dark:hover:border-gray-600/60 focus:border-blue-400/50 dark:focus:border-blue-500/50"
        />
        {/* Command Palette Hint with enhanced styling */}
        <div 
          className="absolute inset-y-0 right-0 pr-3 hidden sm:flex items-center" 
          onClick={() => setIsCommandPaletteOpen(true)}
        >
          <kbd className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            ⌘K
          </kbd>
        </div>
      </div>
    </div>
  </div>
  
  {/* View Mode Controls - Only show on desktop when note is active */}
  {window.innerWidth > 768 && activeNote && (
    <div className="hidden lg:flex items-center bg-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-1">
      <button
        onClick={() => setViewMode('editor')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
          viewMode === 'editor'
            ? 'bg-surface dark:bg-dark-surface text-accent dark:text-dark-accent shadow-sm'
            : 'text-text-muted dark:text-dark-text-muted hover:text-black dark:hover:text-white'
        }`}
        title="Editor only"
      >
        Edit
      </button>
      <button
        onClick={() => setViewMode('split')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
          viewMode === 'split'
            ? 'bg-surface dark:bg-dark-surface text-accent dark:text-dark-accent shadow-sm'
            : 'text-text-muted dark:text-dark-text-muted hover:text-black dark:hover:text-white'
        }`}
        title="Split view"
      >
        Split
      </button>
      <button
        onClick={() => setViewMode('preview')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
          viewMode === 'preview'
            ? 'bg-surface dark:bg-dark-surface text-accent dark:text-dark-accent shadow-sm'
            : 'text-text-muted dark:text-dark-text-muted hover:text-black dark:hover:text-white'
        }`}
        title="Preview only"
      >
        Preview
      </button>
    </div>
  )}
  
  <button
    onClick={toggleTheme}
    className="p-2.5 rounded-lg hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-all duration-200 flex-shrink-0"
    title="Toggle theme"
  >
    {theme === 'light' ? <FaMoon className="w-5 h-5" /> : <FaSun className="w-5 h-5" />}
  </button>
</div>
      </header>
      <main className="flex-grow flex overflow-hidden relative">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 md:hidden animate-fade-in"
            onClick={(e) => {
              // Only close if clicking directly on the overlay
              if (e.target === e.currentTarget) {
                setIsSidebarOpen(false);
              }
            }}
          />
        )}
        
        {isSidebarOpen && (
          <aside
            className={`absolute md:relative z-20 h-full flex-shrink-0 border-r border-border-color dark:border-dark-border-color w-full max-w-xs transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
          >
            <NoteList
              notes={notes}
              activeNoteId={activeNoteId}
              onSelectNote={selectNote}
              onAddNote={addNote}
              onTogglePin={togglePinNote}
              onDeleteNote={deleteNote}
              onDeletePinnedNote={handleDeletePinnedNote}
              searchTerm={searchTerm}
              sortOption={sortOption}
              onSortChange={setSortOption}
              onCloseSidebar={() => setIsSidebarOpen(false)}
            />
          </aside>
        )}
        
        <section className={`h-full relative transition-all duration-300 ease-in-out ${isSidebarOpen ? 'flex-grow' : 'w-full'}`}>
          <NoteEditor
            activeNote={activeNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            viewMode={viewMode}
          />
        </section>
      </main>

      {sharedNote && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={handleCancelImport}
          sharedNote={sharedNote}
          onImport={handleImportSharedNote}
          onCancel={handleCancelImport}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Pinned Note"
        message={
          <>
            Are you sure you want to delete the pinned note "<strong>{noteToDelete?.title}</strong>"?
            <br />
            <br />
            This action cannot be undone.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={summaryContent}
        isLoading={isSummarizing}
        onAddToNote={handleAddSummaryToNote}
        noteTitle={activeNote?.title || ''}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        addNote={addNote}
        toggleTheme={toggleTheme}
        handleSummarize={handleSummarize}
        selectNote={selectNote}
        togglePinNote={togglePinNote}
        notes={notes}
        theme={theme}
      />
    </div>
  );
};
 
const App: React.FC = () => (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
);
 
export default App;
