import { Note } from '../types';

export interface ShareableNote {
  title: string;
  content: string;
  tags: string[];
}

/**
 * Enhanced compression using multiple techniques
 */
function compressString(str: string): string {
  // First pass: Replace common patterns with shorter symbols
  const commonPatterns = [
    // Common words and phrases
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
    
    // Common markdown patterns
    ['## ', '§h2§'],
    ['### ', '§h3§'],
    ['#### ', '§h4§'],
    ['##### ', '§h5§'],
    ['###### ', '§h6§'],
    ['- ', '§li§'],
    ['* ', '§ul§'],
    ['1. ', '§ol§'],
    ['**', '§b§'],
    ['__', '§u§'],
    ['~~', '§s§'],
    ['```', '§cb§'],
    ['`', '§c§'],
    ['> ', '§q§'],
    ['---', '§hr§'],
    ['***', '§hr2§'],
    
    // Common programming patterns
    ['function ', '§fn§'],
    ['const ', '§ct§'],
    ['let ', '§lt§'],
    ['var ', '§vr§'],
    ['return ', '§rt§'],
    ['if ', '§if§'],
    ['else ', '§el§'],
    ['for ', '§fr§'],
    ['while ', '§wh§'],
    ['class ', '§cl§'],
    ['import ', '§im§'],
    ['export ', '§ex§'],
    ['async ', '§as§'],
    ['await ', '§aw§'],
    ['throw ', '§th§'],
    ['catch ', '§ca§'],
    ['finally ', '§fi§'],
    
    // Multiple spaces and newlines
    ['    ', '§4§'], // 4 spaces
    ['   ', '§3§'], // 3 spaces  
    ['  ', '§2§'], // 2 spaces
    ['\n\n\n', '§n3§'], // 3 newlines
    ['\n\n', '§n2§'], // 2 newlines
    ['\r\n', '§rn§'], // windows newlines
  ];
  
  let compressed = str;
  for (const [pattern, replacement] of commonPatterns) {
    compressed = compressed.split(pattern).join(replacement);
  }
  
  // Second pass: Simple Run Length Encoding for repeated characters
  compressed = compressed.replace(/(.)\1{2,}/g, (match, char) => {
    return `§r${char}${match.length}§`;
  });
  
  return compressed;
}

/**
 * Enhanced decompression to reverse the compression
 */
function decompressString(compressed: string): string {
  // First pass: Reverse Run Length Encoding
  let decompressed = compressed.replace(/§r(.)(\d+)§/g, (_, char, count) => {
    return char.repeat(parseInt(count));
  });
  
  // Second pass: Reverse pattern replacement
  const commonPatterns = [
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
    
    // Markdown patterns
    ['§h2§', '## '],
    ['§h3§', '### '],
    ['§h4§', '#### '],
    ['§h5§', '##### '],
    ['§h6§', '###### '],
    ['§li§', '- '],
    ['§ul§', '* '],
    ['§ol§', '1. '],
    ['§b§', '**'],
    ['§u§', '__'],
    ['§s§', '~~'],
    ['§cb§', '```'],
    ['§c§', '`'],
    ['§q§', '> '],
    ['§hr§', '---'],
    ['§hr2§', '***'],
    
    // Programming patterns
    ['§fn§', 'function '],
    ['§ct§', 'const '],
    ['§lt§', 'let '],
    ['§vr§', 'var '],
    ['§rt§', 'return '],
    ['§if§', 'if '],
    ['§el§', 'else '],
    ['§fr§', 'for '],
    ['§wh§', 'while '],
    ['§cl§', 'class '],
    ['§im§', 'import '],
    ['§ex§', 'export '],
    ['§as§', 'async '],
    ['§aw§', 'await '],
    ['§th§', 'throw '],
    ['§ca§', 'catch '],
    ['§fi§', 'finally '],
    
    // Spaces and newlines
    ['§4§', '    '], // 4 spaces
    ['§3§', '   '], // 3 spaces  
    ['§2§', '  '], // 2 spaces
    ['§n3§', '\n\n\n'], // 3 newlines
    ['§n2§', '\n\n'], // 2 newlines
    ['§rn§', '\r\n'], // windows newlines
  ];
  
  for (const [replacement, pattern] of commonPatterns) {
    decompressed = decompressed.split(replacement).join(pattern);
  }
  
  return decompressed;
}

/**
 * Encodes note data into a URL-safe string with enhanced compression
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
    
    // Use a higher threshold for modern browsers (1500 characters instead of 500)
    // Most browsers can handle URLs up to 2048 characters
    if (base64.length <= 1500) {
      return `c:${base64}`; // Prefix with 'c:' to indicate compressed
    }
    
    // For very large notes, we'll just use the compressed version anyway
    // and let the user know it might not work in some older browsers
    return `c:${base64}`;
  } catch (error) {
    console.error('Compression failed:', error);
    // Fallback to uncompressed base64
    try {
      const base64 = btoa(unescape(encodeURIComponent(jsonString)));
      return `u:${base64}`; // Prefix with 'u:' to indicate uncompressed
    } catch (fallbackError) {
      console.error('Base64 encoding failed:', fallbackError);
      throw new Error('Failed to encode note for sharing');
    }
  }
}

/**
 * Decodes a shared note from a URL-safe string with enhanced decompression
 */
export function decodeSharedNote(encodedData: string): ShareableNote | null {
  try {
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
    
    // Check if it's uncompressed (starts with 'u:')
    if (encodedData.startsWith('u:')) {
      const base64 = encodedData.substring(2);
      const jsonString = decodeURIComponent(escape(atob(base64)));
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