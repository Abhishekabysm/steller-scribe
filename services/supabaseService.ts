import { createClient } from '@supabase/supabase-js';
import { Note } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anonymous key are required.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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