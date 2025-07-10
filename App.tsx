
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Note, SortOption } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { ToastProvider, useToasts } from './hooks/useToasts';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import LogoIcon from './components/icons/LogoIcon';
import MenuIcon from './components/icons/MenuIcon';
import SunIcon from './components/icons/SunIcon';
import MoonIcon from './components/icons/MoonIcon';

const AppContent: React.FC = () => {
  const [notes, setNotes] = useLocalStorage<Note[]>('stellar-scribe-notes-v2', []);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [theme, toggleTheme] = useTheme();
  const [sortOption, setSortOption] = useState<SortOption>('updatedAt');
  const { addToast } = useToasts();
  
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

  const activeNote = useMemo(() => notes.find(note => note.id === activeNoteId), [notes, activeNoteId]);

  return (
    <div className="h-screen w-screen flex flex-col font-sans antialiased">
      <header className="flex-shrink-0 bg-surface dark:bg-dark-surface border-b border-border-color dark:border-dark-border-color p-3 flex items-center justify-between z-30 gap-3">
        <div className="flex items-center space-x-3 flex-shrink-0">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1 text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors ${isSidebarOpen ? 'md:hidden' : ''}`}>
            <MenuIcon className="w-6 h-6"/>
          </button>
          <LogoIcon className="w-7 h-7 text-accent dark:text-dark-accent" />
          <h1 className="text-xl font-bold text-text-primary dark:text-dark-text-primary hidden sm:block">Stellar Scribe</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="relative flex-grow sm:flex-grow-0">
            <input
              type="search"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 bg-bg-secondary dark:bg-dark-bg-secondary rounded-lg text-sm text-text-primary dark:text-dark-text-primary placeholder-text-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent focus:bg-surface dark:focus:bg-dark-surface transition-all duration-200 border border-transparent focus:border-accent dark:focus:border-dark-accent"
            />
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary text-text-secondary dark:text-dark-text-secondary transition-colors flex-shrink-0" title="Toggle Theme">
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>
        </div>
      </header>
      <main className="flex-grow flex overflow-hidden relative">
        {isSidebarOpen && <div onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsSidebarOpen(false);
          }
        }} className="fixed inset-0 bg-black/50 z-10 md:hidden animate-fade-in" />}
        
        {isSidebarOpen && (
          <aside className={`absolute md:relative z-20 h-full flex-shrink-0 border-r border-border-color dark:border-dark-border-color w-full max-w-xs transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
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
          />
        </section>
      </main>
    </div>
  );
};

const App: React.FC = () => (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
);

export default App;
