import { Note } from '../types';

export interface ShareableNote {
  title: string;
  content: string;
  tags: string[];
}

/**
 * Encodes note data into a URL-safe base64 string
 */
export function encodeNoteForSharing(note: Note): string {
  const shareableNote: ShareableNote = {
    title: note.title,
    content: note.content,
    tags: note.tags
  };
  
  const jsonString = JSON.stringify(shareableNote);
  const base64 = btoa(unescape(encodeURIComponent(jsonString)));
  return base64;
}

/**
 * Decodes a shared note from a URL-safe base64 string
 */
export function decodeSharedNote(encodedData: string): ShareableNote | null {
  try {
    const jsonString = decodeURIComponent(escape(atob(encodedData)));
    const shareableNote = JSON.parse(jsonString) as ShareableNote;
    
    // Validate the structure
    if (
      typeof shareableNote.title === 'string' &&
      typeof shareableNote.content === 'string' &&
      Array.isArray(shareableNote.tags)
    ) {
      return shareableNote;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to decode shared note:', error);
    return null;
  }
}

/**
 * Generates a shareable URL for a note
 */
export function generateShareableUrl(note: Note): string {
  const encodedNote = encodeNoteForSharing(note);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?share=${encodedNote}`;
}

/**
 * Extracts shared note data from URL parameters
 */
export function getSharedNoteFromUrl(): ShareableNote | null {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedData = urlParams.get('share');
  
  if (!sharedData) {
    return null;
  }
  
  return decodeSharedNote(sharedData);
}

/**
 * Removes the share parameter from the URL without reloading the page
 */
export function clearShareFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState({}, '', url.toString());
}