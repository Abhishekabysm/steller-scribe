import React, { useState, useEffect, useRef } from 'react';
import { FaXmark, FaWandMagicSparkles, FaQuoteLeft } from 'react-icons/fa6';
import { MdAutoFixHigh } from 'react-icons/md';

interface AIModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModify: (selectedText: string, instructions: string) => void;
  isLoading: boolean;
  selectedText: string;
}

const AIModifyModal: React.FC<AIModifyModalProps> = ({
  isOpen,
  onClose,
  onModify,
  isLoading,
  selectedText,
}) => {
  const [instructions, setInstructions] = useState('');
  const [swipeY, setSwipeY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const applyButtonRef = useRef<HTMLButtonElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // Predefined instruction templates
  const instructionTemplates = [
    'Make it more formal',
    'Expand on this idea',
    'Summarize in 50 words',
    'Make it more concise',
    'Change to passive voice',
    'Add more details',
  ];

  useEffect(() => {
    if (isOpen) {
      setInstructions('');
      setSwipeY(0);
      setIsDragging(false);
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Touch handlers for swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLoading) return;
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isLoading) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;
    
    // Only allow downward swipes
    if (deltaY > 0) {
      setSwipeY(Math.min(deltaY, 300)); // Limit max swipe distance
      
      // Add resistance effect
      const resistance = Math.max(0.3, 1 - deltaY / 300);
      if (modalRef.current) {
        modalRef.current.style.transform = `translateY(${deltaY * resistance}px)`;
        modalRef.current.style.opacity = `${Math.max(0.3, 1 - deltaY / 400)}`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isLoading) return;
    
    setIsDragging(false);
    
    // If swiped down more than 100px, close the modal
    if (swipeY > 100) {
      onClose();
    } else {
      // Snap back to original position
      if (modalRef.current) {
        modalRef.current.style.transform = 'translateY(0)';
        modalRef.current.style.opacity = '1';
      }
    }
    
    setSwipeY(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (instructions.trim() && !isLoading) {
          handleModifyClick();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, instructions, isLoading]);

  const handleModifyClick = () => {
    if (selectedText && instructions.trim()) {
      onModify(selectedText, instructions);
    }
  };

  const handleTemplateClick = (template: string) => {
    setInstructions(template);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modify-title"
    >
      <div
        ref={modalRef}
        className="bg-[#FFFFFF] dark:bg-[#222222] rounded-t-xl sm:rounded-lg shadow-lg w-full max-w-full sm:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto border-t border-[#e2e8f0] dark:border-[#404040] sm:border border-[#e2e8f0] dark:border-[#404040] max-h-[90vh] sm:max-h-[85vh] flex flex-col transition-all duration-300 ease-out relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: 'translateY(0)',
          opacity: 1,
        }}
      >
        {/* Swipe Indicator Overlay - Fixed colors for both modes */}
        {isDragging && swipeY > 20 && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-[#FFFFFF]/95 to-transparent dark:from-[#222222]/95 pointer-events-none sm:hidden z-20 border-b border-[#e2e8f0]/50 dark:border-[#404040]/50">
            <div className="text-center">
              <p className="text-sm font-semibold text-[#2C2C2C] dark:text-[#e0e0e0] mb-1">
                {swipeY > 100 ? 'Release to close' : 'Swipe down to close'}
              </p>
              <div className="w-16 h-1 bg-[#4A90E2] dark:bg-[#64b5f6] rounded-full mx-auto opacity-75"></div>
            </div>
          </div>
        )}

        {/* Mobile Handle - Swipeable */}
        <div 
          ref={handleRef}
          className="flex justify-center pt-3 pb-2 sm:hidden cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className={`w-10 h-1.5 rounded-full transition-all duration-200 ${
              isDragging 
                ? 'bg-[#4A90E2] dark:bg-[#64b5f6] w-12' 
                : 'bg-[#e2e8f0] dark:bg-[#404040]'
            }`}
          />
        </div>

        {/* Header - Also swipeable on mobile */}
        <div 
          className="flex items-center justify-between p-4 sm:p-5 lg:p-6 border-b border-[#e2e8f0] dark:border-[#404040] sm:cursor-default cursor-grab active:cursor-grabbing sticky top-0 z-10 bg-[#FFFFFF] dark:bg-[#222222] flex-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-[#F5F5F5] dark:bg-[#242424] rounded">
              <FaWandMagicSparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4A90E2] dark:text-[#64b5f6]" />
            </div>
            <div>
              <h3
                id="ai-modify-title"
                className="text-base sm:text-lg lg:text-xl font-semibold text-[#2C2C2C] dark:text-[#e0e0e0]"
              >
                AI Text Editor
              </h3>
              <p className="text-xs text-[#999999] dark:text-[#757575] sm:hidden">
                Swipe down to close
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 sm:p-1.5 rounded hover:bg-[#F5F5F5] dark:hover:bg-[#242424] text-[#666666] dark:text-[#b0b0b0] transition-colors disabled:opacity-50 -mr-1 sm:mr-0 hidden sm:block"
            aria-label="Close"
          >
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto touch-pan-y overscroll-contain">
          <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6">
            {/* Selected Text Display */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FaQuoteLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#666666] dark:text-[#b0b0b0]" />
                <span className="text-xs sm:text-sm font-medium text-[#666666] dark:text-[#b0b0b0]">
                  Selected Text
                </span>
              </div>
              <div className="bg-[#F5F5F5] dark:bg-[#242424] border border-[#e2e8f0] dark:border-[#404040] rounded p-3 lg:p-4 max-h-32 sm:max-h-40 lg:max-h-48 overflow-y-auto">
                <p className="text-sm lg:text-base text-[#2C2C2C] dark:text-[#e0e0e0] italic leading-relaxed break-words">
                  "{selectedText}"
                </p>
              </div>
              <p className="text-xs text-[#999999] dark:text-[#757575] mt-1">
                {selectedText.length} characters selected
              </p>
            </div>

            {/* Instructions Input */}
            <div>
              <label
                htmlFor="instructions"
                className="flex items-center gap-2 text-sm lg:text-base font-medium text-[#2C2C2C] dark:text-[#e0e0e0] mb-2"
              >
                <MdAutoFixHigh className="w-3.5 h-3.5" />
                Instructions for AI
              </label>
              <textarea
                ref={textareaRef}
                id="instructions"
                className="w-full px-3 lg:px-4 py-3 sm:py-2.5 lg:py-3 bg-[#F5F5F5] dark:bg-[#242424] border border-[#e2e8f0] dark:border-[#404040] rounded text-[#2C2C2C] dark:text-[#e0e0e0] placeholder-[#999999] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] dark:focus:ring-[#64b5f6] focus:border-transparent resize-none transition-colors text-sm lg:text-base"
                rows={4}
                placeholder="Tell the AI how to modify your text..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={isLoading}
                style={{ 
                  fontSize: '16px',
                  WebkitAppearance: 'none'
                }}
              />
              <p className="text-xs text-[#999999] dark:text-[#757575] mt-1">
                {instructions.length}/500 characters
              </p>
            </div>

            {/* Quick Templates */}
            <div>
              <span className="text-sm lg:text-base font-medium text-[#666666] dark:text-[#b0b0b0] mb-3 block">
                Quick Instructions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
                {instructionTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleTemplateClick(template)}
                    disabled={isLoading}
                    className="px-3 py-3 sm:py-2 text-sm lg:text-sm bg-[#F5F5F5] dark:bg-[#242424] text-[#666666] dark:text-[#b0b0b0] border border-[#e2e8f0] dark:border-[#404040] rounded hover:bg-[#F0F0F0] dark:hover:bg-[#2c2c2c] hover:text-[#4A90E2] dark:hover:text-[#64b5f6] transition-colors disabled:opacity-50 text-left touch-manipulation"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-[#F5F5F5] dark:bg-[#242424] border border-[#e2e8f0] dark:border-[#404040] rounded p-3 lg:p-4">
              <p className="text-xs sm:text-xs lg:text-sm text-[#666666] dark:text-[#b0b0b0] leading-relaxed">
                <strong>Tip:</strong> Be specific with your instructions. The AI will modify only the selected text based on your guidance.
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Sticky on mobile */}
        <div className="flex-none sticky bottom-0 bg-[#FFFFFF] dark:bg-[#222222] border-t border-[#e2e8f0] dark:border-[#404040] p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="order-2 sm:order-1 px-4 lg:px-6 py-3 lg:py-3 bg-[#F5F5F5] dark:bg-[#242424] text-[#666666] dark:text-[#b0b0b0] border border-[#e2e8f0] dark:border-[#404040] rounded text-sm lg:text-base font-medium hover:bg-[#F0F0F0] dark:hover:bg-[#2c2c2c] transition-colors disabled:opacity-50 touch-manipulation"
            >
              Cancel
            </button>
            
            <button
              ref={applyButtonRef}
              onClick={handleModifyClick}
              disabled={isLoading || !instructions.trim()}
              className="order-1 sm:order-2 flex-1 flex items-center justify-center gap-2 px-4 lg:px-6 py-3 lg:py-3 bg-[#4A90E2] hover:bg-[#357ABD] dark:bg-[#64b5f6] dark:hover:bg-[#42a5f5] text-white rounded text-sm lg:text-base font-medium transition-colors disabled:opacity-50 touch-manipulation min-h-[48px]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <MdAutoFixHigh className="w-4 h-4" />
                  <span className="hidden sm:inline">Apply AI ({instructions.length > 0 ? '⌘' : ''}↵)</span>
                  <span className="sm:hidden">Apply AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModifyModal;
