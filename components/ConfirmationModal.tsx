import React, { useEffect } from 'react';
import { FaXmark, FaTriangleExclamation, FaTrash, FaCircleInfo } from 'react-icons/fa6';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  icon?: 'warning' | 'danger' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    confirmVariant = 'primary',
    icon = 'info'
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const confirmClasses = {
      'danger': 'bg-red-500 hover:bg-red-600 focus:ring-red-500 focus:ring-offset-2',
      'warning': 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500 focus:ring-offset-2',
      'primary': 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 focus:ring-offset-2'
  };

  const iconClasses = {
    'danger': 'text-red-500 bg-red-50 dark:bg-red-900/20',
    'warning': 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    'info': 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
  };

  const getIcon = () => {
    switch (icon) {
      case 'danger':
        return <FaTrash className="w-6 h-6" />;
      case 'warning':
        return <FaTriangleExclamation className="w-6 h-6" />;
      default:
        return <FaCircleInfo className="w-6 h-6" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-200" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 transform transition-all duration-200 scale-100" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header with Icon */}
          <div className="flex items-start space-x-4 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClasses[icon]}`}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="confirmation-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
              title="Close"
            >
              <FaXmark className="w-4 h-4" />
            </button>
          </div>

          {/* Message */}
          <div className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {message}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmClasses[confirmVariant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;