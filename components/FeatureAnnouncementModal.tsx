import React, { useState, useEffect, useRef } from 'react';
import { FaXmark, FaStar, FaArrowRight } from 'react-icons/fa6';

interface FeatureAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  title?: string;
  description: string;
  visual?: {
    type: 'icon' | 'image' | 'gif';
    src?: string;
    iconComponent?: React.ComponentType<{ className?: string }>;
    alt?: string;
  };
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  dismissAction?: {
    label: string;
    onClick?: () => void;
  };
  className?: string;
}

const FeatureAnnouncementModal: React.FC<FeatureAnnouncementModalProps> = ({
  isOpen,
  onClose,
  featureName,
  title,
  description,
  visual,
  primaryAction = { label: 'Try it now', onClick: () => {} },
  dismissAction = { label: 'Later' },
  className = '',
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && primaryButtonRef.current) {
      setTimeout(() => primaryButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard navigation and focus trapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Tab') {
        // Basic focus trapping between primary button and close button
        if (e.shiftKey) {
          if (document.activeElement === primaryButtonRef.current) {
            e.preventDefault();
            closeButtonRef.current?.focus();
          }
        } else {
          if (document.activeElement === closeButtonRef.current) {
            e.preventDefault();
            primaryButtonRef.current?.focus();
          }
        }
      } else if (e.key === 'Enter' && document.activeElement === primaryButtonRef.current) {
        e.preventDefault();
        handlePrimaryAction();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      const scrollY = document.body.dataset.scrollY;
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
        delete document.body.dataset.scrollY;
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      delete document.body.dataset.scrollY;
    };
  }, [isOpen]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    
    // Call dismissAction onClick if provided
    if (dismissAction.onClick) {
      dismissAction.onClick();
    }
    
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handlePrimaryAction = () => {
    primaryAction.onClick();
    handleClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const renderVisual = () => {
    if (!visual) return null;

    const visualClasses = "w-11 h-11 sm:w-12 sm:h-12 mx-auto mb-4";

    switch (visual.type) {
      case 'icon':
        if (visual.iconComponent) {
          const IconComponent = visual.iconComponent;
          return (
            <div className="flex justify-center">
              <div className="p-3 bg-accent/10 dark:bg-dark-accent/10 rounded-full flex items-center justify-center">
                <IconComponent className="w-8 h-8 sm:w-9 sm:h-9 text-accent dark:text-dark-accent" />
              </div>
            </div>
          );
        }
        break;
      case 'image':
      case 'gif':
        if (visual.src) {
          return (
            <div className="flex justify-center">
              <div className="p-1.5 bg-accent/10 dark:bg-dark-accent/10 rounded-lg flex items-center justify-center">
                <img
                  src={visual.src}
                  alt={visual.alt || `${featureName} preview`}
                  className={`${visualClasses} object-cover rounded-md border border-border-color dark:border-dark-border-color`}
                />
              </div>
            </div>
          );
        }
        break;
    }

    // Fallback to star icon, minimal and clean
    return (
      <div className="flex justify-center">
        <div className="p-3 bg-accent/10 dark:bg-dark-accent/10 rounded-full flex items-center justify-center">
          <FaStar className="w-8 h-8 sm:w-9 sm:h-9 text-accent dark:text-dark-accent" />
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-announcement-title"
      aria-describedby="feature-announcement-description"
    >
      <div
        ref={modalRef}
        className={`bg-surface dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-auto border border-border-color dark:border-dark-border-color transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-color dark:border-dark-border-color">
          <h2
            id="feature-announcement-title"
            className="text-lg sm:text-xl font-semibold text-text-primary dark:text-dark-text-primary"
          >
            {title || `Introducing ${featureName}`}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
            aria-label="Close announcement"
          >
            <FaXmark className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 text-center">
          {/* Visual */}
          <div className="mb-6">
            {renderVisual()}
          </div>

          {/* Description */}
          <p
            id="feature-announcement-description"
            className="text-sm sm:text-base text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-6 sm:mb-8"
          >
            {description}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              ref={primaryButtonRef}
              onClick={handlePrimaryAction}
              className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-accent hover:bg-accent-hover dark:bg-dark-accent dark:hover:bg-dark-accent-hover text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 dark:focus:ring-dark-accent/50"
            >
              <span>{primaryAction.label}</span>
              <FaArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleClose}
              className="flex-1 px-4 sm:px-6 py-3 bg-bg-secondary dark:bg-dark-bg-secondary text-text-primary dark:text-dark-text-primary font-medium rounded-lg hover:bg-border-color dark:hover:bg-dark-border-color transition-colors border border-border-color dark:border-dark-border-color focus:outline-none focus:ring-2 focus:ring-border-color/50 dark:focus:ring-dark-border-color/50"
            >
              {dismissAction.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureAnnouncementModal;
