import React from 'react';
import { ShareableNote } from '../utils/shareUtils';
import XIcon from './icons/XIcon';
import DocumentPlusIcon from './icons/DocumentPlusIcon';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedNote: ShareableNote;
  onImport: () => void;
  onCancel: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ 
  isOpen, 
  onClose, 
  sharedNote, 
  onImport, 
  onCancel 
}) => {
  if (!isOpen) return null;

  const previewContent = sharedNote.content.length > 200 
    ? sharedNote.content.substring(0, 200) + '...' 
    : sharedNote.content;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-lg mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-border-color dark:border-dark-border-color">
          <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            Import Shared Note
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <DocumentPlusIcon className="w-8 h-8 text-accent dark:text-dark-accent" />
              <div>
                <h3 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">
                  "{sharedNote.title}"
                </h3>
                <p className="text-sm text-text-muted dark:text-dark-text-muted">
                  Someone shared this note with you
                </p>
              </div>
            </div>

            {sharedNote.tags.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">
                  Tags:
                </p>
                <div className="flex flex-wrap gap-2">
                  {sharedNote.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent dark:bg-dark-accent/20 dark:text-dark-accent-hover"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">
                Preview:
              </p>
              <div className="bg-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-4 max-h-40 overflow-y-auto">
                <pre className="text-sm text-text-primary dark:text-dark-text-primary whitespace-pre-wrap font-mono">
                  {previewContent}
                </pre>
              </div>
            </div>

            <p className="text-sm text-text-muted dark:text-dark-text-muted">
              This will create a new note in your Stellar Scribe with the shared content. 
              Your existing notes will not be affected.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onImport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent dark:bg-dark-accent text-white rounded-lg hover:bg-accent-hover dark:hover:bg-dark-accent-hover transition-colors"
            >
              <DocumentPlusIcon className="w-4 h-4" />
              Import Note
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-bg-secondary dark:bg-dark-bg-secondary text-text-primary dark:text-dark-text-primary rounded-lg hover:bg-border-color dark:hover:bg-dark-border-color transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;