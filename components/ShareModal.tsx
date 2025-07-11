import React, { useState, useEffect } from 'react';
import { Note } from '../types';
import { generateShareableUrl } from '../utils/shareUtils';
import XIcon from './icons/XIcon';
import DocumentPlusIcon from './icons/DocumentPlusIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import LinkIcon from './icons/LinkIcon';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, note, onToast }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen && note) {
      const url = generateShareableUrl(note);
      setShareUrl(url);
      setIsCopied(false);
    }
  }, [isOpen, note]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      onToast('Share link copied to clipboard!', 'success');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        onToast('Share link copied to clipboard!', 'success');
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      } catch (fallbackError) {
        onToast('Failed to copy link. Please copy manually.', 'error');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Stellar Scribe Note: ${note.title}`,
          text: `Check out this note: ${note.title}`,
          url: shareUrl,
        });
        onToast('Note shared successfully!', 'success');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          onToast('Failed to share note', 'error');
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-border-color dark:border-dark-border-color">
          <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            Share Note
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-text-primary dark:text-dark-text-primary mb-2">
              "{note.title}"
            </h3>
            <p className="text-sm text-text-muted dark:text-dark-text-muted">
              Share this note with others. When they click the link, the note content will be automatically imported into their Stellar Scribe.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">
              Share Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-bg-secondary dark:bg-dark-bg-secondary border border-border-color dark:border-dark-border-color rounded-lg text-sm text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent"
              />
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-accent dark:bg-dark-accent text-white rounded-lg hover:bg-accent-hover dark:hover:bg-dark-accent-hover transition-colors"
              >
                {isCopied ? (
                  <>
                    <CheckBadgeIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <DocumentPlusIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            {'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-bg-secondary dark:bg-dark-bg-secondary text-text-primary dark:text-dark-text-primary rounded-lg hover:bg-border-color dark:hover:bg-dark-border-color transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                Share
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-bg-secondary dark:bg-dark-bg-secondary text-text-primary dark:text-dark-text-primary rounded-lg hover:bg-border-color dark:hover:bg-dark-border-color transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;