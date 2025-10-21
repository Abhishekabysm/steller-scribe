import { useCallback, useMemo } from 'react';
import { Project, Note, ProjectStats } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { ProjectService } from '../services/projectService';

interface UseProjectsReturn {
  // State
  projects: Project[];
  activeProjectId: string | null;
  
  // Setters
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  setActiveProjectId: (id: string | null) => void;
  
  // CRUD operations
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'noteCount' | 'lastActivityAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string, strategy?: 'unorganize' | 'delete' | 'move', targetProjectId?: string) => void;
  duplicateProject: (id: string, includeNotes?: boolean) => { project: Project; notes: Note[] } | undefined;
  
  // Organization
  togglePinProject: (id: string) => void;
  toggleArchiveProject: (id: string) => void;
  
  // Queries
  getProject: (id: string) => Project | undefined;
  getProjectStats: (id: string, notes: Note[]) => ProjectStats | null;
  getActiveProject: () => Project | null;
  
  // Computed values
  sortedProjects: Project[];
  pinnedProjects: Project[];
  unpinnedProjects: Project[];
  archivedProjects: Project[];
  activeProjects: Project[];
}

export const useProjects = (notes: Note[] = []): UseProjectsReturn => {
  const [projects, setProjects] = useLocalStorage<Project[]>('stellar-scribe-projects-v1', []);
  const [activeProjectId, setActiveProjectId] = useLocalStorage<string | null>(
    'stellar-scribe-active-project-id',
    null
  );

  // CRUD Operations
  const createProject = useCallback((
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'noteCount' | 'lastActivityAt'>
  ): Project => {
    const newProject = ProjectService.createProject(data);
    setProjects(prev => [...prev, newProject]);
    return newProject;
  }, [setProjects]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev =>
      prev.map(project =>
        project.id === id
          ? { ...project, ...updates, updatedAt: Date.now() }
          : project
      )
    );
  }, [setProjects]);

  const deleteProject = useCallback((
    id: string,
    strategy: 'unorganize' | 'delete' | 'move' = 'unorganize',
    targetProjectId?: string
  ) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    
    // If deleting active project, switch to "All Notes"
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  }, [setProjects, activeProjectId, setActiveProjectId]);

  const duplicateProject = useCallback((id: string, includeNotes: boolean = false): { project: Project; notes: Note[] } | undefined => {
    const project = projects.find(p => p.id === id);
    if (!project) return undefined;

    const { project: duplicatedProject, notes: duplicatedNotes } = ProjectService.duplicateProject(
      project,
      notes,
      includeNotes
    );

    setProjects(prev => [...prev, duplicatedProject]);
    
    // Note: The parent component needs to handle adding duplicated notes
    // This is returned so the parent can decide how to handle it
    return { project: duplicatedProject, notes: duplicatedNotes };
  }, [projects, notes, setProjects]);

  // Organization
  const togglePinProject = useCallback((id: string) => {
    setProjects(prev =>
      prev.map(project =>
        project.id === id
          ? ProjectService.togglePinProject(project)
          : project
      )
    );
  }, [setProjects]);

  const toggleArchiveProject = useCallback((id: string) => {
    setProjects(prev =>
      prev.map(project =>
        project.id === id
          ? ProjectService.toggleArchiveProject(project)
          : project
      )
    );
  }, [setProjects]);

  // Queries
  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  const getProjectStats = useCallback((id: string, projectNotes: Note[]): ProjectStats | null => {
    const project = getProject(id);
    if (!project) return null;
    return ProjectService.getProjectStats(project, projectNotes);
  }, [getProject]);

  const getActiveProject = useCallback((): Project | null => {
    if (!activeProjectId) return null;
    return projects.find(p => p.id === activeProjectId) || null;
  }, [activeProjectId, projects]);

  // Computed values
  const sortedProjects = useMemo(() => {
    return ProjectService.sortProjects(projects, 'updated');
  }, [projects]);

  const pinnedProjects = useMemo(() => {
    return projects.filter(p => p.isPinned && !p.isArchived);
  }, [projects]);

  const unpinnedProjects = useMemo(() => {
    return projects.filter(p => !p.isPinned && !p.isArchived);
  }, [projects]);

  const archivedProjects = useMemo(() => {
    return projects.filter(p => p.isArchived);
  }, [projects]);

  const activeProjects = useMemo(() => {
    return projects.filter(p => !p.isArchived);
  }, [projects]);

  return {
    // State
    projects,
    activeProjectId,
    
    // Setters
    setProjects,
    setActiveProjectId,
    
    // CRUD
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    
    // Organization
    togglePinProject,
    toggleArchiveProject,
    
    // Queries
    getProject,
    getProjectStats,
    getActiveProject,
    
    // Computed
    sortedProjects,
    pinnedProjects,
    unpinnedProjects,
    archivedProjects,
    activeProjects,
  };
};

export default useProjects;
