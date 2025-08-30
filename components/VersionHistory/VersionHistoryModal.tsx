import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import { versionControlService } from '../../services/versionControlService';
import type { Note, NoteVersion } from '../../types';
import VersionSidebar from './VersionSidebar.tsx';
import VersionContentView from './VersionContentView.tsx';
import VersionCompareView from './VersionCompareView.tsx';
import VersionModalFooter from './VersionModalFooter.tsx';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onRestoreVersion?: (version: NoteVersion) => void;
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  note,
  onRestoreVersion
}) => {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersion, setCompareVersion] = useState<NoteVersion | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [diffView, setDiffView] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [showCharDiff, setShowCharDiff] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ version: NoteVersion; isOpen: boolean }>({ version: null!, isOpen: false });

  useEffect(() => {
    if (isOpen && note) {
      const noteVersions = versionControlService.getNoteVersions(note.id);
      setVersions(noteVersions);
      
      // Select the version that matches the current note's version
      const currentVersion = noteVersions.find(v => v.version === note.version);
      setSelectedVersion(currentVersion || noteVersions[0] || null);
      
      setCompareMode(false);
      setCompareVersion(null);
      setShowDiff(false);
    }
  }, [isOpen, note]);

  const handleDeleteVersion = useCallback((version: NoteVersion) => {
    setDeleteConfirmation({ version, isOpen: true });
  }, []);

  const confirmDeleteVersion = useCallback(() => {
    const version = deleteConfirmation.version;
    const success = versionControlService.deleteVersion(note!.id, version.version, note!.version);
    
    if (success) {
      const updatedVersions = versionControlService.getNoteVersions(note!.id);
      setVersions(updatedVersions);
      
      if (selectedVersion?.version === version.version) {
        setSelectedVersion(updatedVersions[0] || null);
      }
      if (compareVersion?.version === version.version) {
        setCompareVersion(null);
        setCompareMode(false);
      }
      
      setDeleteConfirmation({ version: null!, isOpen: false });
    } else {
      // Show error message if deletion failed
      console.error('Failed to delete version');
      setDeleteConfirmation({ version: null!, isOpen: false });
    }
  }, [deleteConfirmation.version, note, selectedVersion, compareVersion]);

  const cancelDeleteVersion = useCallback(() => {
    setDeleteConfirmation({ version: null!, isOpen: false });
  }, []);

  const handleRestoreVersion = useCallback((version: NoteVersion) => {
    if (onRestoreVersion) {
      onRestoreVersion(version);
      
      // Close the modal
      onClose();
    }
  }, [onRestoreVersion, onClose]);

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Version History
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {note.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center justify-center transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar */}
          <VersionSidebar
            versions={versions}
            selectedVersion={selectedVersion}
            compareVersion={compareVersion}
            compareMode={compareMode}
            onSelectVersion={setSelectedVersion}
            onSetCompareVersion={setCompareVersion}
            onSetCompareMode={setCompareMode}
            onDeleteVersion={handleDeleteVersion}
          />

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {compareMode && compareVersion && selectedVersion ? (
              <VersionCompareView
                compareVersion={compareVersion}
                selectedVersion={selectedVersion}
                showDiff={showDiff}
                setShowDiff={setShowDiff}
                diffView={diffView}
                setDiffView={setDiffView}
                onRestoreVersion={handleRestoreVersion}
                showCharDiff={showCharDiff}
                setShowCharDiff={setShowCharDiff}
                currentNoteVersion={note?.version}
              />
            ) : selectedVersion ? (
              <VersionContentView
                selectedVersion={selectedVersion}
                onSetCompareMode={setCompareMode}
                onRestoreVersion={handleRestoreVersion}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2">No version selected</p>
                  <p className="text-sm mb-4">Choose a version from the sidebar to view its content</p>
                  {versions.length > 0 && (
                    <button
                      onClick={() => setCompareMode(true)}
                      className="px-6 py-3 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 shadow-sm transition-all duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Start Comparing</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <VersionModalFooter
          versions={versions}
          onClose={onClose}
        />
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-800">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Delete Version
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete <span className="font-semibold">v{deleteConfirmation.version.version}</span>?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteVersion}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteVersion}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 shadow-sm transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionHistoryModal;
