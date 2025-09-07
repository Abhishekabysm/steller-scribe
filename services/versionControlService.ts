import { Note, NoteVersion, VersionControlState } from '../types';

const VERSION_STORAGE_KEY = 'stellar-scribe-note-versions';
const MAX_VERSIONS_PER_NOTE = 50; // Keep last 50 versions per note
const AUTO_SAVE_INTERVAL = 300000; // 5 minutes (300 seconds)
const MIN_TIME_BETWEEN_SAVES = 60000; // Minimum 1 minute between saves
const MIN_CHANGE_THRESHOLD = 10; // Minimum characters changed to create a version
const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB max content size per version

// ============================================================================
// RESTORE BEHAVIOR CONFIGURATION
// ============================================================================
// Set this to true if you want restore operations to create new version entries
// Set this to false if you want restore operations to just apply content without new entries
// 
// true = Restore creates new version (e.g., v3 "Restored to version 1")
// false = Restore just applies content (cleaner history)
const RESTORE_CONFIG = {
  createNewVersionOnRestore: false, // Change this value to switch behavior
} as const;

// Flag to prevent version creation during restore operations
let isRestoring = false;

// Configuration for content comparison
const CONTENT_COMPARISON_CONFIG = {
  ignoreTrailingWhitespace: true,    // Ignore trailing spaces/tabs
  ignoreLeadingWhitespace: true,     // Ignore leading spaces as user requested
  ignoreEmptyLines: true,            // Ignore empty lines at the end
  ignoreWhitespaceOnlyLines: true,   // Ignore lines that are only whitespace
  minMeaningfulChanges: 1,           // Minimum meaningful changes to create version
} as const;

// Storage management configuration
const STORAGE_CONFIG = {
  maxVersionsPerNote: 50,
  maxTotalSize: 10 * 1024 * 1024, // 10MB
  compressionEnabled: true,
  cleanupStrategy: 'oldest-first' as const,
  storageWarningThreshold: 0.8, // 80% of quota
} as const;

/**
 * Validate version data integrity
 */
export const validateVersion = (version: NoteVersion): boolean => {
  return !!(
    version.id &&
    version.noteId &&
    version.version > 0 &&
    version.content &&
    version.content.length <= MAX_CONTENT_SIZE &&
    version.createdAt &&
    version.title
  );
};

/**
 * Validate note data integrity
 */
export const validateNote = (note: Note): boolean => {
  return !!(
    note.id &&
    note.title &&
    note.content &&
    note.content.length <= MAX_CONTENT_SIZE &&
    note.createdAt &&
    note.updatedAt
  );
};

/**
 * Check if content has meaningful changes (ignoring whitespace-only changes)
 */
export const hasMeaningfulChanges = (oldContent: string, newContent: string): boolean => {
  // Normalize content based on configuration
  const normalizeContent = (content: string): string => {
    let lines = content.split('\n');
    
    if (CONTENT_COMPARISON_CONFIG.ignoreTrailingWhitespace) {
      lines = lines.map(line => line.trimEnd());
    }
    
    if (CONTENT_COMPARISON_CONFIG.ignoreLeadingWhitespace) {
      lines = lines.map(line => line.trimStart());
    }
    
    if (CONTENT_COMPARISON_CONFIG.ignoreEmptyLines) {
      // Remove empty lines from the end
      while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
      }
    }
    
    if (CONTENT_COMPARISON_CONFIG.ignoreWhitespaceOnlyLines) {
      lines = lines.filter(line => line.trim() !== '');
    }
    
    return lines.join('\n');
  };

  const normalizedOld = normalizeContent(oldContent);
  const normalizedNew = normalizeContent(newContent);
  
  return normalizedOld !== normalizedNew;
};

/**
 * Get a summary of what changes would be ignored
 */
