import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { Note, SortOption, Project } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { ToastProvider, useToasts } from './hooks/useToasts';
import { getSharedNoteFromUrl, clearShareFromUrl } from './utils/shareUtils';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useProjects } from './hooks/useProjects';
import { ProjectService } from './services/projectService';
import { migrateNotesToProjects, applyDefaultProject } from './utils/projectMigration';
import NoteEditor from './components/NoteEditor';
import CombinedSidebar from './components/CombinedSidebar';
import ProjectModal from './components/ProjectModal';
import DeleteProjectModal from './components/DeleteProjectModal';
import ImportModal from './components/ImportModal';
import ConfirmationModal from './components/ConfirmationModal';
import SummaryModal from './components/SummaryModal'; 
import CommandPalette from './components/CommandPalette'; 
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import { useEnhancedKeyboardShortcuts } from './hooks/useEnhancedKeyboardShortcuts';
import VersionHistoryModal from './components/VersionHistory/VersionHistoryModal';
import FeatureAnnouncementManager from './components/FeatureAnnouncementExample';
import { summarizeText } from './services/geminiService';
import { FaXmark } from 'react-icons/fa6';
import { FaSun, FaMoon, FaSearch, FaStar, FaQuestionCircle } from 'react-icons/fa';
import { PiSidebarSimpleBold } from 'react-icons/pi';
import FullScreenLoader from './components/FullScreenLoader';

