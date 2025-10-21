import { Project, ProjectStats, Note } from '../types';

const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Green
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export class ProjectService {
  /**
   * Generate a random color from the predefined palette
   */
  static getRandomColor(): string {
    return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
  }

  /**
   * Create a new project
   */
  static createProject(
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'noteCount' | 'lastActivityAt'>
  ): Project {
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
      noteCount: 0,
      lastActivityAt: now,
    };
  }

  /**
   * Update project metadata (note count, last activity)
   */
  static updateProjectMetadata(project: Project, notes: Note[]): Project {
    const projectNotes = notes.filter(note => note.projectId === project.id);
    const lastActivity = projectNotes.length > 0
      ? Math.max(...projectNotes.map(n => n.updatedAt))
      : project.lastActivityAt;

    return {
      ...project,
      noteCount: projectNotes.length,
      lastActivityAt: lastActivity,
      updatedAt: Date.now(),
    };
  }

  /**
   * Get project statistics
   */
  static getProjectStats(project: Project, notes: Note[]): ProjectStats {
    const projectNotes = notes.filter(note => note.projectId === project.id);
    const allTags = projectNotes.flatMap(note => note.tags);
    const uniqueTags = Array.from(new Set(allTags));

    return {
      totalNotes: projectNotes.length,
      pinnedNotes: projectNotes.filter(note => note.isPinned).length,
      lastActivity: projectNotes.length > 0
        ? Math.max(...projectNotes.map(n => n.updatedAt))
        : 0,
      tags: uniqueTags,
    };
  }

  /**
   * Move notes to a project
   */
  static moveNotesToProject(
    notes: Note[],
    noteIds: string[],
    targetProjectId: string | null
  ): Note[] {
    return notes.map(note =>
      noteIds.includes(note.id)
        ? { ...note, projectId: targetProjectId, updatedAt: Date.now() }
        : note
    );
  }

  /**
   * Get notes for a specific project
   */
  static getProjectNotes(projectId: string | null, notes: Note[]): Note[] {
    if (projectId === null || projectId === 'all') {
      return notes; // All notes
    }
    if (projectId === 'unorganized') {
      return notes.filter(note => !note.projectId || note.projectId === null);
    }
    return notes.filter(note => note.projectId === projectId);
  }

  /**
   * Get unorganized notes (notes without a project)
   */
  static getUnorganizedNotes(notes: Note[]): Note[] {
    return notes.filter(note => !note.projectId || note.projectId === null);
  }

  /**
   * Duplicate a project (optionally with notes)
   */
  static duplicateProject(
    project: Project,
    notes: Note[],
    includeNotes: boolean = false
  ): { project: Project; notes: Note[] } {
    const now = Date.now();
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      title: `${project.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
      noteCount: includeNotes ? project.noteCount : 0,
      lastActivityAt: now,
    };

    if (!includeNotes) {
      return { project: newProject, notes: [] };
    }

    const projectNotes = notes.filter(note => note.projectId === project.id);
    const duplicatedNotes = projectNotes.map(note => ({
      ...note,
      id: crypto.randomUUID(),
      projectId: newProject.id,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
    }));

    return { project: newProject, notes: duplicatedNotes };
  }

  /**
   * Search within a project
   */
  static searchInProject(
    projectId: string | null,
    notes: Note[],
    query: string
  ): Note[] {
    const projectNotes = this.getProjectNotes(projectId, notes);
    const lowerQuery = query.toLowerCase();

    return projectNotes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Archive/unarchive a project
   */
  static toggleArchiveProject(project: Project): Project {
    return {
      ...project,
      isArchived: !project.isArchived,
      updatedAt: Date.now(),
    };
  }

  /**
   * Pin/unpin a project
   */
  static togglePinProject(project: Project): Project {
    return {
      ...project,
      isPinned: !project.isPinned,
      updatedAt: Date.now(),
    };
  }

  /**
   * Delete project and handle notes based on strategy
   */
  static deleteProject(
    projectId: string,
    notes: Note[],
    strategy: 'unorganize' | 'delete' | 'move' = 'unorganize',
    targetProjectId?: string
  ): Note[] {
    const projectNotes = notes.filter(note => note.projectId === projectId);
    const otherNotes = notes.filter(note => note.projectId !== projectId);

    switch (strategy) {
      case 'unorganize':
        // Move notes to unorganized
        return [
          ...otherNotes,
          ...projectNotes.map(note => ({ ...note, projectId: null, updatedAt: Date.now() })),
        ];

      case 'delete':
        // Delete all notes in the project
        return otherNotes;

      case 'move':
        // Move notes to another project
        if (!targetProjectId) {
          throw new Error('Target project ID required for move strategy');
        }
        return [
          ...otherNotes,
          ...projectNotes.map(note => ({ ...note, projectId: targetProjectId, updatedAt: Date.now() })),
        ];

      default:
        return notes;
    }
  }

  /**
   * Sort projects by various criteria
   */
  static sortProjects(
    projects: Project[],
    sortBy: 'title' | 'updated' | 'created' | 'noteCount' = 'updated'
  ): Project[] {
    const sorted = [...projects];

    switch (sortBy) {
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'created':
        sorted.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'noteCount':
        sorted.sort((a, b) => b.noteCount - a.noteCount);
        break;
      case 'updated':
      default:
        sorted.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
        break;
    }

    // Pinned projects always come first
    return sorted.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }

  /**
   * Validate project data
   */
  static validateProject(data: Partial<Project>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Project title is required');
    }

    if (data.title && data.title.length > 100) {
      errors.push('Project title must be less than 100 characters');
    }

    if (data.description && data.description.length > 500) {
      errors.push('Project description must be less than 500 characters');
    }

    if (data.color && !data.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push('Invalid color format (must be hex color)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export project data (for backup/sharing)
   */
  static exportProject(project: Project, notes: Note[]): string {
    const projectNotes = notes.filter(note => note.projectId === project.id);
    const exportData = {
      project,
      notes: projectNotes,
      exportedAt: Date.now(),
      version: '1.0',
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import project data
   */
  static importProject(jsonData: string): { project: Project; notes: Note[] } | null {
    try {
      const data = JSON.parse(jsonData);
      if (!data.project || !Array.isArray(data.notes)) {
        throw new Error('Invalid project data format');
      }

      // Generate new IDs to avoid conflicts
      const newProjectId = crypto.randomUUID();
      const noteIdMap = new Map<string, string>();

      const importedNotes = data.notes.map((note: Note) => {
        const newNoteId = crypto.randomUUID();
        noteIdMap.set(note.id, newNoteId);
        return {
          ...note,
          id: newNoteId,
          projectId: newProjectId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      });

      const importedProject: Project = {
        ...data.project,
        id: newProjectId,
        title: `${data.project.title} (Imported)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        noteCount: importedNotes.length,
        lastActivityAt: Date.now(),
      };

      return { project: importedProject, notes: importedNotes };
    } catch (error) {
      console.error('Error importing project:', error);
      return null;
    }
  }
}

export default ProjectService;