export const getIgnoredChangesSummary = (oldContent: string, newContent: string): {
  hasIgnoredChanges: boolean;
  ignoredTrailingWhitespace: boolean;
  ignoredEmptyLines: boolean;
  ignoredWhitespaceOnlyLines: boolean;
} => {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  let ignoredTrailingWhitespace = false;
  let ignoredEmptyLines = false;
  let ignoredWhitespaceOnlyLines = false;
  
  // Check for trailing whitespace differences
  if (CONTENT_COMPARISON_CONFIG.ignoreTrailingWhitespace) {
    const oldTrimmed = oldLines.map(line => line.trimEnd()).join('\n');
    const newTrimmed = newLines.map(line => line.trimEnd()).join('\n');
    if (oldContent !== oldTrimmed || newContent !== newTrimmed) {
      ignoredTrailingWhitespace = true;
    }
  }
  
  // Check for empty lines at the end
  if (CONTENT_COMPARISON_CONFIG.ignoreEmptyLines) {
    const oldWithoutTrailingEmpty = oldContent.replace(/\n+$/, '');
    const newWithoutTrailingEmpty = newContent.replace(/\n+$/, '');
    if (oldContent !== oldWithoutTrailingEmpty || newContent !== newWithoutTrailingEmpty) {
      ignoredEmptyLines = true;
    }
  }
  
  // Check for whitespace-only lines
  if (CONTENT_COMPARISON_CONFIG.ignoreWhitespaceOnlyLines) {
    const oldWithoutWhitespaceOnly = oldLines.filter(line => line.trim() !== '').join('\n');
    const newWithoutWhitespaceOnly = newLines.filter(line => line.trim() !== '').join('\n');
    if (oldContent !== oldWithoutWhitespaceOnly || newContent !== newWithoutWhitespaceOnly) {
      ignoredWhitespaceOnlyLines = true;
    }
  }
  
  const hasIgnoredChanges = ignoredTrailingWhitespace || ignoredEmptyLines || ignoredWhitespaceOnlyLines;
  
  return {
    hasIgnoredChanges,
    ignoredTrailingWhitespace,
    ignoredEmptyLines,
    ignoredWhitespaceOnlyLines
  };
};

/**
 * Calculate diff statistics between two strings
 */
export const calculateDiffStats = (oldContent: string, newContent: string) => {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  let addedLines = 0;
  let removedLines = 0;
  let changedChars = 0;
  
  // Remove trailing empty lines for comparison
  while (oldLines.length > 0 && oldLines[oldLines.length - 1].trim() === '') {
    oldLines.pop();
  }
  while (newLines.length > 0 && newLines[newLines.length - 1].trim() === '') {
    newLines.pop();
  }
  
  // Use a more sophisticated diff algorithm
  const diff = calculateLineDiff(oldLines, newLines);
  
  // Count the different types of changes
  for (const change of diff) {
    switch (change.type) {
      case 'added':
        addedLines++;
        break;
      case 'removed':
        removedLines++;
        break;
      case 'modified':
        // For modified lines, count character differences
        const oldLine = change.oldLine || '';
        const newLine = change.newLine || '';
        const maxChars = Math.max(oldLine.length, newLine.length);
        for (let j = 0; j < maxChars; j++) {
          if (oldLine[j] !== newLine[j]) {
            changedChars++;
          }
        }
        break;
    }
  }
  
  return { addedLines, removedLines, changedChars };
};

/**
 * Calculate line-by-line diff using a smarter algorithm
 * This handles cases where content is inserted/deleted without affecting surrounding lines
 */