const AppContent: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);

  const [notes, setNotes] = useLocalStorage<Note[]>('stellar-scribe-notes-v2', []);
  const [activeNoteId, setActiveNoteId] = useLocalStorage<string | null>('stellar-scribe-active-note-id', null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage('stellar-scribe-sidebar-open', true);
  const [hasMigrated, setHasMigrated] = useLocalStorage<boolean>('stellar-scribe-migrated-v2', false);
  const [hasProjectMigrated, setHasProjectMigrated] = useLocalStorage<boolean>('stellar-scribe-project-migrated-v1', false);
  const [theme, toggleTheme] = useTheme();
  const [sortOption, setSortOption] = useState<SortOption>('updatedAt');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [sharedNote, setSharedNote] = useState<any>(null);
  
  // Project-related state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  // Use projects hook
  const projectsHook = useProjects(notes);

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
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false); // New state for version history modal
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

  // Register keyboard shortcuts
  const { getAllShortcuts } = useEnhancedKeyboardShortcuts({
    // Navigation
    toggleSidebar: () => setIsSidebarOpen(prev => !prev),
    focusSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    },
    nextNote: () => {
      if (filteredNotes.length > 0) {
        const currentIndex = filteredNotes.findIndex(note => note.id === activeNote?.id);
        const nextIndex = currentIndex < filteredNotes.length - 1 ? currentIndex + 1 : 0;
        selectNote(filteredNotes[nextIndex].id);
      }
    },
    previousNote: () => {
      if (filteredNotes.length > 0) {
        const currentIndex = filteredNotes.findIndex(note => note.id === activeNote?.id);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredNotes.length - 1;
        selectNote(filteredNotes[prevIndex].id);
      }
    },
    goToTop: () => {
      const editor = document.querySelector('.note-editor textarea, .note-editor [contenteditable]');
      if (editor) {
        editor.scrollTop = 0;
        if (editor instanceof HTMLElement) editor.focus();
      }
    },
    goToBottom: () => {
      const editor = document.querySelector('.note-editor textarea, .note-editor [contenteditable]');
      if (editor) {
        editor.scrollTop = editor.scrollHeight;
        if (editor instanceof HTMLElement) editor.focus();
      }
    },
    
    // File Operations
    newNote: () => addNote(),
    duplicateNote: () => {
      if (activeNote) {
        const duplicatedNote = {
          ...activeNote,
          id: crypto.randomUUID(),
          title: `${activeNote.title} (Copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isPinned: false,
        };
        addNote(duplicatedNote);
      }
    },
    deleteNote: () => activeNote && setIsDeleteModalOpen(true),
    saveNote: () => {}, // Auto-save is already implemented
    exportNote: () => {}, // Export is handled via toolbar
    importNotes: () => setIsImportModalOpen(true),
    
    // View & Display
    togglePreview: () => setViewMode(viewMode === 'preview' ? 'editor' : 'preview'),
    toggleEditor: () => setViewMode(viewMode === 'editor' ? 'preview' : 'editor'),
    toggleSplitView: () => setViewMode('split'),
    toggleFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    },
    zoomIn: () => {
      const editor = document.querySelector('.note-editor') as HTMLElement;
      if (editor) {
        const currentZoom = parseFloat(getComputedStyle(editor).fontSize) || 16;
        editor.style.fontSize = `${Math.min(currentZoom + 2, 24)}px`;
      }
    },
    zoomOut: () => {
      const editor = document.querySelector('.note-editor') as HTMLElement;
      if (editor) {
        const currentZoom = parseFloat(getComputedStyle(editor).fontSize) || 16;
        editor.style.fontSize = `${Math.max(currentZoom - 2, 12)}px`;
      }
    },
    resetZoom: () => {
      const editor = document.querySelector('.note-editor') as HTMLElement;
      if (editor) {
        editor.style.fontSize = '16px';
      }
    },
    
    // AI Features
    summarizeNote: () => activeNote && handleSummarize(),
    improveText: () => {
      // Check if text is selected
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) {
        return;
      }
      
      const event = new CustomEvent('aiTextAction', { 
        detail: { action: 'improve' } 
      });
      document.dispatchEvent(event);
    },
    fixGrammar: () => {
      // Check if text is selected
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) {
        return;
      }
      
      const event = new CustomEvent('aiTextAction', { 
        detail: { action: 'fix-grammar' } 
      });
      document.dispatchEvent(event);
    },
    shortenText: () => {
      // Check if text is selected
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) {
        return;
      }
      
      const event = new CustomEvent('aiTextAction', { 
        detail: { action: 'shorten' } 
      });
      document.dispatchEvent(event);
    },
    expandText: () => {
      // Check if text is selected
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) {
        return;
      }
      
      const event = new CustomEvent('aiTextAction', { 
        detail: { action: 'modify-expand' } 
      });
      document.dispatchEvent(event);
    },
    generateTitle: () => {}, // Handled in editor toolbar
    suggestTags: () => {}, // Handled in editor toolbar
    
    // Search & Find
    findInNote: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
    findAndReplace: () => {
      // This would open a find and replace dialog
      console.log('Find and replace');
    },
    findNext: () => {
      // This would find next occurrence
      console.log('Find next');
    },
    findPrevious: () => {
      // This would find previous occurrence
      console.log('Find previous');
    },
    
    // Help & Info
    showShortcuts: () => setIsKeyboardShortcutsOpen(true),
    showCommandPalette: () => setIsCommandPaletteOpen(true),
    showVersionHistory: () => setIsVersionHistoryOpen(true),
    toggleTheme: () => toggleTheme()
  });

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

  // Effect to migrate notes to project system
  useEffect(() => {
    if (!hasProjectMigrated && notes.length > 0) {
      const migrationResult = migrateNotesToProjects(notes, projectsHook.projects, hasProjectMigrated);
      
      if (migrationResult.success && migrationResult.defaultProject) {
        // Create default project
        const newProject = projectsHook.createProject({
          title: migrationResult.defaultProject.title,
          description: migrationResult.defaultProject.description,
          color: migrationResult.defaultProject.color,
          icon: migrationResult.defaultProject.icon,
          isPinned: migrationResult.defaultProject.isPinned,
          isArchived: migrationResult.defaultProject.isArchived,
          settings: migrationResult.defaultProject.settings,
        });
        
        // Assign existing notes to this project
        const updatedNotes = applyDefaultProject(notes, newProject.id);
        setNotes(updatedNotes);
        
        addToast(migrationResult.message, 'success');
      }
      
      setHasProjectMigrated(true);
    }
  }, [hasProjectMigrated, notes, projectsHook, setNotes, addToast, setHasProjectMigrated]);

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
  }, [setActiveNoteId, setIsSidebarOpen]);

  const addNote = useCallback((noteToAdd?: Note, projectId?: string | null) => {
    const newNote: Note = noteToAdd || {
      id: crypto.randomUUID(),
      title: 'New Note',
      content: '# Welcome to your new note!\n\nStart typing here.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      isPinned: false,
      isImported: false, // Ensure this is explicitly set for default notes
      projectId: projectId ?? projectsHook.activeProjectId ?? null,
    };
    const noteWithProject = noteToAdd
      ? { ...noteToAdd, projectId: projectId ?? noteToAdd.projectId ?? projectsHook.activeProjectId ?? null }
      : newNote;

    // Update notes state with callback to ensure note is added
    setNotes(prevNotes => {
      const updatedNotes = updateNotesState([noteWithProject], prevNotes);
      
      // After updating notes, schedule note selection
      // Using setTimeout ensures this runs after React's state update
      setTimeout(() => {
        setActiveNoteId(noteWithProject.id);
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
          setIsSidebarOpen(false);
        }
      }, 0);
      
      return updatedNotes;
    });
    
    // Set the project if needed
    if (noteWithProject.projectId !== undefined) {
      projectsHook.setActiveProjectId(noteWithProject.projectId ?? null);
    }
    
    addToast(noteToAdd ? 'Note generated successfully!' : 'New note created!', 'success');
  }, [setNotes, setActiveNoteId, setIsSidebarOpen, addToast, projectsHook, updateNotesState]);

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

  // Handle version restoration
  const handleRestoreVersion = useCallback((restoredNote: Note) => {
    console.log('App: Restoring note with version:', restoredNote.version);
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note =>
        note.id === activeNoteId
          ? { 
              ...note, 
              ...restoredNote,
              version: restoredNote.version, // Ensure version number is updated
              updatedAt: Date.now()
            }
          : note
      );
      console.log('App: Updated notes:', updatedNotes.find(n => n.id === activeNoteId));
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

  // Filtered notes based on active project and search
  const filteredNotes = useMemo(() => {
    let filtered = ProjectService.getProjectNotes(projectsHook.activeProjectId, notes);
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(lowerSearch) ||
        note.content.toLowerCase().includes(lowerSearch) ||
        note.tags?.some(tag => tag.toLowerCase().includes(lowerSearch))
      );
    }
    
    return filtered;
  }, [notes, projectsHook.activeProjectId, searchTerm]);


  // Project handlers
  const handleCreateProject = useCallback(() => {
    setProjectModalMode('create');
    setSelectedProject(null);
    setIsProjectModalOpen(true);
  }, []);

  const handleEditProject = useCallback((project: Project) => {
    setProjectModalMode('edit');
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  }, []);

  const handleSaveProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'noteCount' | 'lastActivityAt'>) => {
    if (projectModalMode === 'create') {
      const newProject = projectsHook.createProject(projectData);
      addToast(`Created project "${newProject.title}"`, 'success');
      projectsHook.setActiveProjectId(newProject.id);
    } else if (selectedProject) {
      projectsHook.updateProject(selectedProject.id, projectData);
      addToast(`Updated project "${projectData.title}"`, 'success');
    }
    setIsProjectModalOpen(false);
    setSelectedProject(null);
  }, [projectModalMode, selectedProject, projectsHook, addToast]);

  const handleDeleteProject = useCallback((project: Project) => {
    setProjectToDelete(project);
    setIsDeleteProjectModalOpen(true);
  }, []);

  const handleConfirmDeleteProject = useCallback((strategy: 'unorganize' | 'delete' | 'move', targetProjectId?: string) => {
    if (!projectToDelete) return;

    const updatedNotes = ProjectService.deleteProject(
      projectToDelete.id,
      notes,
      strategy,
      targetProjectId
    );
    
    setNotes(updatedNotes);
    projectsHook.deleteProject(projectToDelete.id, strategy, targetProjectId);
    
    addToast(`Deleted project "${projectToDelete.title}"`, 'info');
    setIsDeleteProjectModalOpen(false);
    setProjectToDelete(null);
  }, [projectToDelete, notes, setNotes, projectsHook, addToast]);

  const handleDuplicateProject = useCallback((project: Project) => {
    const result = projectsHook.duplicateProject(project.id, true);
    if (result) {
      // Add duplicated notes to notes state
      setNotes(prev => updateNotesState(result.notes, prev));
      addToast(`Duplicated project "${project.title}"`, 'success');
    }
  }, [projectsHook, setNotes, updateNotesState, addToast]);

  const handleDropNoteOnProject = useCallback((projectId: string | null, noteIds: string[]) => {
    const updatedNotes = ProjectService.moveNotesToProject(notes, noteIds, projectId);
    setNotes(updatedNotes);
    
    // Toast removed - no notification on drag and drop
    // const projectName = projectId 
    //   ? projectsHook.getProject(projectId)?.title || 'project'
    //   : 'Unorganized';
    // addToast(`Moved ${noteIds.length} ${noteIds.length === 1 ? 'note' : 'notes'} to ${projectName}`, 'success');
  }, [notes, setNotes, projectsHook]);

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
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
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
      if (e.key.toLowerCase() === 'h' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsVersionHistoryOpen((prev) => !prev);
      }
      // Toggle theme: Ctrl + ; (avoid browser-reserved keys)
      if (e.key === ';' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleTheme();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Helper to compute indicator position/size
  const computeIndicator = useCallback(() => {
    let targetRef: React.MutableRefObject<HTMLButtonElement | null> | null = null;
    if (viewMode === 'editor') {
      targetRef = editorButtonRef;
    } else if (viewMode === 'split') {
      targetRef = splitButtonRef;
    } else if (viewMode === 'preview') {
      targetRef = previewButtonRef;
    }

    if (targetRef?.current) {
      const button = targetRef.current;
      const left = button.offsetLeft;
      const width = button.offsetWidth;
      setIndicatorStyle({ left, width });
    }
  }, [viewMode]);

  // Initialize after layout (fix refresh invisibility)
  useLayoutEffect(() => {
    if (!activeNote || window.innerWidth <= 768) return;
    // Wait for layout, then measure twice to be safe
    const raf1 = requestAnimationFrame(() => {
      computeIndicator();
      const raf2 = requestAnimationFrame(() => computeIndicator());
      // Store second id on element for cleanup
      (computeIndicator as any)._raf2 = raf2;
    });
    return () => {
      cancelAnimationFrame(raf1);
      if ((computeIndicator as any)._raf2) cancelAnimationFrame((computeIndicator as any)._raf2);
    };
  }, [activeNote, isAppLoading, computeIndicator]);

  // Update on viewMode change and on resize
  useEffect(() => {
    if (!activeNote || window.innerWidth <= 768) return;
    computeIndicator();
    const timer = setTimeout(computeIndicator, 100);
    window.addEventListener('resize', computeIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', computeIndicator);
    };
  }, [viewMode, activeNote, computeIndicator]);

  if (isAppLoading) return <FullScreenLoader />;

  return (
    <div className="h-screen w-screen flex font-mono antialiased">
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
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSidebarOpen(false);
            }
          }}
        />
      )}

      {/* Sidebar - Left Side, Full Height */}
      {isSidebarOpen && (
        <aside
          className="fixed md:relative z-50 h-screen w-80 flex-shrink-0 border-r border-gray-200 dark:border-dark-border-color transform transition-transform duration-300 ease-in-out translate-x-0"
        >
        <CombinedSidebar
          projects={projectsHook.activeProjects}
          notes={notes}
          activeNoteId={activeNoteId}
          activeProjectId={projectsHook.activeProjectId}
          sortOption={sortOption}
          searchTerm={searchTerm}
          onSelectNote={selectNote}
          onSelectProject={projectsHook.setActiveProjectId}
          onAddNote={addNote}
          onTogglePinNote={togglePinNote}
          onDeleteNote={deleteNote}
          onDeletePinnedNote={handleDeletePinnedNote}
          onSortChange={setSortOption}
          onCreateProject={handleCreateProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onTogglePinProject={(project) => projectsHook.togglePinProject(project.id)}
          onToggleArchiveProject={(project) => projectsHook.toggleArchiveProject(project.id)}
          onDrop={handleDropNoteOnProject}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onAddNoteToProject={(projectId) => addNote(undefined, projectId)}
        />
        </aside>
      )}

      {/* Right Side Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header for Right Side */}
        <header className="flex-shrink-0 bg-header-background dark:bg-dark-header-background border-b border-gray-200 dark:border-dark-border-color px-4 py-3 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center space-x-3 flex-shrink-0 min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Open sidebar"
              >
                <PiSidebarSimpleBold className="w-5 h-5" />
              </button>
            )}
            <FaStar className="w-6 h-6 text-accent dark:text-dark-accent flex-shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-text-primary dark:text-dark-text-primary truncate">
              Stellar Scribe
            </h1>
          </div>
        
<div className="flex items-center space-x-3 flex-grow max-w-sm sm:max-w-md lg:max-w-lg ml-2 sm:ml-4">
  <div className="relative flex-grow">
    {/* Minimal search container */}
    <div className="relative group">
      {/* Main search input */}
      <div className="relative">
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <FaSearch className="w-4 h-4 text-gray-500 dark:text-gray-400 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors duration-200" />
        </div>
        
        {/* Input field */}
        <input
          type="search"
          id="search-input"
          placeholder={isSmallScreen ? "Search..." : placeholderText}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowRecommendations(e.target.value.length > 0);
          }}
          onFocus={() => setShowRecommendations(searchTerm.length > 0)}
          onBlur={() => setTimeout(() => setShowRecommendations(false), 150)}
          className="w-full pl-10 pr-8 sm:pr-16 py-2 sm:py-2.5 bg-white dark:bg-gray-900/80 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:bg-white dark:focus:bg-gray-900 focus:border-blue-400 dark:focus:border-blue-400 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/90 hover:border-gray-300 dark:hover:border-gray-600"
        />
        
        {/* Right-aligned content: Clear button or CtrlK */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              title="Clear search"
            >
              <FaXmark className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-xs font-mono text-gray-500 dark:text-gray-400">⌘K</kbd>
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Search recommendations dropdown */}
    {showRecommendations && searchTerm.length > 0 && (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 max-h-64 overflow-y-auto">
        {notes.filter(note =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 5).map((note, index) => (
          <div
            key={note.id}
            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150 ${
              index !== 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
            }`}
            onMouseDown={() => {
              selectNote(note.id);
              setSearchTerm('');
              setShowRecommendations(false);
            }}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
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
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative bg-gray-100 dark:bg-dark-bg-primary">
          <NoteEditor
            activeNote={activeNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onAddNote={addNote}
            viewMode={viewMode}
            onRestoreVersion={handleRestoreVersion}
          />
        </main>
      </div>

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
            Are you sure you want to delete the pinned note "<strong className="text-gray-900 dark:text-gray-100">{noteToDelete?.title}</strong>"?
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        icon="danger"
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
        shortcuts={getAllShortcuts()}
      />

      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        note={activeNote || null}
        onRestoreVersion={(version) => {
          if (activeNote) {
            const restoredNote: Note = {
              ...activeNote,
              title: version.title,
              content: version.content,
              version: version.version,
              updatedAt: Date.now()
            };
            handleRestoreVersion(restoredNote);
          }
        }}
      />

      {/* Project Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setSelectedProject(null);
        }}
        onSave={handleSaveProject}
        existingProject={selectedProject}
        mode={projectModalMode}
      />

      <DeleteProjectModal
        isOpen={isDeleteProjectModalOpen}
        onClose={() => {
          setIsDeleteProjectModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleConfirmDeleteProject}
        project={projectToDelete}
        noteCount={projectToDelete ? ProjectService.getProjectNotes(projectToDelete.id, notes).length : 0}
        availableProjects={projectsHook.projects.filter(p => p.id !== projectToDelete?.id)}
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