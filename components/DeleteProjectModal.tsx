import React, { useState } from 'react';
import { Project } from '../types';
import { FaXmark, FaTriangleExclamation } from 'react-icons/fa6';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (strategy: 'unorganize' | 'delete' | 'move', targetProjectId?: string) => void;
  project: Project | null;
  noteCount: number;
  availableProjects: Project[]; // Projects to move notes to (excluding the one being deleted)
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  project,
  noteCount,
  availableProjects,
}) => {
  const [strategy, setStrategy] = useState<'unorganize' | 'delete' | 'move'>('unorganize');
  const [targetProjectId, setTargetProjectId] = useState<string>('');

  if (!isOpen || !project) return null;

  const handleConfirm = () => {
    if (strategy === 'move' && !targetProjectId) {
      return; // Don't allow confirmation without selecting target project
    }
    onConfirm(strategy, strategy === 'move' ? targetProjectId : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border-color">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <FaTriangleExclamation className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
              Delete Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-secondary text-gray-500 dark:text-dark-text-muted transition-colors"
          >
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 dark:text-dark-text-secondary">
            You are about to delete the project <strong className="text-gray-900 dark:text-dark-text-primary">"{project.title}"</strong>.
          </p>

          {noteCount > 0 && (
            <>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  <strong>Warning:</strong> This project contains {noteCount} {noteCount === 1 ? 'note' : 'notes'}. 
                  What would you like to do with {noteCount === 1 ? 'it' : 'them'}?
                </p>
              </div>

              {/* Strategy Options */}
              <div className="space-y-3">
                <label className="flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-dark-bg-secondary"
                  style={{ borderColor: strategy === 'unorganize' ? '#3B82F6' : 'transparent' }}>
                  <input
                    type="radio"
                    name="delete-strategy"
                    value="unorganize"
                    checked={strategy === 'unorganize'}
                    onChange={() => setStrategy('unorganize')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-dark-text-primary">
                      Move to Unorganized
                    </div>
                    <p className="text-sm text-gray-600 dark:text-dark-text-muted mt-1">
                      Keep all notes but remove them from this project. They'll appear in "Unorganized".
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-dark-bg-secondary"
                  style={{ borderColor: strategy === 'move' ? '#3B82F6' : 'transparent' }}>
                  <input
                    type="radio"
                    name="delete-strategy"
                    value="move"
                    checked={strategy === 'move'}
                    onChange={() => setStrategy('move')}
                    className="mt-1"
                    disabled={availableProjects.length === 0}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-dark-text-primary">
                      Move to Another Project
                    </div>
                    <p className="text-sm text-gray-600 dark:text-dark-text-muted mt-1">
                      Transfer all notes to a different project.
                    </p>
                    
                    {strategy === 'move' && availableProjects.length > 0 && (
                      <select
                        value={targetProjectId}
                        onChange={(e) => setTargetProjectId(e.target.value)}
                        className="mt-2 w-full px-3 py-2 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-accent text-gray-900 dark:text-dark-text-primary"
                      >
                        <option value="">Select a project...</option>
                        {availableProjects.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.icon} {p.title} ({p.noteCount || 0} notes)
                          </option>
                        ))}
                      </select>
                    )}

                    {availableProjects.length === 0 && (
                      <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-2 italic">
                        No other projects available
                      </p>
                    )}
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                  style={{ borderColor: strategy === 'delete' ? '#EF4444' : 'transparent' }}>
                  <input
                    type="radio"
                    name="delete-strategy"
                    value="delete"
                    checked={strategy === 'delete'}
                    onChange={() => setStrategy('delete')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-red-600 dark:text-red-400">
                      Delete All Notes
                    </div>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                      <strong>Permanently delete</strong> all {noteCount} {noteCount === 1 ? 'note' : 'notes'} in this project. This cannot be undone!
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}

          {noteCount === 0 && (
            <p className="text-sm text-gray-600 dark:text-dark-text-muted">
              This project is empty. It will be permanently deleted.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-dark-border-color">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border-color text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={strategy === 'move' && !targetProjectId}
            className={`px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors ${
              strategy === 'delete'
                ? 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600'
                : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {strategy === 'delete' ? 'Delete Project & Notes' : 'Delete Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectModal;
