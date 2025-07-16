import React from 'react';
import { FaXmark } from 'react-icons/fa6';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    confirmVariant = 'primary'
}) => {
  if (!isOpen) return null;

  const confirmClasses = {
      'danger': 'bg-red-600 hover:bg-red-500',
      'primary': 'bg-accent hover:bg-accent-hover dark:bg-dark-accent dark:hover:bg-dark-accent-hover'
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div 
        className="bg-surface dark:bg-dark-surface rounded-lg shadow-2xl max-w-sm sm:max-w-lg w-full p-4 sm:p-8 border border-border-color dark:border-dark-border-color animate-slide-in" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="confirmation-title" className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-2.5 rounded-lg text-text-muted dark:text-dark-text-muted hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
            title="Close"
          >
            <FaXmark className="w-6 h-6" />
          </button>
        </div>
        <div className="text-text-secondary dark:text-dark-text-secondary mb-4 leading-relaxed">{message}</div>
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0 justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border-color dark:border-dark-border-color text-text-primary dark:text-dark-text-primary font-bold rounded-md hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-bold rounded-md transition-colors ${confirmClasses[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;