import React, { useState } from 'react';
import { FaXmark, FaRegStar } from 'react-icons/fa6';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  isLoading: boolean;
  onAddToNote: () => void;
  noteTitle: string;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ 
  isOpen, 
  onClose, 
  summary, 
  isLoading, 
  onAddToNote,
  noteTitle 
}) => {
  const [hasAddedToNote, setHasAddedToNote] = useState(false);

  if (!isOpen) return null;

  const handleAddToNote = () => {
    onAddToNote();
    setHasAddedToNote(true);
  };

  const handleClose = () => {
    setHasAddedToNote(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col mx-2 sm:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border-color dark:border-dark-border-color bg-gradient-to-r from-accent/10 to-accent/5 dark:from-dark-accent/10 dark:to-dark-accent/5 rounded-t-lg">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <FaRegStar className="w-5 h-5 sm:w-6 sm:h-6 text-accent dark:text-dark-accent flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                AI Summary
              </h2>
              <p className="text-xs sm:text-sm text-text-muted dark:text-dark-text-muted truncate">
                {noteTitle || 'Untitled Note'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors flex-shrink-0 ml-2"
          >
            <FaXmark className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-accent/50 border-t-accent dark:border-dark-accent/50 dark:border-t-dark-accent rounded-full animate-spin"></div>
                  <p className="text-sm sm:text-base text-text-muted dark:text-dark-text-muted text-center">
                    Generating AI summary...
                  </p>
                </div>
              </div>
            ) : summary ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-3 sm:p-4 border-l-4 border-accent dark:border-dark-accent">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm sm:text-base text-text-secondary dark:text-dark-text-secondary leading-relaxed whitespace-pre-wrap">
                      {summary}
                    </p>
                  </div>
                </div>
                
                {hasAddedToNote && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-medium">Summary added to your note!</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-text-muted dark:text-dark-text-muted text-center">
                  No summary available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {!isLoading && summary && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-t border-border-color dark:border-dark-border-color bg-bg-secondary/50 dark:bg-dark-bg-secondary/50 rounded-b-lg">
            <div className="flex items-center gap-2 text-text-muted dark:text-dark-text-muted text-xs sm:text-sm order-2 sm:order-1">
              <FaRegStar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Generated by AI • Review before use</span>
              <span className="sm:hidden">Generated by AI</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2">
              <button
                onClick={handleClose}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors text-center"
              >
                Close
              </button>
              
              {!hasAddedToNote && (
                <button
                  onClick={handleAddToNote}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-accent hover:bg-accent-hover dark:bg-dark-accent dark:hover:bg-dark-accent-hover text-white text-sm font-medium rounded-md transition-colors"
                >
                  <FaRegStar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Add to Note</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryModal;
