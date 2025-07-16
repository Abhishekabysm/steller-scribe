import React, { useState } from 'react';
import { Note } from '../types';
import { downloadAsPDF, downloadAsDOCX } from '../services/downloadService';
import { useToasts } from '../hooks/useToasts';
import { FaXmark, FaDownload } from 'react-icons/fa6';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, note }) => {
  const [isDownloading, setIsDownloading] = useState<'pdf' | 'docx' | null>(null);
  const { addToast } = useToasts();

  if (!isOpen) return null;

  const handleDownload = async (format: 'pdf' | 'docx') => {
    setIsDownloading(format);
    try {
      if (format === 'pdf') {
        await downloadAsPDF(note);
        addToast('PDF downloaded successfully!', 'success');
      } else {
        await downloadAsDOCX(note);
        addToast('DOCX downloaded successfully!', 'success');
      }
      onClose();
    } catch (error) {
      addToast(`Failed to download ${format.toUpperCase()}`, 'error');
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface dark:bg-dark-surface border border-border-color dark:border-dark-border-color rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border-color dark:border-dark-border-color">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
            Download Note
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
          >
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">
              Note: {note.title || 'Untitled Note'}
            </h3>
            <p className="text-sm text-text-muted dark:text-dark-text-muted">
              Choose your preferred format to download this note.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={isDownloading === 'pdf'}
              className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading === 'pdf' ? (
                <div className="w-5 h-5 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin"></div>
              ) : (
                <FaDownload className="w-5 h-5" />
              )}
              <span className="font-medium">Download as PDF</span>
            </button>

            <button
              onClick={() => handleDownload('docx')}
              disabled={isDownloading === 'docx'}
              className="w-full flex items-center justify-center gap-3 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-600 dark:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading === 'docx' ? (
                <div className="w-5 h-5 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin"></div>
              ) : (
                <FaDownload className="w-5 h-5" />
              )}
              <span className="font-medium">Download as DOCX</span>
            </button>
          </div>

          <div className="mt-4 text-xs text-text-muted dark:text-dark-text-muted">
            <p>• PDF: Best for reading and sharing</p>
            <p>• DOCX: Best for editing in Microsoft Word</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-border-color dark:border-dark-border-color">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
