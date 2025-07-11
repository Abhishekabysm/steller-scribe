import React from 'react';
import { ShareableNote } from '../utils/shareUtils';
import XIcon from './icons/XIcon';
import { MdCloudDownload, MdAdd } from 'react-icons/md';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-surface dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-200 scale-100 animate-in fade-in-0 zoom-in-95 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-color dark:border-dark-border-color">
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            Import Shared Note
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-all duration-200"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-accent/20 to-accent/10 dark:from-dark-accent/20 dark:to-dark-accent/10 rounded-xl flex-shrink-0">
                <MdCloudDownload className="w-6 h-6 sm:w-8 sm:h-8 text-accent dark:text-dark-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-medium text-text-primary dark:text-dark-text-primary mb-1 truncate">
                  "{sharedNote.title}"
                </h3>
                <p className="text-sm text-text-muted dark:text-dark-text-muted">
                  Someone shared this note with you
                </p>
              </div>
            </div>

            {sharedNote.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
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

            <div className="space-y-2">
              <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                <span className="hidden sm:inline">Preview:</span>
                <span className="sm:hidden">Preview</span>
              </p>
              <div className="bg-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-3 sm:p-4 max-h-32 sm:max-h-40 overflow-y-auto">
                <pre className="text-xs sm:text-sm text-text-primary dark:text-dark-text-primary whitespace-pre-wrap font-mono leading-relaxed">
                  {previewContent}
                </pre>
              </div>
            </div>

            <p className="text-sm text-text-muted dark:text-dark-text-muted leading-relaxed">
              This will create a new note in your Stellar Scribe with the shared content. 
              Your existing notes will not be affected.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onImport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent dark:bg-dark-accent text-white rounded-lg hover:bg-accent-hover dark:hover:bg-dark-accent-hover transition-all duration-200 font-medium"
            >
              <MdAdd className="w-4 h-4" />
              Import Note
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-bg-secondary dark:bg-dark-bg-secondary text-text-primary dark:text-dark-text-primary rounded-lg hover:bg-border-color dark:hover:bg-dark-border-color transition-all duration-200 font-medium"
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