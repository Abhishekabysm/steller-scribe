import { Note, Project } from '../types';
import { ProjectService } from '../services/projectService';

export interface MigrationResult {
  success: boolean;
  message: string;
  defaultProject?: Project;
}

/**
 * Migrate existing notes to the project system
 * This function checks if notes need migration and creates a default project if needed
 */
export const migrateNotesToProjects = (
  notes: Note[],
  projects: Project[],
  hasMigrated: boolean
): MigrationResult => {
  // Skip if already migrated
  if (hasMigrated) {
    return {
      success: true,
      message: 'Notes already migrated to projects',
    };
  }

  // Check if any notes lack a projectId
  const unmigratedNotes = notes.filter(note => note.projectId === undefined);
  
  if (unmigratedNotes.length === 0) {
    return {
      success: true,
      message: 'All notes already have project assignments',
    };
  }

  // If there are existing projects, don't auto-migrate (let user organize manually)
  if (projects.length > 0) {
    return {
      success: true,
      message: `${unmigratedNotes.length} notes available for organization`,
    };
  }

  // Create a default "General" project for existing notes
  const defaultProject = ProjectService.createProject({
    title: 'General Notes',
    description: 'Your existing notes migrated automatically',
    color: '#3B82F6', // Blue
    icon: '📝',
    isPinned: false,
    isArchived: false,
    settings: {},
  });

  return {
    success: true,
    message: `Created default project for ${unmigratedNotes.length} existing notes`,
    defaultProject,
  };
};

/**
 * Check if migration is needed
 */
export const needsMigration = (notes: Note[], hasMigrated: boolean): boolean => {
  if (hasMigrated) return false;
  return notes.some(note => note.projectId === undefined);
};

/**
 * Get migration statistics
 */
export const getMigrationStats = (notes: Note[]) => {
  const withProject = notes.filter(note => note.projectId !== undefined && note.projectId !== null).length;
  const withoutProject = notes.filter(note => note.projectId === undefined || note.projectId === null).length;
  
  return {
    total: notes.length,
    organized: withProject,
    unorganized: withoutProject,
    needsMigration: withoutProject > 0,
  };
};

/**
 * Apply default project to unmigrated notes
 */
export const applyDefaultProject = (notes: Note[], projectId: string): Note[] => {
  return notes.map(note => {
    if (note.projectId === undefined) {
      return {
        ...note,
        projectId,
        updatedAt: Date.now(),
      };
    }
    return note;
  });
};
