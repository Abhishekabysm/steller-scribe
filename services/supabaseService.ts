import { createClient } from '@supabase/supabase-js';
import { Note, Project } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anonymous key are required.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =====================================================
// Note Sharing Functions
// =====================================================

export const shareNote = async (note: Note): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('shared_notes')
      .insert([{ content: { title: note.title, content: note.content, tags: note.tags } }])
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error sharing note:', error);
    return null;
  }
};

export const getNote = async (id: string): Promise<Note | null> => {
  try {
    const { data, error } = await supabase
      .from('shared_notes')
      .select('content')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data?.content || null;
  } catch (error) {
    console.error('Error getting note:', error);
    return null;
  }
};

// =====================================================
// Project CRUD Functions
// =====================================================

/**
 * Create a new project
 */
export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        title: project.title,
        description: project.description,
        color: project.color,
        icon: project.icon,
        is_pinned: project.isPinned,
        is_archived: project.isArchived,
        settings: project.settings,
        note_count: project.noteCount || 0,
        last_activity_at: new Date(project.lastActivityAt).toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return data ? convertSupabaseProject(data) : null;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
};

/**
 * Get all projects for the current user
 */
export const getProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('last_activity_at', { ascending: false });

    if (error) throw error;

    return data ? data.map(convertSupabaseProject) : [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

/**
 * Get a single project by ID
 */
export const getProject = async (id: string): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data ? convertSupabaseProject(data) : null;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
};

/**
 * Update a project
 */
export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project | null> => {
  try {
    const supabaseUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.color !== undefined) supabaseUpdates.color = updates.color;
    if (updates.icon !== undefined) supabaseUpdates.icon = updates.icon;
    if (updates.isPinned !== undefined) supabaseUpdates.is_pinned = updates.isPinned;
    if (updates.isArchived !== undefined) supabaseUpdates.is_archived = updates.isArchived;
    if (updates.settings !== undefined) supabaseUpdates.settings = updates.settings;

    const { data, error } = await supabase
      .from('projects')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data ? convertSupabaseProject(data) : null;
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
};

/**
 * Recalculate project metadata (note count, last activity)
 */
export const recalculateProjectMetadata = async (projectId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('recalculate_project_metadata', {
      project_uuid: projectId,
    });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error recalculating project metadata:', error);
    return false;
  }
};

/**
 * Convert Supabase project data to app Project type
 */
function convertSupabaseProject(data: any): Project {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    color: data.color,
    icon: data.icon,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
    isPinned: data.is_pinned,
    isArchived: data.is_archived,
    settings: data.settings || {},
    noteCount: data.note_count || 0,
    lastActivityAt: new Date(data.last_activity_at).getTime(),
  };
}

// =====================================================
// Sync Functions (for future use with real-time sync)
// =====================================================

/**
 * Subscribe to project changes
 */
export const subscribeToProjects = (callback: (payload: any) => void) => {
  return supabase
    .channel('projects')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, callback)
    .subscribe();
};

/**
 * Unsubscribe from project changes
 */
export const unsubscribeFromProjects = (subscription: any) => {
  return supabase.removeChannel(subscription);
};

export default supabase;