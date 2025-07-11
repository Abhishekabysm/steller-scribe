
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Note, SortOption } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { ToastProvider, useToasts } from './hooks/useToasts';
import { getSharedNoteFromUrl, clearShareFromUrl } from './utils/shareUtils';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import ImportModal from './components/ImportModal';
import LogoIcon from './components/icons/LogoIcon';
import MenuIcon from './components/icons/MenuIcon';
import SunIcon from './components/icons/SunIcon';
import MoonIcon from './components/icons/MoonIcon';
import SearchIcon from './components/icons/SearchIcon';

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
  const { addToast } = useToasts();
  
  // Effect to check for shared notes on app load
  useEffect(() => {
    const shared = getSharedNoteFromUrl();
    if (shared) {
      setSharedNote(shared);
      setIsImportModalOpen(true);
    }
  }, []);

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
    
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: sharedNote.title,
      content: sharedNote.content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: sharedNote.tags,
      isPinned: false,
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

  const activeNote = useMemo(() => notes.find(note => note.id === activeNoteId), [notes, activeNoteId]);

  return (
    <div className="h-screen w-screen flex flex-col font-sans antialiased">
      <header className="flex-shrink-0 bg-surface dark:bg-dark-surface border-b border-border-color dark:border-dark-border-color px-4 py-3 flex items-center justify-between z-30 shadow-sm">
        <div className="flex items-center space-x-3 flex-shrink-0 min-w-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`p-2 rounded-lg text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary transition-all duration-200 ${isSidebarOpen ? 'md:hidden' : ''}`}
            title="Toggle sidebar"
          >
            <MenuIcon className="w-5 h-5"/>
          </button>
          <div className="flex items-center space-x-2 min-w-0">
            <LogoIcon className="w-8 h-8 text-accent dark:text-dark-accent flex-shrink-0" />
            <h1 className="text-xl font-bold text-text-primary dark:text-dark-text-primary hidden sm:block truncate">
              Stellar Scribe
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 flex-grow max-w-md ml-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-4 h-4 text-text-muted dark:text-dark-text-muted" />
            </div>
            <input
              type="search"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary dark:bg-dark-bg-secondary rounded-lg text-sm text-text-primary dark:text-dark-text-primary placeholder-text-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent focus:bg-surface dark:focus:bg-dark-surface transition-all duration-200 border border-transparent focus:border-accent dark:focus:border-dark-accent"
            />
          </div>
          
          {/* View Mode Controls - Only show on desktop when note is active */}
          {window.innerWidth > 768 && activeNote && (
            <div className="hidden lg:flex items-center bg-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'editor'
                    ? 'bg-surface dark:bg-dark-surface text-accent dark:text-dark-accent shadow-sm'
                    : 'text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary'
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
                    : 'text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary'
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
                    : 'text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary'
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
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
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
    </div>
  );
};

const App: React.FC = () => (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
);

export default App;
