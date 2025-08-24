import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Note, SortOption } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { ToastProvider, useToasts } from './hooks/useToasts';
import { getSharedNoteFromUrl, clearShareFromUrl } from './utils/shareUtils';
import { useMediaQuery } from './hooks/useMediaQuery';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import ImportModal from './components/ImportModal';
import ConfirmationModal from './components/ConfirmationModal';
import SummaryModal from './components/SummaryModal'; 
import CommandPalette from './components/CommandPalette'; 
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import FeatureAnnouncementManager from './components/FeatureAnnouncementExample';
import { summarizeText } from './services/geminiService';
import { FaBars, FaXmark } from 'react-icons/fa6';
import { FaSun, FaMoon, FaSearch, FaStar, FaQuestionCircle } from 'react-icons/fa';
import FullScreenLoader from './components/FullScreenLoader';

const AppContent: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);

  const [notes, setNotes] = useLocalStorage<Note[]>('stellar-scribe-notes-v2', []);
  const [activeNoteId, setActiveNoteId] = useLocalStorage<string | null>('stellar-scribe-active-note-id', null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage('stellar-scribe-sidebar-open', window.innerWidth > 768);
  const [hasMigrated, setHasMigrated] = useLocalStorage<boolean>('stellar-scribe-migrated-v2', false);
  const [theme, toggleTheme] = useTheme();
  const [sortOption, setSortOption] = useState<SortOption>('updatedAt');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [sharedNote, setSharedNote] = useState<any>(null);

  // Helper function to update notes state with de-duplication and sorting
  const updateNotesState = useCallback((newNotes: Note[], currentNotes: Note[]) => {
    const allNotesMap = new Map<string, Note>();

    // Add current notes first
    currentNotes.forEach(note => allNotesMap.set(note.id, note));

    // Add new notes, overwriting if IDs conflict (ensures latest version is kept)
    newNotes.forEach(note => allNotesMap.set(note.id, note));

    // Convert Map values back to an array and sort by updatedAt descending
    return Array.from(allNotesMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }, []);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false); // New state for summarizing
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false); // New state for summary modal
  const [summaryContent, setSummaryContent] = useState(''); // New state for summary content
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false); // New state for command palette
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false); // New state for keyboard shortcuts modal
  const { addToast } = useToasts();
  const [placeholderText, setPlaceholderText] = useState('Search notes...');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const isSmallScreen = useMediaQuery('(max-width: 640px)'); // Tailwind's 'sm' breakpoint is 640px

  // Refs for the view mode buttons
  const editorButtonRef = useRef<HTMLButtonElement>(null);
  const splitButtonRef = useRef<HTMLButtonElement>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);

  // State for the active indicator position and width
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Simulate brief splash loader once
  useEffect(() => {
    const t = setTimeout(() => setIsAppLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  
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

  // Effect to migrate notes from old local storage keys
  useEffect(() => {
    if (!hasMigrated) {
      const oldNoteKeys: string[] = [];
      const migratedNotes: Note[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('note_versions_')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              // Check if it's an array of notes or a single note
              if (Array.isArray(parsed)) {
                migratedNotes.push(...parsed);
              } else if (parsed && typeof parsed === 'object' && parsed.id && parsed.title && parsed.content) {
                migratedNotes.push(parsed);
              }
            }
          } catch (error) {
            console.error(`Error parsing old note key ${key}:`, error);
          }
          oldNoteKeys.push(key);
        }
      }

      if (migratedNotes.length > 0) {
        setNotes((prevNotes) => updateNotesState(migratedNotes, prevNotes));
        addToast(`Migrated ${migratedNotes.length} notes from old storage!`, 'success');
      }

      // Clean up old keys
      oldNoteKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // Also remove the generic 'note_versions' key if it exists and is empty
      if (localStorage.getItem('note_versions') === '[]') {
        localStorage.removeItem('note_versions');
      }

      setHasMigrated(true); // Mark migration as complete
    }
  }, [hasMigrated, setNotes, addToast, setHasMigrated]);

  // Effect to set the initial active note
  useEffect(() => {
    const sortedNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    if (activeNoteId === null && sortedNotes.length > 0) {
      setActiveNoteId(sortedNotes[0].id);
    } else if (activeNoteId !== null && !notes.some(note => note.id === activeNoteId)) {
        // If active note was deleted or not found after migration, select the latest one
        if (sortedNotes.length > 0) {
            setActiveNoteId(sortedNotes[0].id);
        } else {
            setActiveNoteId(null);
        }
    }
  }, [notes, activeNoteId, setActiveNoteId]);



  // Effect to update placeholder text on resize
  useEffect(() => {
    const updatePlaceholder = () => {
      if (window.innerWidth <= 640) { // Tailwind's 'sm' breakpoint is 640px
        setPlaceholderText('Search');
      } else {
        setPlaceholderText('Search notes...');
      }
    };

    updatePlaceholder(); // Set initially
    window.addEventListener('resize', updatePlaceholder);
    return () => window.removeEventListener('resize', updatePlaceholder);
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

  const addNote = useCallback((noteToAdd?: Note) => {
    const newNote: Note = noteToAdd || {
      id: crypto.randomUUID(),
      title: 'New Note',
      content: '# Welcome to your new note!\n\nStart typing here.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      isPinned: false,
      isImported: false, // Ensure this is explicitly set for default notes
    };
    setNotes(prevNotes => updateNotesState([newNote], prevNotes));
    selectNote(newNote.id);
    addToast(noteToAdd ? 'Note generated successfully!' : 'New note created!', 'success');
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

    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note =>
        note.id === activeNoteId
          ? { ...note, ...updatedFields, updatedAt: Date.now() }
          : note
      );
      return updateNotesState(updatedNotes, prevNotes);
    });
  }, [activeNoteId, setNotes]);
  
  const togglePinNote = useCallback((id: string) => {
      setNotes(prevNotes => {
          const noteToPin = prevNotes.find(note => note.id === id);
          if (noteToPin && window.innerWidth > 768) {
              addToast(noteToPin.isPinned ? `Unpinned "${noteToPin.title}"` : `Pinned "${noteToPin.title}"`, 'info');
          }
          const updatedNotes = prevNotes.map(note =>
              note.id === id ? { ...note, isPinned: !note.isPinned } : note
          );
          return updateNotesState(updatedNotes, prevNotes);
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
    
    setNotes(prevNotes => updateNotesState([newNote], prevNotes));
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
    console.log('App.tsx: Confirmation to delete note received for:', noteToDelete?.id);
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
 
  // Effect to handle keyboard shortcuts for command palette and help modal
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === '?' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsKeyboardShortcutsOpen((prev) => !prev);
      }
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsKeyboardShortcutsOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Effect to update the indicator's position and width
  useEffect(() => {
    const updateIndicator = () => {
      let targetRef: React.MutableRefObject<HTMLButtonElement | null> | null = null;
      if (viewMode === 'editor') {
        targetRef = editorButtonRef;
      } else if (viewMode === 'split') {
        targetRef = splitButtonRef;
      } else if (viewMode === 'preview') {
        targetRef = previewButtonRef;
      }

      if (targetRef?.current) {
        setIndicatorStyle({
          left: targetRef.current.offsetLeft,
          width: targetRef.current.offsetWidth,
        });
      }
    };

    updateIndicator(); // Initial update
    window.addEventListener('resize', updateIndicator); // Update on resize
    // Update when viewMode changes to ensure smooth transition
    return () => window.removeEventListener('resize', updateIndicator);
  }, [viewMode, activeNote]); // activeNote added as dependency for initial render when it becomes available

  if (isAppLoading) return <FullScreenLoader />;

  return (
    <div className="h-screen w-screen flex flex-col font-mono antialiased">
<style>{`
        input[type="search"]::-webkit-search-cancel-button {
          -webkit-appearance: none;
          filter: invert(1) grayscale(1) brightness(2); /* Make it white */
          cursor: pointer;
        }

        @media (min-width: 640px) { /* Tailwind's sm breakpoint */
          input[type="search"]::-webkit-search-cancel-button {
            display: none;
          }
        }
      `}</style>
      <style>{`
        input[type="search"]::-webkit-search-cancel-button {
          -webkit-appearance: none;
          filter: invert(1) grayscale(1) brightness(2); /* Make it white */
          cursor: pointer;
        }

        @media (min-width: 640px) { /* Tailwind's sm breakpoint */
          input[type="search"]::-webkit-search-cancel-button {
            display: none;
          }
        }
      `}</style>
      <header className="flex-shrink-0 bg-header-background dark:bg-dark-header-background border-b border-gray-200 dark:border-dark-border-color px-4 py-3 flex items-center justify-between z-30 shadow-sm">
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
            <h1 className="text-lg sm:text-xl font-bold text-text-primary dark:text-dark-text-primary hidden sm:block truncate">
              Stellar Scribe
            </h1>
          </div>
        </div>
        
<div className="flex items-center space-x-3 flex-grow max-w-md ml-4">
  <div className="relative flex-grow">
    {/* Search container with minimal glass effect */}
    <div className="relative group">
      {/* Subtle hover glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 blur-sm transition-all duration-300"></div>
      
      {/* Main search input */}
      <div className="relative">
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <FaSearch className="w-4 h-4 text-gray-800 dark:text-gray-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors duration-200" />
        </div>
        
        {/* Input field */}
        <input
          type="search"
          id="search-input"
          placeholder={placeholderText}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowRecommendations(e.target.value.length > 0);
          }}
          onFocus={() => setShowRecommendations(searchTerm.length > 0)}
          onBlur={() => setTimeout(() => setShowRecommendations(false), 150)}
          className="w-full pl-10 pr-10 sm:pr-20 py-2.5 bg-white rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-700 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-400 dark:focus:border-blue-400 focus:bg-white/90 dark:focus:bg-gray-900/70 transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-900/60 hover:border-gray-300/70 dark:hover:border-gray-700/60 dark:bg-gray-900/50 dark:placeholder-gray-500 dark:border-gray-800/50"
        />
        
        {/* Right-aligned content: Clear button or CtrlK */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
          {searchTerm && isSmallScreen && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-text-muted/60 dark:text-dark-text-muted/60 hover:text-text-primary dark:hover:text-dark-text-primary focus:outline-none"
              title="Clear search"
            >
              <FaXmark className="w-5 h-5" />
            </button>
          )}
          {!isSmallScreen && (
            <div className="hidden sm:flex items-center text-xs text-gray-500 dark:text-gray-400">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">CtrlK</kbd>
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Search recommendations dropdown */}
    {showRecommendations && searchTerm.length > 0 && (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-lg border border-gray-200/60 dark:border-gray-700/50 shadow-lg shadow-gray-900/5 dark:shadow-gray-900/20 z-50 max-h-64 overflow-y-auto">
        {notes.filter(note =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 5).map((note, index) => (
          <div
            key={note.id}
            className={`px-4 py-3 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 cursor-pointer transition-colors duration-150 ${
              index !== 0 ? 'border-t border-gray-100 dark:border-gray-700/50' : ''
            }`}
            onMouseDown={() => {
              selectNote(note.id);
              setSearchTerm('');
              setShowRecommendations(false);
            }}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-grow min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                  {note.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {note.content.replace(/[#*`]/g, '').substring(0, 80)}...
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {notes.filter(note =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        ).length === 0 && (
          <div className="px-4 py-6 text-center">
            <FaSearch className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No notes found for "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    )}
  </div>
  
  {/* View Mode Controls - Only show on desktop when note is active */}
  {window.innerWidth > 768 && activeNote && (
    <div className="relative hidden lg:flex items-center bg-gray-200 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg p-1 border border-gray-300 dark:border-gray-800/40">
      {/* Sliding active indicator */}
      <div
        className="absolute top-1 bottom-1 bg-blue-200 dark:bg-gray-800 rounded-md shadow-sm border border-blue-400 dark:border-gray-700/60 transition-all duration-300 ease-in-out"
        style={indicatorStyle}
      ></div>
      <button
        ref={editorButtonRef}
        onClick={() => setViewMode('editor')}
        className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-300 ${
          viewMode === 'editor'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-900 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
        title="Editor only"
      >
        Edit
      </button>
      <button
        ref={splitButtonRef}
        onClick={() => setViewMode('split')}
        className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-300 ${
          viewMode === 'split'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-900 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
        title="Split view"
      >
        Split
      </button>
      <button
        ref={previewButtonRef}
        onClick={() => setViewMode('preview')}
        className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-300 ${
          viewMode === 'preview'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-900 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
        title="Preview only"
      >
        Preview
      </button>
    </div>
  )}
  
  <button
    onClick={() => setIsKeyboardShortcutsOpen(true)}
    className="hidden md:flex p-2.5 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 flex-shrink-0"
    title="Keyboard shortcuts (Ctrl + ?)"
  >
    <FaQuestionCircle className="w-4 h-4" />
  </button>
  
  <button
    onClick={toggleTheme}
    className="p-2.5 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 flex-shrink-0"
    title="Toggle theme"
  >
    {theme === 'light' ? <FaMoon className="w-4 h-4" /> : <FaSun className="w-4 h-4" />}
  </button>
</div>
      </header>
      <main className="flex-grow flex overflow-hidden relative bg-gray-100 dark:bg-dark-bg-primary">
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
              key={notes.length}
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

        {/* Content section should always be allowed to shrink; prevent overflow */}
        <section className={`h-full relative transition-all duration-300 ease-in-out flex-1 min-w-0`}>
          <NoteEditor
            activeNote={activeNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onAddNote={addNote}
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
        notes={notes}
        theme={theme}
      />

      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />

      {/* Feature Announcements */}
      <FeatureAnnouncementManager />
    </div>
  );
};
 
const App: React.FC = () => (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
);
 
export default App;