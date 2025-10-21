import React, { useState, useMemo } from 'react';
import { Project, Note } from '../types';
import { 
  FaPlus, 
  FaThumbtack, 
  FaEllipsisVertical, 
  FaFolder,
  FaFolderOpen,
  FaInbox,
  FaXmark,
  FaPencil,
  FaTrash,
  FaCopy,
  FaBoxArchive,
  FaChevronDown,
  FaChevronRight
} from 'react-icons/fa6';

interface ProjectSidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  notes: Note[];
  onSelectProject: (id: string | null) => void;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onDuplicateProject: (project: Project) => void;
  onTogglePin: (project: Project) => void;
  onToggleArchive: (project: Project) => void;
  onDrop: (projectId: string | null, noteIds: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  activeProjectId,
  notes,
  onSelectProject,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onDuplicateProject,
  onTogglePin,
  onToggleArchive,
  onDrop,
  isOpen,
  onClose,
}) => {
  const [contextMenu, setContextMenu] = useState<{ projectId: string; x: number; y: number } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Compute note counts for each project
  const projectNoteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(project => {
      counts[project.id] = notes.filter(note => note.projectId === project.id).length;
    });
    return counts;
  }, [projects, notes]);

  const unorganizedCount = useMemo(() => {
    return notes.filter(note => !note.projectId || note.projectId === null).length;
  }, [notes]);

  const activeProjects = useMemo(() => {
    return projects.filter(p => !p.isArchived).sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by last activity
      return b.lastActivityAt - a.lastActivityAt;
    });
  }, [projects]);

  const archivedProjects = useMemo(() => {
    return projects.filter(p => p.isArchived);
  }, [projects]);

  const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    setContextMenu({ projectId, x: e.clientX, y: e.clientY });
  };

  const handleDragOver = (e: React.DragEvent, projectId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(projectId);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, projectId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const { noteIds } = JSON.parse(data);
        if (noteIds && Array.isArray(noteIds)) {
          onDrop(projectId, noteIds);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const ProjectItem: React.FC<{ project: Project; isActive: boolean }> = ({ project, isActive }) => {
    const noteCount = projectNoteCounts[project.id] || 0;
    const isDraggedOver = dragOver === project.id;

    return (
      <div
        className={`group relative flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
          isActive
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
            : isDraggedOver
            ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400 dark:ring-blue-500'
            : 'hover:bg-gray-100 dark:hover:bg-dark-bg-primary text-gray-700 dark:text-dark-text-secondary'
        }`}
        onClick={() => onSelectProject(project.id)}
        onContextMenu={(e) => handleContextMenu(e, project.id)}
        onDragOver={(e) => handleDragOver(e, project.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, project.id)}
      >
        {/* Color indicator */}
        <div
          className="w-1 h-8 rounded-full mr-3 flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />

        {/* Icon */}
        <div 
          className="w-8 h-8 rounded-md flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${project.color}20` }}
        >
          {project.icon || '📁'}
        </div>

        {/* Project info */}
        <div className="flex-1 min-w-0 ml-3">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm truncate">{project.title}</span>
            {project.isPinned && (
              <FaThumbtack className="w-3 h-3 flex-shrink-0 text-blue-500 dark:text-blue-400" />
            )}
          </div>
          {project.description && (
            <p className="text-xs text-gray-500 dark:text-dark-text-muted truncate mt-0.5">
              {project.description}
            </p>
          )}
        </div>

        {/* Note count badge */}
        {noteCount > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium flex-shrink-0">
            {noteCount}
          </span>
        )}

        {/* Context menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e, project.id);
          }}
          className="ml-1 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity"
        >
          <FaEllipsisVertical className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-10 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="fixed md:relative z-20 h-full w-64 bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-dark-border-color flex flex-col shadow-lg md:shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border-color">
          <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">
            Projects
          </h2>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-bg-primary text-gray-500 dark:text-dark-text-muted"
          >
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        {/* New Project Button */}
        <div className="p-3 border-b border-gray-200 dark:border-dark-border-color">
          <button
            onClick={onCreateProject}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium text-sm shadow-sm"
          >
            <FaPlus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* All Notes */}
          <div
            className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
              activeProjectId === null
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-dark-bg-primary text-gray-700 dark:text-dark-text-secondary'
            }`}
            onClick={() => onSelectProject(null)}
          >
            <FaFolder className="w-5 h-5 mr-3" />
            <span className="flex-1 font-medium text-sm">All Notes</span>
            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
              {notes.length}
            </span>
          </div>

          {/* Unorganized */}
          {unorganizedCount > 0 && (
            <div
              className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                activeProjectId === 'unorganized'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : dragOver === 'unorganized'
                  ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400 dark:ring-blue-500'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-bg-primary text-gray-700 dark:text-dark-text-secondary'
              }`}
              onClick={() => onSelectProject('unorganized')}
              onDragOver={(e) => handleDragOver(e, 'unorganized')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
            >
              <FaInbox className="w-5 h-5 mr-3" />
              <span className="flex-1 font-medium text-sm">Unorganized</span>
              <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-700 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                {unorganizedCount}
              </span>
            </div>
          )}

          {/* Divider */}
          {activeProjects.length > 0 && (
            <div className="py-2">
              <div className="h-px bg-gray-200 dark:bg-dark-border-color" />
            </div>
          )}

          {/* Active Projects */}
          {activeProjects.map(project => (
            <ProjectItem
              key={project.id}
              project={project}
              isActive={activeProjectId === project.id}
            />
          ))}

          {/* No projects message */}
          {activeProjects.length === 0 && (
            <div className="text-center py-8 px-4">
              <FaFolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-dark-text-muted">
                No projects yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                Create one to organize your notes
              </p>
            </div>
          )}

          {/* Archived Projects */}
          {archivedProjects.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-bg-primary rounded-lg transition-colors"
              >
                {showArchived ? <FaChevronDown className="w-3 h-3 mr-2" /> : <FaChevronRight className="w-3 h-3 mr-2" />}
                <FaBoxArchive className="w-4 h-4 mr-2" />
                Archived ({archivedProjects.length})
              </button>
              
              {showArchived && (
                <div className="mt-1 ml-4 space-y-1">
                  {archivedProjects.map(project => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      isActive={activeProjectId === project.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border-color rounded-lg shadow-xl py-1 min-w-[180px]"
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
            }}
          >
            {(() => {
              const project = projects.find(p => p.id === contextMenu.projectId);
              if (!project) return null;

              return (
                <>
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
                      onTogglePin(project);
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
                      onToggleArchive(project);
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
                    <FaTrash className="w-4 h-4 mr-3" />
                    Delete
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}
    </>
  );
};

export default ProjectSidebar;
