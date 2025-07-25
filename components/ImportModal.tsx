import React, { useState, useEffect, useRef } from 'react';
import { ShareableNote } from '../utils/shareUtils';
import { FaXmark, FaTags, FaFileLines } from 'react-icons/fa6';
import { MdAdd, MdCheckCircle } from 'react-icons/md';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedNote: ShareableNote;
  onImport: () => Promise<void> | void;
  onCancel: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ 
  isOpen, 
  onClose, 
  sharedNote, 
  onImport, 
  onCancel 
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && importButtonRef.current) {
      setTimeout(() => importButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleImport = async () => {
    if (isImporting) return;
    
    setIsImporting(true);
    try {
      await onImport();
      setImportSuccess(true);
      
      setTimeout(() => {
        onClose();
        setImportSuccess(false);
        setIsImporting(false);
      }, 1200);
    } catch (error) {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    if (isImporting) return;
    onCancel();
  };

  const previewContent = sharedNote.content.length > 250 
    ? sharedNote.content.substring(0, 250) + '...' 
    : sharedNote.content;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-[#FFFFFF] dark:bg-[#222222] rounded-lg shadow-lg w-full max-w-md mx-auto border border-[#e2e8f0] dark:border-[#404040] max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0] dark:border-[#404040]">
          <h2 
            id="import-modal-title"
            className="text-lg font-semibold text-[#2C2C2C] dark:text-[#e0e0e0]"
          >
            Import Note
          </h2>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-1.5 rounded hover:bg-[#F5F5F5] dark:hover:bg-[#242424] text-[#666666] dark:text-[#b0b0b0] transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="p-5 space-y-4">
            {/* Note Title */}
            <div>
              <h3 className="text-base font-medium text-[#2C2C2C] dark:text-[#e0e0e0] mb-1">
                {sharedNote.title || 'Untitled Note'}
              </h3>
              <p className="text-sm text-[#999999] dark:text-[#757575]">
                Shared note ready to import
              </p>
            </div>

            {/* Tags */}
            {sharedNote.tags && sharedNote.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaTags className="w-3.5 h-3.5 text-[#666666] dark:text-[#b0b0b0]" />
                  <span className="text-sm text-[#666666] dark:text-[#b0b0b0]">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sharedNote.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-[#F5F5F5] dark:bg-[#242424] text-[#666666] dark:text-[#b0b0b0] rounded border border-[#e2e8f0] dark:border-[#404040]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Content Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FaFileLines className="w-3.5 h-3.5 text-[#666666] dark:text-[#b0b0b0]" />
                  <span className="text-sm text-[#666666] dark:text-[#b0b0b0]">Preview</span>
                </div>
                {sharedNote.content.length > 250 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-[#4A90E2] dark:text-[#64b5f6] hover:text-[#357ABD] dark:hover:text-[#42a5f5] transition-colors"
                  >
                    {isExpanded ? 'Less' : 'More'}
                  </button>
                )}
              </div>
              
              <div className="bg-[#F5F5F5] dark:bg-[#242424] rounded border border-[#e2e8f0] dark:border-[#404040] p-3 max-h-40 overflow-y-auto">
                <pre className="text-sm text-[#2C2C2C] dark:text-[#e0e0e0] whitespace-pre-wrap font-mono leading-relaxed">
                  {isExpanded ? sharedNote.content : previewContent}
                </pre>
              </div>
              
              <p className="text-xs text-[#999999] dark:text-[#757575] mt-1">
                {sharedNote.content.length} characters
              </p>
            </div>

            {/* Info */}
            <div className="bg-[#F5F5F5] dark:bg-[#242424] border border-[#e2e8f0] dark:border-[#404040] rounded p-3">
              <p className="text-sm text-[#666666] dark:text-[#b0b0b0]">
                This will create a new note in your collection. Your existing notes won't be affected.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e2e8f0] dark:border-[#404040] p-5">
          <div className="flex gap-3">
            <button
              ref={importButtonRef}
              onClick={handleImport}
              disabled={isImporting || importSuccess}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4A90E2] hover:bg-[#357ABD] dark:bg-[#64b5f6] dark:hover:bg-[#42a5f5] text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {importSuccess ? (
                <>
                  <MdCheckCircle className="w-4 h-4" />
                  <span>Imported</span>
                </>
              ) : isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <MdAdd className="w-4 h-4" />
                  <span>Import</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleCancel}
              disabled={isImporting}
              className="px-4 py-2.5 bg-[#F5F5F5] dark:bg-[#242424] text-[#666666] dark:text-[#b0b0b0] border border-[#e2e8f0] dark:border-[#404040] rounded text-sm font-medium hover:bg-[#F0F0F0] dark:hover:bg-[#2c2c2c] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Success Overlay */}
        {importSuccess && (
          <div className="absolute inset-0 bg-[#FFFFFF]/95 dark:bg-[#222222]/95 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#6B8E6B]/10 dark:bg-[#81c784]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <MdCheckCircle className="w-6 h-6 text-[#6B8E6B] dark:text-[#81c784]" />
              </div>
              <p className="text-sm font-medium text-[#2C2C2C] dark:text-[#e0e0e0]">
                Note imported successfully
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