function calculateLineDiff(oldLines: string[], newLines: string[]): Array<{
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldLine?: string;
  newLine?: string;
  oldIndex?: number;
  newIndex?: number;
}> {
  const result: Array<{
    type: 'added' | 'removed' | 'modified' | 'unchanged';
    oldLine?: string;
    newLine?: string;
    oldIndex?: number;
    newIndex?: number;
  }> = [];
  
  // Create a map of line content to positions for quick lookup
  const oldLineMap = new Map<string, number[]>();
  const newLineMap = new Map<string, number[]>();
  
  // Build maps for both arrays
  oldLines.forEach((line, index) => {
    if (!oldLineMap.has(line)) {
      oldLineMap.set(line, []);
    }
    oldLineMap.get(line)!.push(index);
  });
  
  newLines.forEach((line, index) => {
    if (!newLineMap.has(line)) {
      newLineMap.set(line, []);
    }
    newLineMap.get(line)!.push(index);
  });
  
  // Find matching lines that appear in both arrays
  const matches: Array<{oldIndex: number, newIndex: number}> = [];
  const usedOld = new Set<number>();
  const usedNew = new Set<number>();
  
  // Find exact matches first
  for (const [line, oldIndices] of oldLineMap) {
    if (newLineMap.has(line)) {
      const newIndices = newLineMap.get(line)!;
      // Match as many as possible
      const minCount = Math.min(oldIndices.length, newIndices.length);
      for (let i = 0; i < minCount; i++) {
        const oldIndex = oldIndices[i];
        const newIndex = newIndices[i];
        if (!usedOld.has(oldIndex) && !usedNew.has(newIndex)) {
          matches.push({oldIndex, newIndex});
          usedOld.add(oldIndex);
          usedNew.add(newIndex);
        }
      }
    }
  }
  
  // Sort matches by old index to maintain order
  matches.sort((a, b) => a.oldIndex - b.oldIndex);
  
  // Process all lines
  let oldIndex = 0, newIndex = 0, matchIndex = 0;
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    // Check if current positions match
    const currentMatch = matchIndex < matches.length && 
                        matches[matchIndex].oldIndex === oldIndex && 
                        matches[matchIndex].newIndex === newIndex;
    
    if (currentMatch) {
      // Lines match
      result.push({
        type: 'unchanged',
        oldLine: oldLines[oldIndex],
        newLine: newLines[newIndex],
        oldIndex: oldIndex,
        newIndex: newIndex
      });
      oldIndex++;
      newIndex++;
      matchIndex++;
    } else if (newIndex < newLines.length && !usedNew.has(newIndex)) {
      // Line was added
      result.push({
        type: 'added',
        newLine: newLines[newIndex],
        newIndex: newIndex
      });
      newIndex++;
    } else if (oldIndex < oldLines.length && !usedOld.has(oldIndex)) {
      // Line was removed
      result.push({
        type: 'removed',
        oldLine: oldLines[oldIndex],
        oldIndex: oldIndex
      });
      oldIndex++;
    } else {
      // Skip used lines
      oldIndex++;
      newIndex++;
    }
  }
  
  return result;
}



/**
 * Generate a change description based on diff stats
 */
export const generateChangeDescription = (diffStats: ReturnType<typeof calculateDiffStats>): string => {
  const { addedLines, removedLines, changedChars } = diffStats;
  
  if (addedLines > 0 && removedLines === 0) {
    return `Added ${addedLines} line${addedLines > 1 ? 's' : ''}`;
  } else if (removedLines > 0 && addedLines === 0) {
    return `Removed ${removedLines} line${removedLines > 1 ? 's' : ''}`;
  } else if (addedLines > 0 && removedLines > 0) {
    return `Modified ${addedLines + removedLines} line${addedLines + removedLines > 1 ? 's' : ''}`;
  } else if (changedChars > 0) {
    return `Changed ${changedChars} character${changedChars > 1 ? 's' : ''}`;
  }
  
  return 'Minor changes';
};

/**
 * Version Control Service
 */
export class VersionControlService {
  private static instance: VersionControlService;
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private versionCache: Map<string, NoteVersion[]> = new Map();
  private lastSaveTimes: Map<string, number> = new Map();

  static getInstance(): VersionControlService {
    if (!VersionControlService.instance) {
      VersionControlService.instance = new VersionControlService();
    }
    return VersionControlService.instance;
  }

  /**
   * Get all versions for a note
   */
  getNoteVersions(noteId: string): NoteVersion[] {
    if (this.versionCache.has(noteId)) {
      return this.versionCache.get(noteId)!;
    }

    try {
      const storageKey = `${VERSION_STORAGE_KEY}-${noteId}`;
      const stored = localStorage.getItem(storageKey);
      let versions: NoteVersion[] = stored ? JSON.parse(stored) : [];
      
      // Validate and clean versions
      versions = this.validateAndCleanVersions(versions, noteId);
      
      // Sort by version number descending (newest first)
      versions.sort((a, b) => b.version - a.version);
      
      this.versionCache.set(noteId, versions);
      return versions;
    } catch (error) {
      console.error('Error loading note versions:', error);
      return [];
    }
  }

