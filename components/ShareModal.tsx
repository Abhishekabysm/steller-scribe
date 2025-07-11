import React, { useState, useEffect } from 'react';
import { Note } from '../types';
import { generateShareableUrl } from '../utils/shareUtils';
import { MdClose, MdContentCopy, MdCheck, MdShare, MdDescription, MdLink } from 'react-icons/md';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, note, onToast }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isUrlLong, setIsUrlLong] = useState(false);

  useEffect(() => {
    if (isOpen && note) {
      const url = generateShareableUrl(note);
      setShareUrl(url);
      setIsCopied(false);
      // Check if URL is very long (might not work on all devices)
      setIsUrlLong(url.length > 2000);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-surface dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-200 scale-100 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-color dark:border-dark-border-color">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 dark:bg-dark-accent/10 rounded-lg">
              <MdShare className="w-5 h-5 text-accent dark:text-dark-accent" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
              Share Note
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-all duration-200"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Note Info */}
          <div className="bg-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-4 border border-border-color dark:border-dark-border-color">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-accent/10 dark:bg-dark-accent/10 rounded-lg flex-shrink-0 mt-0.5">
                <MdDescription className="w-4 h-4 text-accent dark:text-dark-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-medium text-text-primary dark:text-dark-text-primary mb-2 truncate">
                  "{note.title}"
                </h3>
                <p className="text-sm text-text-muted dark:text-dark-text-muted leading-relaxed">
                  Share this note with others. When they click the link, the content will be automatically imported into their Stellar Scribe.
                </p>
              </div>
            </div>
          </div>

          {/* Share Link Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
              Share Link
            </label>
            
            {/* URL Length Warning */}
            {isUrlLong && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5">
                    ⚠️
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    This note creates a very long link. While it should work on most modern devices, 
                    some older browsers or messaging apps might have trouble with it.
                  </p>
                </div>
              </div>
            )}
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="w-full px-4 py-3 bg-bg-secondary dark:bg-dark-bg-secondary border border-border-color dark:border-dark-border-color rounded-lg text-sm text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent focus:border-transparent transition-all duration-200 pr-12"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <MdLink className="w-4 h-4 text-text-muted dark:text-dark-text-muted" />
                </div>
              </div>
              <button
                onClick={handleCopyToClipboard}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isCopied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-accent dark:bg-dark-accent text-white hover:bg-accent-hover dark:hover:bg-dark-accent-hover'
                }`}
              >
                {isCopied ? (
                  <>
                    <MdCheck className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <MdContentCopy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="w-full px-4 py-3 bg-bg-secondary dark:bg-dark-bg-secondary border border-border-color dark:border-dark-border-color rounded-lg text-sm text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent focus:border-transparent transition-all duration-200 pr-12"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <MdLink className="w-4 h-4 text-text-muted dark:text-dark-text-muted" />
                </div>
              </div>
              <button
                onClick={handleCopyToClipboard}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isCopied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-accent dark:bg-dark-accent text-white hover:bg-accent-hover dark:hover:bg-dark-accent-hover'
                }`}
              >
                {isCopied ? (
                  <>
                    <MdCheck className="w-5 h-5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <MdContentCopy className="w-5 h-5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-bg-secondary dark:bg-dark-bg-secondary text-text-primary dark:text-dark-text-primary rounded-lg hover:bg-border-color dark:hover:bg-dark-border-color transition-all duration-200 border border-border-color dark:border-dark-border-color"
              >
                <MdShare className="w-5 h-5" />
                <span className="font-medium">Share via Device</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-bg-secondary dark:bg-dark-bg-secondary text-text-primary dark:text-dark-text-primary rounded-lg hover:bg-border-color dark:hover:bg-dark-border-color transition-all duration-200 border border-border-color dark:border-dark-border-color font-medium"
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