import React from 'react';

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
        className="bg-surface dark:bg-dark-surface rounded-lg shadow-2xl max-w-md w-full p-6 animate-slide-in" 
        onClick={e => e.stopPropagation()}
      >
        <h3 id="confirmation-title" className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">{title}</h3>
        <div className="text-text-secondary dark:text-dark-text-secondary mb-6">{message}</div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bg-secondary dark:bg-dark-bg-secondary text-text-primary dark:text-dark-text-primary font-bold rounded-md hover:bg-border-color dark:hover:bg-dark-border-color transition-colors"
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