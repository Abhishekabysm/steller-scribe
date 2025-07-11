import { Note } from '../types';

export interface ShareableNote {
  title: string;
  content: string;
  tags: string[];
}

/**
 * Simple but effective compression using RLE (Run Length Encoding) + basic dictionary
 */
function compressString(str: string): string {
  // First pass: Replace common patterns
  const commonPatterns = [
    ['  ', '§2§'], // double space
    ['the ', '§t§'],
    ['and ', '§a§'],
    ['that ', '§h§'],
    ['with ', '§w§'],
    ['have ', '§v§'],
    ['this ', '§i§'],
    ['will ', '§l§'],
    ['from ', '§f§'],
    ['they ', '§y§'],
    ['know ', '§k§'],
    ['want ', '§x§'],
    ['been ', '§b§'],
    ['good ', '§g§'],
    ['much ', '§m§'],
    ['some ', '§s§'],
    ['time ', '§T§'],
    ['very ', '§V§'],
    ['when ', '§W§'],
    ['come ', '§C§'],
    ['here ', '§H§'],
    ['just ', '§J§'],
    ['like ', '§L§'],
    ['long ', '§G§'],
    ['make ', '§M§'],
    ['many ', '§N§'],
    ['over ', '§O§'],
    ['such ', '§S§'],
    ['take ', '§K§'],
    ['than ', '§A§'],
    ['them ', '§E§'],
    ['well ', '§R§'],
    ['were ', '§P§'],
    ['what ', '§Q§'],
    ['your ', '§U§'],
    ['there ', '§Z§'],
    ['would ', '§D§'],
    ['could ', '§X§'],
    ['should ', '§Y§'],
  ];
  
  let compressed = str;
  for (const [pattern, replacement] of commonPatterns) {
    compressed = compressed.split(pattern).join(replacement);
  }
  
  return compressed;
}

/**
 * Decompress string by reversing the compression
 */
function decompressString(compressed: string): string {
  // Reverse the pattern replacement
  const commonPatterns = [
    ['§2§', '  '],
    ['§t§', 'the '],
    ['§a§', 'and '],
    ['§h§', 'that '],
    ['§w§', 'with '],
    ['§v§', 'have '],
    ['§i§', 'this '],
    ['§l§', 'will '],
    ['§f§', 'from '],
    ['§y§', 'they '],
    ['§k§', 'know '],
    ['§x§', 'want '],
    ['§b§', 'been '],
    ['§g§', 'good '],
    ['§m§', 'much '],
    ['§s§', 'some '],
    ['§T§', 'time '],
    ['§V§', 'very '],
    ['§W§', 'when '],
    ['§C§', 'come '],
    ['§H§', 'here '],
    ['§J§', 'just '],
    ['§L§', 'like '],
    ['§G§', 'long '],
    ['§M§', 'make '],
    ['§N§', 'many '],
    ['§O§', 'over '],
    ['§S§', 'such '],
    ['§K§', 'take '],
    ['§A§', 'than '],
    ['§E§', 'them '],
    ['§R§', 'well '],
    ['§P§', 'were '],
    ['§Q§', 'what '],
    ['§U§', 'your '],
    ['§Z§', 'there '],
    ['§D§', 'would '],
    ['§X§', 'could '],
    ['§Y§', 'should '],
  ];
  
  let decompressed = compressed;
  for (const [replacement, pattern] of commonPatterns) {
    decompressed = decompressed.split(replacement).join(pattern);
  }
  
  return decompressed;
}

/**
 * Generate a short hash for large content
 */
function generateShortHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Store note in localStorage with a short hash
 */
function storeNoteWithHash(note: ShareableNote): string {
  const hash = generateShortHash(JSON.stringify(note));
  const key = `share_${hash}`;
  
  try {
    localStorage.setItem(key, JSON.stringify(note));
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    
    // Clean up old notes periodically
    if (Math.random() < 0.1) { // 10% chance to run cleanup
      cleanupOldSharedNotes();
    }
    
    return hash;
  } catch (error) {
    console.error('Failed to store note in localStorage:', error);
    throw error;
  }
}

/**
 * Retrieve note from localStorage using hash
 */
function retrieveNoteFromHash(hash: string): ShareableNote | null {
  const key = `share_${hash}`;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      // Update timestamp to mark as recently accessed
      localStorage.setItem(`${key}_timestamp`, Date.now().toString());
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve note from localStorage:', error);
    return null;
  }
}

/**
 * Encodes note data into a URL-safe string (compressed or hash-based)
 */
export function encodeNoteForSharing(note: Note): string {
  const shareableNote: ShareableNote = {
    title: note.title,
    content: note.content,
    tags: note.tags
  };
  
  const jsonString = JSON.stringify(shareableNote);
  
  // Try compression first
  try {
    const compressed = compressString(jsonString);
    const base64 = btoa(unescape(encodeURIComponent(compressed)));
    
    // If the compressed version is still too long (>500 chars), use hash-based storage
    if (base64.length > 500) {
      const hash = storeNoteWithHash(shareableNote);
      return `h:${hash}`; // Prefix with 'h:' to indicate hash-based
    }
    
    return `c:${base64}`; // Prefix with 'c:' to indicate compressed
  } catch (error) {
    console.error('Compression failed, falling back to hash storage:', error);
    const hash = storeNoteWithHash(shareableNote);
    return `h:${hash}`;
  }
}

/**
 * Decodes a shared note from a URL-safe string (compressed or hash-based)
 */
export function decodeSharedNote(encodedData: string): ShareableNote | null {
  try {
    // Check if it's hash-based (starts with 'h:')
    if (encodedData.startsWith('h:')) {
      const hash = encodedData.substring(2);
      return retrieveNoteFromHash(hash);
    }
    
    // Check if it's compressed (starts with 'c:')
    if (encodedData.startsWith('c:')) {
      const base64 = encodedData.substring(2);
      const compressed = decodeURIComponent(escape(atob(base64)));
      const jsonString = decompressString(compressed);
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
    }
    
    // Fallback: try to decode as legacy base64 format (for backward compatibility)
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

/**
 * Clean up old shared notes from localStorage to prevent it from growing too large
 */
export function cleanupOldSharedNotes(): void {
  try {
    const keys = Object.keys(localStorage);
    const shareKeys = keys.filter(key => key.startsWith('share_'));
    
    // Keep only the most recent 50 shared notes
    const maxSharedNotes = 50;
    
    if (shareKeys.length > maxSharedNotes) {
      // Sort by last access time (we'll add timestamps to stored notes)
      const sortedKeys = shareKeys.sort((a, b) => {
        const aTime = localStorage.getItem(`${a}_timestamp`) || '0';
        const bTime = localStorage.getItem(`${b}_timestamp`) || '0';
        return parseInt(bTime) - parseInt(aTime);
      });
      
      // Remove the oldest ones
      for (let i = maxSharedNotes; i < sortedKeys.length; i++) {
        localStorage.removeItem(sortedKeys[i]);
        localStorage.removeItem(`${sortedKeys[i]}_timestamp`);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup old shared notes:', error);
  }
}