  /**
   * Validate and clean version data
   */
  private validateAndCleanVersions(versions: NoteVersion[], noteId: string): NoteVersion[] {
    // Filter out invalid versions
    const validVersions = versions.filter(version => validateVersion(version));
    
    // Remove duplicate versions (keep the latest)
    const uniqueVersions = validVersions.filter((version, index, arr) => 
      arr.findIndex(v => v.version === version.version) === index
    );
    
    // If we lost data, log it
    if (validVersions.length !== versions.length) {
      console.warn(`Cleaned ${versions.length - validVersions.length} invalid versions for note ${noteId}`);
    }
    
    if (uniqueVersions.length !== validVersions.length) {
      console.warn(`Removed ${validVersions.length - uniqueVersions.length} duplicate versions for note ${noteId}`);
    }
    
    return uniqueVersions;
  }

  /**
   * Save a new version of a note
   */
  saveVersion(
    note: Note, 
    changeType: 'auto' | 'manual' | 'restore' = 'auto',
    changeDescription?: string
  ): NoteVersion | null {
    console.log('saveVersion called:', { noteId: note.id, changeType, currentVersion: note.version, isRestoring });
    
    // Validate note data
    if (!validateNote(note)) {
      console.error('Invalid note data, cannot save version');
      return null;
    }
    
    // Check content size limit
    if (note.content.length > MAX_CONTENT_SIZE) {
      console.error('Note content too large, cannot save version');
      return null;
    }
    
    // Prevent version creation during restore operations
    if (isRestoring && changeType !== 'restore') {
      console.log('Preventing version creation during restore');
      return null;
    }
    
    // Check minimum time between saves for auto-saves
    if (changeType === 'auto') {
      const lastSaveTime = this.lastSaveTimes.get(note.id) || 0;
      const timeSinceLastSave = Date.now() - lastSaveTime;
      if (timeSinceLastSave < MIN_TIME_BETWEEN_SAVES) {
        console.log('Skipping auto-save - too soon since last save');
        return null;
      }
    }
    
    // Check storage quota before saving
    const storageStatus = this.checkStorageQuota();
    if (storageStatus.needsCleanup) {
      console.warn('Storage quota warning, cleaning up old versions...');
      this.cleanupOldVersions(STORAGE_CONFIG.maxVersionsPerNote - 10);
    }
    
    try {
      const versions = this.getNoteVersions(note.id);
      
      // Determine the next version number
      let newVersionNumber: number;
      if (versions.length === 0) {
        // If no versions exist, start from v1
        newVersionNumber = 1;
      } else {
        // If versions exist, use the highest version number + 1
        const highestVersion = Math.max(...versions.map(v => v.version));
        newVersionNumber = highestVersion + 1;
      }
      
      // Calculate diff stats if there's a previous version
      let diffStats;
      if (versions.length > 0) {
        const lastVersion = versions[0]; // Most recent version
        
        // First check if there are meaningful changes (ignoring whitespace-only changes)
        if (!hasMeaningfulChanges(lastVersion.content, note.content)) {
          // No meaningful changes detected - don't create a new version
          return null;
        }
        
        diffStats = calculateDiffStats(lastVersion.content, note.content);
        
        // Skip auto-save if changes are too small (but allow manual saves)
        if (changeType === 'auto' && 
            diffStats.addedLines === 0 && 
            diffStats.removedLines === 0 && 
            diffStats.changedChars < MIN_CHANGE_THRESHOLD) {
          return null;
        }
      }

      const newVersion: NoteVersion = {
        id: crypto.randomUUID(),
        noteId: note.id,
        version: newVersionNumber,
        title: note.title,
        content: note.content,
        createdAt: Date.now(),
        changeDescription: changeDescription || (diffStats ? generateChangeDescription(diffStats) : 'Initial version'),
        changeType,
        diffStats,
      };

      // Add to versions array
      versions.unshift(newVersion); // Add to beginning (newest first)
      
      // Limit versions per note
      if (versions.length > MAX_VERSIONS_PER_NOTE) {
        versions.splice(MAX_VERSIONS_PER_NOTE);
      }

      // Save to localStorage using safe operation
      const storageKey = `${VERSION_STORAGE_KEY}-${note.id}`;
      const saveResult = this.safeStorageOperation(() => {
        localStorage.setItem(storageKey, JSON.stringify(versions));
        return true;
      });
      
      if (!saveResult) {
        console.error('Failed to save version to storage');
        return null;
      }
      
      // Update cache
      this.versionCache.set(note.id, versions);
      
      // Update last save time
      this.lastSaveTimes.set(note.id, Date.now());

      return newVersion;
    } catch (error) {
      console.error('Error saving note version:', error);
      return null;
    }
  }

