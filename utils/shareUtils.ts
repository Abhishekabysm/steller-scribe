import { Note } from '../types';
import { shareNote as supabaseShareNote, getNote as supabaseGetNote } from '../services/supabaseService';

export type ShareableNote = Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'isPinned'>;

/**
 * Generates a shareable URL by storing the note in Supabase.
 * @param note The note to share.
 * @returns The shareable URL, or null if sharing failed.
 */
export async function generateShareableUrl(note: Note): Promise<string | null> {
  const noteId = await supabaseShareNote(note);

  if (!noteId) {
    return null;
  }

  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#share_id=${noteId}`;
}

/**
 * Extracts a shared note from the URL by fetching it from Supabase.
 * @returns The shared note, or null if not found.
 */
export async function getSharedNoteFromUrl(): Promise<ShareableNote | null> {
  const hash = window.location.hash;
  if (!hash.startsWith('#share_id=')) {
    return null;
  }

  const sharedId = hash.substring(10); // #share_id= is 10 chars
  if (!sharedId) {
    return null;
  }

  const note = await supabaseGetNote(sharedId);
  return note;
}

/**
 * Removes the share fragment from the URL without reloading the page.
 */
export function clearShareFromUrl(): void {
  const url = new URL(window.location.href);
  if (url.hash.startsWith('#share_id=')) {
    url.hash = '';
    window.history.replaceState({}, '', url.toString());
  }
}