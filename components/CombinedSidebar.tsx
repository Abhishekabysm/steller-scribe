import React, { useState, useMemo, useEffect } from 'react';
import { Note, Project, SortOption } from '../types';
import {
  FaPlus,
  FaThumbtack,
  FaChevronDown,
  FaFolder,
  FaFolderOpen,
  FaBook,
  FaBookOpen,
  FaFileLines,
  FaClipboard,
  FaBriefcase,
  FaLightbulb,
  FaRocket,
  FaFire,
  FaPaintbrush,
  FaFlask,
  FaGraduationCap,
  FaHeart,
  FaStar,
  FaCircle,
  FaInbox,
  FaRegTrashCan,
  FaEllipsisVertical,
  FaGripVertical,
  FaPencil,
  FaBoxArchive,
  FaCopy
} from 'react-icons/fa6';
import { MdCloudDownload, MdWork, MdHome, MdSettings } from 'react-icons/md';
import { PiSidebarSimpleBold } from 'react-icons/pi';
import Dropdown from './Dropdown';

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex) return `rgba(99, 102, 241, ${alpha})`;
  let sanitized = hex.replace('#', '');
  if (sanitized.length === 3) {
    sanitized = sanitized.split('').map((ch) => ch + ch).join('');
  }
  if (sanitized.length !== 6) return `rgba(99, 102, 241, ${alpha})`;
  const num = parseInt(sanitized, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const createProjectGradient = (color?: string) => {
  if (!color) return undefined;
  return `linear-gradient(90deg, ${hexToRgba(color, 0.2)} 0%, ${hexToRgba(color, 0.08)} 100%)`;
};

interface CombinedSidebarProps {
  projects: Project[];
  notes: Note[];
  activeNoteId: string | null;
  activeProjectId: string | null;
  sortOption: SortOption;
  searchTerm: string;
  onSelectNote: (id: string) => void;
  onSelectProject: (id: string | null) => void;
  onAddNote: () => void;
  onTogglePinNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onDeletePinnedNote: (note: Note) => void;
  onSortChange: (option: SortOption) => void;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onDuplicateProject: (project: Project) => void;
  onTogglePinProject: (project: Project) => void;
  onToggleArchiveProject: (project: Project) => void;
  onDrop: (projectId: string | null, noteIds: string[]) => void;
  onToggleSidebar: () => void;
  onAddNoteToProject: (projectId: string | null) => void;
}

const CombinedSidebar: React.FC<CombinedSidebarProps> = ({
  projects,
  notes,
  activeNoteId,
  activeProjectId,
  sortOption,
  searchTerm,
  onSelectNote,
  onSelectProject,
  onAddNote,
  onTogglePinNote,
  onDeleteNote,
  onDeletePinnedNote,
  onSortChange,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onDuplicateProject,
  onTogglePinProject,
  onToggleArchiveProject,
  onDrop,
  onToggleSidebar,
  onAddNoteToProject,
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('stellar-scribe-expanded-projects');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      } catch {
        return new Set(['all', 'unorganized']);
      }
    }
    return new Set(['all', 'unorganized']);
  });
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('stellar-scribe-expanded-sections');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      } catch {
        return new Set(['quick-access', 'projects', 'recent']);
      }
    }
    return new Set(['quick-access', 'projects', 'recent']);
  });
  
  const [contextMenu, setContextMenu] = useState<{ type: 'project' | 'note'; id: string; x: number; y: number } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const dragOverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Save expanded projects to localStorage
  useEffect(() => {
    localStorage.setItem('stellar-scribe-expanded-projects', JSON.stringify(Array.from(expandedProjects)));
  }, [expandedProjects]);

  // Save expanded sections to localStorage
  useEffect(() => {
    localStorage.setItem('stellar-scribe-expanded-sections', JSON.stringify(Array.from(expandedSections)));
  }, [expandedSections]);

  // Close context menu on click anywhere
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside the context menu
      if (target.closest('.context-menu-container')) return;
      setContextMenu(null);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    // Add small delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('contextmenu', handleClickOutside, true);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('contextmenu', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu]);

  // Cleanup drag timeout on unmount
  useEffect(() => {
    return () => {
      if (dragOverTimeoutRef.current) {
        clearTimeout(dragOverTimeoutRef.current);
      }
    };
  }, []);

  // Get notes for a specific project
  const getProjectNotes = (projectId: string | null) => {
    if (projectId === null || projectId === 'all') {
      return notes;
    }
    if (projectId === 'unorganized') {
      return notes.filter(note => !note.projectId || note.projectId === null);
    }
    return notes.filter(note => note.projectId === projectId);
  };

  // Filter and sort notes
  const filterAndSortNotes = (projectNotes: Note[]) => {
    let filtered = projectNotes;
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(lowerSearch) ||
        note.content.toLowerCase().includes(lowerSearch) ||
        note.tags?.some(tag => tag.toLowerCase().includes(lowerSearch))
      );
    }

    return filtered.sort((a, b) => {
      switch(sortOption) {
        case 'createdAt': return b.createdAt - a.createdAt;
        case 'title': return a.title.localeCompare(b.title);
        case 'updatedAt':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ noteIds: [noteId] }));
  };

  const handleDragOver = (e: React.DragEvent, projectId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(projectId);

    // Auto-expand collapsed projects when hovering during drag
    if (projectId && projectId !== 'all' && !expandedProjects.has(projectId)) {
      // Clear any existing timeout
      if (dragOverTimeoutRef.current) {
        clearTimeout(dragOverTimeoutRef.current);
      }

      // Set a new timeout to auto-expand after 700ms
      dragOverTimeoutRef.current = setTimeout(() => {
        const newExpanded = new Set(expandedProjects);
        newExpanded.add(projectId);
        setExpandedProjects(newExpanded);
      }, 700);
    }
  };

  const handleDragLeave = () => {
    setDragOver(null);
    
    // Clear the auto-expand timeout when leaving
    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current);
      dragOverTimeoutRef.current = null;
    }
  };

  const handleDrop = (e: React.DragEvent, projectId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);

    // Clear any pending auto-expand timeout
    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current);
      dragOverTimeoutRef.current = null;
    }

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const { noteIds } = JSON.parse(data);
        if (noteIds && Array.isArray(noteIds)) {
          // Convert special values: 'all' is ignored, 'unorganized' becomes null
          let targetProjectId = projectId;
          if (projectId === 'all') {
            // Don't move notes if dropped on "All Notes"
            return;
          } else if (projectId === 'unorganized') {
            targetProjectId = null;
          }
          onDrop(targetProjectId, noteIds);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const sortOptions = [
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'createdAt', label: 'Date Created' },
    { value: 'title', label: 'Title (A-Z)' },
  ];

  const activeProjects = projects.filter(p => !p.isArchived);
  const unorganizedNotes = notes.filter(note => !note.projectId || note.projectId === null);
  const pinnedProjects = activeProjects.filter(p => p.isPinned);
  const unpinnedProjects = activeProjects.filter(p => !p.isPinned);
  const recentNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  }, [notes]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Section Header Component
  const SectionHeader: React.FC<{ 
    title: string; 
    sectionId: string;
    count?: number;
    icon?: React.ReactNode;
  }> = ({ title, sectionId, count, icon }) => {
    const isExpanded = expandedSections.has(sectionId);
    
    return (
      <button
        onClick={() => toggleSection(sectionId)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 group rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/30 hover:backdrop-blur-sm"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span>{title}</span>
          {count !== undefined && count > 0 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100/80 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 rounded-full font-medium backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 shadow-sm">
              {count}
            </span>
          )}
        </div>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
          <FaChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
        </div>
      </button>
    );
  };

  // Note Item Component  
  const NoteItem: React.FC<{ note: Note; indent?: boolean; compact?: boolean }> = ({ note, indent = false, compact = false }) => {
    const [isDragging, setIsDragging] = useState(false);
    const date = new Date(note.updatedAt).toLocaleDateString("en-US", {
      month: 'short',
      day: 'numeric',
    });

    return (
      <div
        draggable
        onDragStart={(e) => {
          setIsDragging(true);
          handleDragStart(e, note.id);
        }}
        onDragEnd={() => setIsDragging(false)}
        onClick={() => onSelectNote(note.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ type: 'note', id: note.id, x: e.clientX, y: e.clientY });
        }}
        className={`group relative flex items-center px-3 rounded-lg cursor-pointer transition-all duration-200 border ${
          compact ? 'py-2' : 'py-2.5'
        } ${
          indent ? 'ml-6' : ''
        } ${
          isDragging ? 'opacity-40 scale-95 rotate-1' : ''
        } ${
          activeNoteId === note.id
            ? 'bg-gradient-to-r from-white/50 to-gray-50/40 dark:from-white/10 dark:to-gray-800/30 text-gray-900 dark:text-gray-100 shadow-sm border-gray-200/40 dark:border-gray-700/30 backdrop-blur-md'
            : 'text-gray-700 dark:text-gray-300 border-transparent hover:bg-gradient-to-r hover:from-white/40 hover:to-gray-50/40 dark:hover:from-white/5 dark:hover:to-gray-800/30 hover:shadow-sm hover:border-gray-200/30 dark:hover:border-gray-700/30 hover:backdrop-blur-md'
        }`}
      >
        {/* Drag handle */}
        <div className="opacity-0 group-hover:opacity-100 mr-2 cursor-grab active:cursor-grabbing transition-opacity">
          <FaGripVertical className="w-3 h-3 text-gray-400 dark:text-gray-500" />
        </div>

        {/* Note content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={`${compact ? 'text-sm' : 'text-sm font-medium'} truncate`}>
              {note.title || 'Untitled Note'}
            </span>
            {note.isPinned && (
              <FaThumbtack className="w-3 h-3 flex-shrink-0 text-blue-500 dark:text-blue-400" />
            )}
            {note.isImported && (
              <MdCloudDownload className="w-3 h-3 flex-shrink-0 text-green-500 dark:text-green-400" />
            )}
          </div>
          {!compact && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
              {date}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 ml-2 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinNote(note.id);
            }}
            className="p-1.5 rounded-md hover:bg-gray-200/80 dark:hover:bg-gray-700/60 transition-all duration-200 hover:shadow-sm backdrop-blur-sm border border-transparent hover:border-gray-300/50 dark:hover:border-gray-600/50"
            title={note.isPinned ? "Unpin" : "Pin"}
          >
            <FaThumbtack className={`w-3 h-3 ${note.isPinned ? 'text-blue-500' : 'text-gray-400'}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (note.isPinned) {
                onDeletePinnedNote(note);
              } else {
                onDeleteNote(note.id);
              }
            }}
            className="p-1.5 rounded-md hover:bg-red-100/80 dark:hover:bg-red-900/30 text-red-500 transition-all duration-200 hover:shadow-sm backdrop-blur-sm border border-transparent hover:border-red-300/50 dark:hover:border-red-800/50"
            title="Delete"
          >
            <FaRegTrashCan className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  // Project Section Component (for expanded view with notes)
  const ProjectSection: React.FC<{ project: Project | null; special?: 'all' | 'unorganized' }> = ({ 
    project, 
    special 
  }) => {
    const projectId = special || project?.id || null;
    const isExpanded = expandedProjects.has(projectId || '');
    const projectNotes = filterAndSortNotes(getProjectNotes(projectId));
    const isDraggedOver = dragOver === projectId;

    const title = special === 'all' ? 'All Notes' : special === 'unorganized' ? 'Unorganized' : project?.title || '';
    const icon = special === 'all'
      ? <FaFolder className="w-4 h-4" />
      : special === 'unorganized'
        ? <FaInbox className="w-4 h-4" />
        : (() => {
            if (!project?.icon) {
              return <FaFolder className="w-4 h-4" />;
            }

            const iconMap: Record<string, React.ReactNode> = {
              folder: <FaFolder className="w-4 h-4" />,
              'folder-open': <FaFolderOpen className="w-4 h-4" />,
              book: <FaBook className="w-4 h-4" />,
              'book-open': <FaBookOpen className="w-4 h-4" />,
              file: <FaFileLines className="w-4 h-4" />,
              clipboard: <FaClipboard className="w-4 h-4" />,
              star: <FaStar className="w-4 h-4" />,
              lightbulb: <FaLightbulb className="w-4 h-4" />,
              rocket: <FaRocket className="w-4 h-4" />,
              fire: <FaFire className="w-4 h-4" />,
              briefcase: <FaBriefcase className="w-4 h-4" />,
              paintbrush: <FaPaintbrush className="w-4 h-4" />,
              flask: <FaFlask className="w-4 h-4" />,
              graduation: <FaGraduationCap className="w-4 h-4" />,
              heart: <FaHeart className="w-4 h-4" />,
              work: <MdWork className="w-4 h-4" />,
              home: <MdHome className="w-4 h-4" />,
              settings: <MdSettings className="w-4 h-4" />,
              circle: <FaCircle className="w-3 h-3" />,
            };

            return iconMap[project.icon] ?? <FaFolder className="w-4 h-4" />;
          })();

    const projectBackground = project ? createProjectGradient(project.color) : undefined;

    return (
      <div className="mb-1">
        {/* Project Header */}
        <div
          onClick={(e) => {
            // Check if clicking on a button (context menu button)
            const clickedButton = (e.target as HTMLElement).closest('button');
            const isContextMenuButton = clickedButton && !clickedButton.classList.contains('chevron-toggle');
            
            if (!isContextMenuButton) {
              // Toggle expansion when clicking anywhere except context menu button
              toggleProject(projectId || '');
              // Also select project if not special
              if (!special) {
                onSelectProject(projectId);
              }
            }
          }}
          onDragOver={(e) => handleDragOver(e, projectId)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, projectId)}
          onContextMenu={(e) => {
            if (!special && project) {
              e.preventDefault();
              setContextMenu({ type: 'project', id: project.id, x: e.clientX, y: e.clientY });
            }
          }}
          className={`group flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 border ${
            isDraggedOver && special !== 'all' ? 'ring-1 ring-blue-400/30 dark:ring-blue-300/20' : ''
          } ${
            activeProjectId === projectId
              ? 'text-gray-900 dark:text-gray-100 shadow-sm border-transparent backdrop-blur-md'
              : 'border-transparent backdrop-blur-sm'
          }`}
        style={project ? {
          borderLeft: `3px solid ${project.color}`,
          background: projectBackground,
        } : {}}
        >
          <button
            className="chevron-toggle mr-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 flex-shrink-0"
          >
            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
              <FaChevronDown className="w-3.5 h-3.5" />
            </div>
          </button>

          <div className="mr-3">{icon}</div>

          <span className="flex-1 text-sm font-medium truncate text-gray-700 dark:text-gray-300">{title}</span>

          {projectNotes.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100/80 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 rounded-full mr-1 font-medium backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 shadow-sm">
              {projectNotes.length}
            </span>
          )}

          {!special && project && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setContextMenu({
                    type: 'project',
                    id: project.id,
                    x: rect.right,
                    y: rect.bottom + 6,
                  });
                }}
                className={`ml-1 p-1 rounded hover:bg-gray-200/80 dark:hover:bg-gray-700/60 hover:backdrop-blur-sm transition-all duration-200 ${
                  contextMenu?.type === 'project' && contextMenu?.id === project.id
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <FaEllipsisVertical className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Project Notes */}
        {isExpanded && (
          <div 
            className={`mt-1 space-y-1 min-h-[40px] transition-all duration-200 ${
              isDraggedOver && special !== 'all' ? 'rounded-lg ring-1 ring-inset ring-blue-400/20 dark:ring-blue-300/15' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, projectId)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, projectId)}
          >
            {projectNotes.length > 0 ? (
              projectNotes.map(note => (
                <NoteItem key={note.id} note={note} indent />
              ))
            ) : (
              <div className="ml-6 px-3 py-4 text-center text-sm text-gray-500 dark:text-dark-text-muted">
                {searchTerm ? 'No matching notes' : (isDraggedOver && special !== 'all') ? 'Drop note here' : 'No notes in this project'}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-white dark:bg-dark-bg-secondary flex flex-col font-sans">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-dark-border-color">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary whitespace-nowrap">
            Notes & Projects
          </h2>
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 transition-all duration-200 hover:shadow-sm backdrop-blur-sm border border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50"
            title="Close sidebar"
          >
            <PiSidebarSimpleBold className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              console.log('🔍 Sidebar Note button clicked');
              try {
                await onAddNote();
                // Force focus to editor after note creation
                setTimeout(() => {
                  const editor = document.querySelector('.note-editor textarea, .note-editor [contenteditable]') as HTMLTextAreaElement;
                  if (editor) {
                    console.log('🔍 Focusing editor after note creation');
                    editor.focus();
                    editor.setSelectionRange(editor.value.length, editor.value.length);
                  }
                }, 100);
              } catch (error) {
                console.error('Error creating note:', error);
              }
            }}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 text-sm font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 border border-blue-400/20 backdrop-blur-sm"
          >
            <FaPlus className="w-4 h-4" />
            <span>Note</span>
          </button>
          <button
            onClick={onCreateProject}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-600 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200 text-sm font-medium shadow-lg shadow-gray-500/15 hover:shadow-xl hover:shadow-gray-500/25 border border-gray-400/20 backdrop-blur-sm"
          >
            <FaFolder className="w-4 h-4" />
            <span>Project</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="mt-4">
          <Dropdown
            options={sortOptions}
            value={sortOption}
            onChange={(value) => onSortChange(value as SortOption)}
          />
        </div>
      </div>

      {/* Projects & Notes List */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Quick Access Section */}
        <div className="mb-6">
          <SectionHeader title="Quick Access" sectionId="quick-access" />
          {expandedSections.has('quick-access') && (
            <div className="mt-2 space-y-1">
              <ProjectSection special="all" project={null} />
              {unorganizedNotes.length > 0 && (
                <ProjectSection special="unorganized" project={null} />
              )}
            </div>
          )}
        </div>

        {/* Projects Section */}
        {activeProjects.length > 0 && (
          <div className="mb-6">
            <SectionHeader 
              title="Projects" 
              sectionId="projects" 
              count={activeProjects.length}
            />
            {expandedSections.has('projects') && (
              <div className="mt-2 space-y-1">
                {pinnedProjects.length > 0 && (
                  <>
                    {pinnedProjects.map(project => (
                      <ProjectSection key={project.id} project={project} />
                    ))}
                    {unpinnedProjects.length > 0 && (
                      <div className="my-2 mx-3 border-t border-gray-200 dark:border-gray-800" />
                    )}
                  </>
                )}
                {unpinnedProjects.map(project => (
                  <ProjectSection key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Notes Section */}
        {recentNotes.length > 0 && (
          <div className="mb-6">
            <SectionHeader title="Recent" sectionId="recent" count={recentNotes.length} />
            {expandedSections.has('recent') && (
              <div className="mt-2 space-y-1">
                {recentNotes.map((note: Note) => (
                  <NoteItem key={note.id} note={note} compact />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {activeProjects.length === 0 && notes.length === 0 && (
          <div className="text-center py-12 px-4">
            <FaFolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600 opacity-50" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              No notes or projects yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Create your first note or project
            </p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed z-[10000] bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border-color rounded-lg shadow-xl py-1 min-w-[180px] context-menu-container"
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
            }}
          >
            {contextMenu.type === 'project' ? (
              <>
                {(() => {
                  const project = projects.find(p => p.id === contextMenu.id);
                  if (!project) return null;
                  return (
                    <>
                      <button
                        onClick={() => {
                          onAddNoteToProject(project.id);
                          setContextMenu(null);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-secondary"
                      >
                        <FaPlus className="w-4 h-4 mr-3" />
                        New note
                      </button>
                      <button
                        onClick={() => {
                          onEditProject(project);
                          setContextMenu(null);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-secondary"
                      >
                        <FaPencil className="w-4 h-4 mr-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onTogglePinProject(project);
                          setContextMenu(null);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-secondary"
                      >
                        <FaThumbtack className="w-4 h-4 mr-3" />
                        {project.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={() => {
                          onDuplicateProject(project);
                          setContextMenu(null);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-secondary"
                      >
                        <FaCopy className="w-4 h-4 mr-3" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          onToggleArchiveProject(project);
                          setContextMenu(null);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-secondary"
                      >
                        <FaBoxArchive className="w-4 h-4 mr-3" />
                        {project.isArchived ? 'Unarchive' : 'Archive'}
                      </button>
                      <div className="h-px bg-gray-200 dark:bg-dark-border-color my-1" />
                      <button
                        onClick={() => {
                          onDeleteProject(project);
                          setContextMenu(null);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <FaRegTrashCan className="w-4 h-4 mr-3" />
                        Delete
                      </button>
                    </>
                  );
                })()}
              </>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

export default CombinedSidebar;