  /**
   * Restore a note to a specific version
   */
  restoreVersion(noteId: string, versionNumber: number): NoteVersion | null {
    try {
      console.log('restoreVersion called:', { noteId, versionNumber });
      
      // Set restore flag to prevent unwanted version creation
      isRestoring = true;
      
      const versions = this.getNoteVersions(noteId);
      const targetVersion = versions.find(v => v.version === versionNumber);
      
      if (!targetVersion) {
        isRestoring = false;
        return null;
      }

      // If configured to create new version on restore, do so
      if (RESTORE_CONFIG.createNewVersionOnRestore) {
        // Create a new version representing the restore
        const restoreVersion: NoteVersion = {
          id: crypto.randomUUID(),
          noteId: noteId,
          version: this.getNextVersionNumber(noteId),
          title: targetVersion.title,
          content: targetVersion.content,
          createdAt: Date.now(),
          changeDescription: `Restored to version ${versionNumber}`,
          changeType: 'restore',
          diffStats: {
            addedLines: 0,
            removedLines: 0,
            changedChars: 0,
          },
        };

        // Add restore version to history
        versions.unshift(restoreVersion);
        
        // Save to localStorage
        const storageKey = `${VERSION_STORAGE_KEY}-${noteId}`;
        localStorage.setItem(storageKey, JSON.stringify(versions));
        
        // Update cache
        this.versionCache.set(noteId, versions);

        isRestoring = false;
        return restoreVersion;
      } else {
        // Just return the target version without creating a new entry
        isRestoring = false;
        return targetVersion;
      }
    } catch (error) {
      console.error('Error restoring note version:', error);
      isRestoring = false;
      return null;
    }
  }

  /**
   * Delete all versions for a note
   */
  deleteNoteVersions(noteId: string): void {
    try {
      const storageKey = `${VERSION_STORAGE_KEY}-${noteId}`;
      localStorage.removeItem(storageKey);
      this.versionCache.delete(noteId);
      this.clearAutoSaveTimer(noteId);
    } catch (error) {
      console.error('Error deleting note versions:', error);
    }
  }

  /**
   * Reset version numbering for a note (useful when all versions are deleted)
   */
  resetVersionNumbering(noteId: string): void {
    try {
      // Clear the version cache for this note
      this.versionCache.delete(noteId);
      
      // The next time saveVersion is called, it will start from v1
      // since there are no versions in the cache
    } catch (error) {
      console.error('Error resetting version numbering:', error);
    }
  }

  /**
   * Get the next version number for a note
   */
  getNextVersionNumber(noteId: string): number {
    const versions = this.getNoteVersions(noteId);
    if (versions.length === 0) {
      return 1; // Start from v1 if no versions exist
    } else {
      const highestVersion = Math.max(...versions.map(v => v.version));
      return highestVersion + 1;
    }
  }

