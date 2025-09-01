import { useState, useEffect, useCallback, useRef } from 'react';
import { Note, NoteVersion } from '../types';
import { versionControlService } from '../services/versionControlService';
import { useToasts } from './useToasts';

interface UseVersionControlProps {
  note: Note | null;
  onUpdateNote: (updates: Partial<Note>) => void;
}

interface UseVersionControlReturn {
  // State
  hasUnsavedChanges: boolean;
  lastSavedVersion: number;
  versionCount: number;
  
  // Actions
  createManualVersion: (description?: string) => Promise<NoteVersion | null>;
  restoreVersion: (version: NoteVersion) => Promise<boolean>;
  deleteVersion: (versionNumber: number) => Promise<boolean>;
  getVersions: () => NoteVersion[];
  
  // Auto-save management
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  isAutoSaveEnabled: boolean;
  
  // Utility methods
  getNextVersionNumber: () => number;
}

export const useVersionControl = ({ 
  note, 
  onUpdateNote 
}: UseVersionControlProps): UseVersionControlReturn => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedVersion, setLastSavedVersion] = useState(0);
  const [versionCount, setVersionCount] = useState(0);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  // Tracks last observed content (for change detection) and last saved baseline
  const lastContentRef = useRef<string>('');
  const savedContentRef = useRef<string>('');
  const { addToast } = useToasts();

  // Initialize version control state when note changes
  useEffect(() => {
    if (note) {
      const versions = versionControlService.getNoteVersions(note.id);
      
      setLastSavedVersion(versions.length > 0 ? versions[0].version : 0);
      setVersionCount(versions.length);
      setHasUnsavedChanges(false);
      lastContentRef.current = note.content;
      savedContentRef.current = note.content; // establish baseline on load
      
      // Enable auto-save for the new note
      if (isAutoSaveEnabled) {
        versionControlService.scheduleAutoSave(note.id, note);
      }
    } else {
      setLastSavedVersion(0);
      setVersionCount(0);
      setHasUnsavedChanges(false);
      lastContentRef.current = '';
      savedContentRef.current = '';
    }

    // Cleanup auto-save timer when note changes
    return () => {
      if (note) {
        versionControlService.clearAutoSaveTimer(note.id);
      }
    };
  }, [note?.id, isAutoSaveEnabled]);

  // Track content changes vs last saved baseline
  useEffect(() => {
    if (note && lastContentRef.current !== note.content) {
      // Compare against last saved baseline so undo back to saved clears the dirty state
      const { hasMeaningfulChanges } = versionControlService.checkMeaningfulChanges(
        savedContentRef.current,
        note.content
      );

      setHasUnsavedChanges(hasMeaningfulChanges);
      
      if (hasMeaningfulChanges && isAutoSaveEnabled) {
        // Reschedule auto-save when content changes
        versionControlService.scheduleAutoSave(note.id, note);
      }
      
      lastContentRef.current = note.content;
    }
  }, [note?.content, isAutoSaveEnabled]);

  // Create a manual version
  const createManualVersion = useCallback(async (description?: string): Promise<NoteVersion | null> => {
    if (!note) return null;
    
    try {
      const newVersion = versionControlService.saveVersion(note, 'manual', description);
      
      if (newVersion) {
        // Update note with new version number
        onUpdateNote({ 
          version: newVersion.version,
          lastVersionedAt: Date.now()
        });
        
        // Update local state
        setLastSavedVersion(newVersion.version);
        setVersionCount(prev => prev + 1);
        setHasUnsavedChanges(false);
        savedContentRef.current = note.content; // update baseline to newly saved content
        
        addToast(`Version ${newVersion.version} saved`, 'success');
        return newVersion;
      } else {
        addToast('No changes to save', 'info');
        return null;
      }
    } catch (error) {
      addToast('Failed to save version', 'error');
      return null;
    }
  }, [note, onUpdateNote, addToast]);

  // Restore a version
  const restoreVersion = useCallback(async (version: NoteVersion): Promise<boolean> => {
    if (!note) return false;
    
    try {
      // Call the version control service to handle restore logic
      const restoredVersion = versionControlService.restoreVersion(note.id, version.version);
      
      if (restoredVersion) {
        // Update note with restored content and version number
        onUpdateNote({
          title: restoredVersion.title,
          content: restoredVersion.content,
          version: restoredVersion.version, // Update the version number
          updatedAt: Date.now()
        });
        
        // Update local state
        setHasUnsavedChanges(false);
        lastContentRef.current = restoredVersion.content;
        savedContentRef.current = restoredVersion.content; // baseline becomes restored content
        setLastSavedVersion(restoredVersion.version);
        
        // If a new version was created, update version count
        if (restoredVersion.changeType === 'restore') {
          setVersionCount(prev => prev + 1);
        }
        
        addToast(`Restored to version ${version.version}`, 'success');
        return true;
      } else {
        addToast('Failed to restore version', 'error');
        return false;
      }
    } catch (error) {
      addToast('Error restoring version', 'error');
      return false;
    }
  }, [note, onUpdateNote, addToast]);

  // Delete a version
  const deleteVersion = useCallback(async (versionNumber: number): Promise<boolean> => {
    if (!note) return false;
    
    try {
      const success = versionControlService.deleteVersion(note.id, versionNumber);
      
      if (success) {
        // Update the note's current version number to reflect the highest remaining version
        const currentVersionNumber = versionControlService.getCurrentVersionNumber(note.id);
        onUpdateNote({
          version: currentVersionNumber,
          lastVersionedAt: Date.now()
        });
        
        setVersionCount(prev => prev - 1);
        setLastSavedVersion(currentVersionNumber);
        addToast(`Deleted version ${versionNumber}`, 'success');
        return true;
      } else {
        addToast('Failed to delete version', 'error');
        return false;
      }
    } catch (error) {
      addToast('Error deleting version', 'error');
      return false;
    }
  }, [note, onUpdateNote, addToast]);

  // Get all versions for the current note
  const getVersions = useCallback((): NoteVersion[] => {
    if (!note) return [];
    return versionControlService.getNoteVersions(note.id);
  }, [note]);

  // Enable auto-save
  const enableAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(true);
    if (note) {
      versionControlService.scheduleAutoSave(note.id, note);
    }
    addToast('Auto-save enabled', 'success');
  }, [note, addToast]);

  // Disable auto-save
  const disableAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(false);
    if (note) {
      versionControlService.clearAutoSaveTimer(note.id);
    }
    addToast('Auto-save disabled', 'info');
  }, [note, addToast]);

  return {
    // State
    hasUnsavedChanges,
    lastSavedVersion,
    versionCount,
    
    // Actions
    createManualVersion,
    restoreVersion,
    deleteVersion,
    getVersions,
    
    // Auto-save management
    enableAutoSave,
    disableAutoSave,
    isAutoSaveEnabled,
    
    // Utility methods
    getNextVersionNumber: () => note ? versionControlService.getNextVersionNumber(note.id) : 1,
  };
};