  /**
   * Delete a specific version
   */
  deleteVersion(noteId: string, versionNumber: number, currentNoteVersion?: number): boolean {
    try {
      // Prevent deletion of current version
      if (currentNoteVersion && versionNumber === currentNoteVersion) {
        console.warn('Cannot delete current version');
        return false;
      }
      
      const versions = this.getNoteVersions(noteId);
      const filteredVersions = versions.filter(v => v.version !== versionNumber);
      
      if (filteredVersions.length === versions.length) {
        return false; // Version not found
      }

      const storageKey = `${VERSION_STORAGE_KEY}-${noteId}`;
      
      if (filteredVersions.length === 0) {
        // If all versions are deleted, remove the storage key entirely
        localStorage.removeItem(storageKey);
        this.versionCache.delete(noteId);
        // Reset version numbering for this note
        this.resetVersionNumbering(noteId);
      } else {
        // Update with remaining versions using safe storage
        const saveResult = this.safeStorageOperation(() => {
          localStorage.setItem(storageKey, JSON.stringify(filteredVersions));
          return true;
        });
        
        if (!saveResult) {
          console.error('Failed to save versions after deletion');
          return false;
        }
        
        this.versionCache.set(noteId, filteredVersions);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting version:', error);
      return false;
    }
  }

  /**
   * Get the current version number for a note (highest version number)
   */
  getCurrentVersionNumber(noteId: string): number {
    const versions = this.getNoteVersions(noteId);
    if (versions.length === 0) {
      return 0; // No versions exist
    } else {
      return Math.max(...versions.map(v => v.version));
    }
  }

  /**
   * Schedule auto-save for a note
   */
  scheduleAutoSave(noteId: string, note: Note): void {
    this.clearAutoSaveTimer(noteId);
    
    const timer = setTimeout(() => {
      this.saveVersion(note, 'auto');
      this.autoSaveTimers.delete(noteId);
    }, AUTO_SAVE_INTERVAL);
    
    this.autoSaveTimers.set(noteId, timer);
  }

  /**
   * Clear auto-save timer for a note
   */
  clearAutoSaveTimer(noteId: string): void {
    const timer = this.autoSaveTimers.get(noteId);
    if (timer) {
      clearTimeout(timer);
      this.autoSaveTimers.delete(noteId);
    }
  }

  /**
   * Get version control state for a note
   */
  getVersionControlState(noteId: string): VersionControlState {
    const versions = this.getNoteVersions(noteId);
    const currentVersion = versions.length > 0 ? versions[0].version : 0;
    
    return {
      versions,
      currentVersion,
      lastSavedVersion: currentVersion,
      hasUnsavedChanges: false, // This will be managed by the component
    };
  }

  /**
   * Compare two versions and return diff
   */
  compareVersions(noteId: string, version1: number, version2: number): {
    version1: NoteVersion | null;
    version2: NoteVersion | null;
    diff: ReturnType<typeof calculateDiffStats>;
  } {
    const versions = this.getNoteVersions(noteId);
    const v1 = versions.find(v => v.version === version1) || null;
    const v2 = versions.find(v => v.version === version2) || null;
    
    if (!v1 || !v2) {
      return { version1: v1, version2: v2, diff: { addedLines: 0, removedLines: 0, changedChars: 0 } };
    }
    
    const diff = calculateDiffStats(v1.content, v2.content);
    return { version1: v1, version2: v2, diff };
  }

  /**
   * Get storage size for all versions
   */
  getStorageSize(): { totalSize: number; noteCount: number; versionCount: number } {
    let totalSize = 0;
    let noteCount = 0;
    let versionCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(VERSION_STORAGE_KEY)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
          noteCount++;
          try {
            const versions = JSON.parse(value);
            versionCount += versions.length;
          } catch (error) {
            console.error('Error parsing version data:', error);
          }
        }
      }
    }
    
    return { totalSize, noteCount, versionCount };
  }

  /**
   * Get the configured maximum total storage size for versions
   */
  getMaxStorageSize(): number {
    return STORAGE_CONFIG.maxTotalSize;
  }

  /**
   * Check storage quota and cleanup if needed
   */
  checkStorageQuota(): { isHealthy: boolean; usagePercent: number; needsCleanup: boolean } {
    const { totalSize } = this.getStorageSize();
    const usagePercent = totalSize / STORAGE_CONFIG.maxTotalSize;
    
    return {
      isHealthy: usagePercent < STORAGE_CONFIG.storageWarningThreshold,
      usagePercent,
      needsCleanup: usagePercent > STORAGE_CONFIG.storageWarningThreshold
    };
  }

  /**
   * Emergency cleanup when storage is full
   */
  emergencyCleanup(): number {
    let cleanedCount = 0;
    
    try {
      // Get all version keys
      const versionKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(VERSION_STORAGE_KEY)) {
          versionKeys.push(key);
        }
      }
      
      // Sort by last modified time (oldest first)
      versionKeys.sort((a, b) => {
        const aTime = localStorage.getItem(a) ? JSON.parse(localStorage.getItem(a)!)[0]?.createdAt || 0 : 0;
        const bTime = localStorage.getItem(b) ? JSON.parse(localStorage.getItem(b)!)[0]?.createdAt || 0 : 0;
        return aTime - bTime;
      });
      
      // Remove oldest versions until we're under threshold
      for (const key of versionKeys) {
        if (this.checkStorageQuota().isHealthy) break;
        
        localStorage.removeItem(key);
        cleanedCount++;
        
        // Update cache
        const noteId = key.replace(`${VERSION_STORAGE_KEY}-`, '');
        this.versionCache.delete(noteId);
      }
    } catch (error) {
      console.error('Error during emergency cleanup:', error);
    }
    
    return cleanedCount;
  }

  /**
   * Safe storage operation with error handling
   */
  private safeStorageOperation<T>(operation: () => T): T | null {
    try {
      return operation();
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, attempting cleanup...');
        const cleanedCount = this.emergencyCleanup();
        if (cleanedCount > 0) {
          console.log(`Cleaned up ${cleanedCount} versions`);
          // Retry the operation
          try {
            return operation();
          } catch (retryError) {
            console.error('Operation failed even after cleanup:', retryError);
            return null;
          }
        }
      }
      console.error('Storage operation failed:', error);
      return null;
    }
  }

  /**
   * Check if content changes would be considered meaningful
   */
  checkMeaningfulChanges(oldContent: string, newContent: string): {
    hasMeaningfulChanges: boolean;
    ignoredChanges: ReturnType<typeof getIgnoredChangesSummary>;
  } {
    const hasMeaningful = hasMeaningfulChanges(oldContent, newContent);
    const ignoredChanges = getIgnoredChangesSummary(oldContent, newContent);
    
    return {
      hasMeaningfulChanges: hasMeaningful,
      ignoredChanges
    };
  }

  /**
   * Reset the restore flag (for debugging/emergency use)
   */
  resetRestoreFlag(): void {
    isRestoring = false;
  }

  /**
   * Get the current restore state (for debugging)
   */
  getRestoreState(): boolean {
    return isRestoring;
  }

  /**
   * Clean up old versions for a specific note
   */
  cleanupNoteVersions(noteId: string, maxVersions: number = 10): number {
    const versions = this.getNoteVersions(noteId);
    if (versions.length <= maxVersions) {
      return 0;
    }
    
    const cleanedVersions = versions.slice(0, maxVersions);
    const storageKey = `${VERSION_STORAGE_KEY}-${noteId}`;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(cleanedVersions));
      this.versionCache.set(noteId, cleanedVersions);
      return versions.length - cleanedVersions.length;
    } catch (error) {
      console.error('Error cleaning up note versions:', error);
      return 0;
    }
  }

  /**
   * Clean up old versions to free storage space
   */
  cleanupOldVersions(maxVersionsPerNote: number = 20): number {
    let cleanedCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(VERSION_STORAGE_KEY)) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const versions: NoteVersion[] = JSON.parse(value);
            if (versions.length > maxVersionsPerNote) {
              const cleanedVersions = versions.slice(0, maxVersionsPerNote);
              localStorage.setItem(key, JSON.stringify(cleanedVersions));
              cleanedCount += versions.length - cleanedVersions.length;
              
              // Update cache
              const noteId = key.replace(`${VERSION_STORAGE_KEY}-`, '');
              this.versionCache.set(noteId, cleanedVersions);
            }
          } catch (error) {
            console.error('Error cleaning up versions:', error);
          }
        }
      }
    }
    
    return cleanedCount;
  }

  /**
   * Get auto-save configuration info
   */
  getAutoSaveConfig() {
    return {
      interval: AUTO_SAVE_INTERVAL,
      minTimeBetweenSaves: MIN_TIME_BETWEEN_SAVES,
      minChangeThreshold: MIN_CHANGE_THRESHOLD
    };
  }

  /**
   * Clean up all auto-save timers (useful for disabling auto-save globally)
   */
  clearAllAutoSaveTimers(): void {
    this.autoSaveTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.autoSaveTimers.clear();
  }
}

// Export singleton instance
export const versionControlService = VersionControlService.getInstance();
