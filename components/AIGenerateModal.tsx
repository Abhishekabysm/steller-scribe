import React, { useState, useEffect, useRef } from 'react';
import { FaXmark, FaWandMagicSparkles, FaGlobe } from 'react-icons/fa6';
import { MdAutoAwesome } from 'react-icons/md';

interface AIGenerateModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onGenerate: (data: { topic: string; language: string; contentStyle?: string | null; contentLength?: string | null; }) => void;
}

const AIGenerateModal: React.FC<AIGenerateModalProps> = ({ 
  isOpen, 
  isGenerating,
  onClose, 
  onGenerate
}) => {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('English');
  const [contentStyle, setContentStyle] = useState<string | null>(null);
  const [contentLength, setContentLength] = useState<string | null>(null);
  const [swipeY, setSwipeY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const topicInputRef = useRef<HTMLInputElement>(null);
  const generateButtonRef = useRef<HTMLButtonElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // Popular language suggestions
  const languageSuggestions = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Hindi', 'Arabic'
  ];

  // Reset form fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setTopic('');
      setLanguage('English');
      setContentStyle(null);
      setContentLength(null);
      setSwipeY(0);
      setIsDragging(false);
      setTimeout(() => topicInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Touch handlers for swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isGenerating) return;
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isGenerating) return;
    
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
    if (!isDragging || isGenerating) return;
    
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
        if (topic.trim() && !isGenerating) {
          handleSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, topic, isGenerating]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (topic.trim() && !isGenerating) {
      onGenerate({
        topic,
        language: language.trim() || 'English',
        contentStyle: contentStyle || undefined,
        contentLength: contentLength || undefined,
      });
    }
  };

  const handleLanguageSelect = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
  };

  const handleContentStyleSelect = (style: string) => {
    setContentStyle(style);
  };

  const handleContentLengthSelect = (length: string) => {
    setContentLength(length);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-generate-title"
    >
      <div
        ref={modalRef}
        className="bg-[#FFFFFF] dark:bg-[#222222] rounded-t-xl sm:rounded-lg shadow-lg w-full max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto border-t border-[#e2e8f0] dark:border-[#404040] sm:border border-[#e2e8f0] dark:border-[#404040] max-h-[90vh] sm:max-h-[85vh] flex flex-col transition-all duration-300 ease-out relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: 'translateY(0)',
          opacity: 1,
        }}
      >
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

        {/* Header - Also swipeable on mobile */}
        <div
          className="flex items-center justify-between p-4 sm:p-5 lg:p-6 xl:p-8 border-b border-[#e2e8f0] dark:border-[#404040] sm:cursor-default cursor-grab active:cursor-grabbing sticky top-0 z-10 bg-[#FFFFFF] dark:bg-[#222222] flex-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="p-2 lg:p-3 bg-[#F5F5F5] dark:bg-[#242424] rounded">
              <FaWandMagicSparkles className="w-4 h-4 lg:w-5 lg:h-5 text-[#4A90E2] dark:text-[#64b5f6]" />
            </div>
            <div>
              <h3
                id="ai-generate-title"
                className="text-lg lg:text-xl xl:text-2xl font-semibold text-[#2C2C2C] dark:text-[#e0e0e0]"
              >
                Generate Note
              </h3>
              <p className="text-xs text-[#999999] dark:text-[#757575] sm:hidden">
                Swipe down to close
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 lg:p-2 rounded hover:bg-[#F5F5F5] dark:hover:bg-[#242424] text-[#666666] dark:text-[#b0b0b0] transition-colors disabled:opacity-50 -mr-1 sm:mr-0 hidden sm:block"
            aria-label="Close"
          >
            <FaXmark className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 lg:p-6 xl:p-8 space-y-5 lg:space-y-6">
            {/* Topic Input */}
            <div>
              <label
                htmlFor="topic"
                className="flex items-center gap-2 text-sm lg:text-base font-medium text-[#2C2C2C] dark:text-[#e0e0e0] mb-2 lg:mb-3"
              >
                <MdAutoAwesome className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                Topic or Subject
              </label>
              <input
                ref={topicInputRef}
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The History of Ancient Rome, JavaScript fundamentals, Climate Change..."
                className="w-full px-3 lg:px-4 py-3 lg:py-4 bg-[#F5F5F5] dark:bg-[#242424] border border-[#e2e8f0] dark:border-[#404040] rounded text-[#2C2C2C] dark:text-[#e0e0e0] placeholder-[#999999] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] dark:focus:ring-[#64b5f6] focus:border-transparent transition-colors text-sm lg:text-base"
                required
                disabled={isGenerating}
                style={{ fontSize: '16px' }} // Prevent zoom on iOS
              />
              <p className="text-xs lg:text-sm text-[#999999] dark:text-[#757575] mt-1 lg:mt-2">
                {topic.length}/200 characters
              </p>
            </div>

            {/* Language Selection */}
            <div>
              <label
                htmlFor="language"
                className="flex items-center gap-2 text-sm lg:text-base font-medium text-[#2C2C2C] dark:text-[#e0e0e0] mb-2 lg:mb-3"
              >
                <FaGlobe className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                Language (Optional)
              </label>
              <input
                id="language"
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Enter language or select from suggestions"
                className="w-full px-3 lg:px-4 py-3 lg:py-4 bg-[#F5F5F5] dark:bg-[#242424] border border-[#e2e8f0] dark:border-[#404040] rounded text-[#2C2C2C] dark:text-[#e0e0e0] placeholder-[#999999] dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] dark:focus:ring-[#64b5f6] focus:border-transparent transition-colors text-sm lg:text-base"
                disabled={isGenerating}
                style={{ fontSize: '16px' }} // Prevent zoom on iOS
              />
              
              {/* Language Suggestions */}
              <div className="mt-2 lg:mt-3">
                <span className="text-xs lg:text-sm text-[#666666] dark:text-[#b0b0b0] mb-2 block">
                  Quick Select:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                  {languageSuggestions.slice(0, 12).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageSelect(lang)}
                      disabled={isGenerating}
                      className={`px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm rounded border transition-colors disabled:opacity-50 truncate ${
                        language === lang
                          ? 'bg-[#4A90E2] dark:bg-[#64b5f6] text-white border-[#4A90E2] dark:border-[#64b5f6]'
                          : 'bg-[#F5F5F5] dark:bg-[#242424] text-[#666666] dark:text-[#b0b0b0] border-[#e2e8f0] dark:border-[#404040] hover:bg-[#F0F0F0] dark:hover:bg-[#2c2c2c] hover:text-[#4A90E2] dark:hover:text-[#64b5f6]'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Options (for larger screens) */}
            <div className="hidden lg:block">
              <div className="bg-[#F5F5F5] dark:bg-[#242424] border border-[#e2e8f0] dark:border-[#404040] rounded p-4 lg:p-5">
                <h4 className="text-sm lg:text-base font-medium text-[#2C2C2C] dark:text-[#e0e0e0] mb-3">
                  Content Preferences
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs lg:text-sm text-[#666666] dark:text-[#b0b0b0] block mb-2">
                      Content Style:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {['Academic', 'Casual', 'Professional'].map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => handleContentStyleSelect(style)}
                          disabled={isGenerating}
                          className={`px-2 py-1 text-xs rounded border transition-colors disabled:opacity-50 ${
                            contentStyle === style
                              ? 'bg-[#4A90E2] dark:bg-[#64b5f6] text-white border-[#4A90E2] dark:border-[#64b5f6]'
                              : 'bg-[#FFFFFF] dark:bg-[#222222] text-[#666666] dark:text-[#b0b0b0] border-[#e2e8f0] dark:border-[#404040] hover:bg-[#F0F0F0] dark:hover:bg-[#2c2c2c] hover:text-[#4A90E2] dark:hover:text-[#64b5f6]'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs lg:text-sm text-[#666666] dark:text-[#b0b0b0] block mb-2">
                      Length:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {['Short', 'Medium', 'Detailed'].map((length) => (
                        <button
                          key={length}
                          type="button"
                          onClick={() => handleContentLengthSelect(length)}
                          disabled={isGenerating}
                          className={`px-2 py-1 text-xs rounded border transition-colors disabled:opacity-50 ${
                            contentLength === length
                              ? 'bg-[#4A90E2] dark:bg-[#64b5f6] text-white border-[#4A90E2] dark:border-[#64b5f6]'
                              : 'bg-[#FFFFFF] dark:bg-[#222222] text-[#666666] dark:text-[#b0b0b0] border-[#e2e8f0] dark:border-[#404040] hover:bg-[#F0F0F0] dark:hover:bg-[#2c2c2c] hover:text-[#4A90E2] dark:hover:text-[#64b5f6]'
                          }`}
                        >
                          {length}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-[#F5F5F5] dark:bg-[#242424] border border-[#e2e8f0] dark:border-[#404040] rounded p-3 lg:p-4">
              <p className="text-xs lg:text-sm text-[#666666] dark:text-[#b0b0b0] leading-relaxed">
                <strong>Tip:</strong> Be specific with your topic for better results. The AI will generate comprehensive content including key points, explanations, and examples.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-none border-t border-[#e2e8f0] dark:border-[#404040] p-4 sm:p-5 lg:p-6 xl:p-8">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="order-2 sm:order-1 px-4 lg:px-6 py-3 lg:py-4 bg-[#F5F5F5] dark:bg-[#242424] text-[#666666] dark:text-[#b0b0b0] border border-[#e2e8f0] dark:border-[#404040] rounded text-sm lg:text-base font-medium hover:bg-[#F0F0F0] dark:hover:bg-[#2c2c2c] transition-colors disabled:opacity-50 touch-manipulation"
            >
              Cancel
            </button>
            
            <button
              ref={generateButtonRef}
              type="button"
              onClick={handleSubmit}
              disabled={isGenerating || !topic.trim()}
              className="order-1 sm:order-2 flex-1 flex items-center justify-center gap-2 lg:gap-3 px-4 lg:px-6 py-3 lg:py-4 bg-[#4A90E2] hover:bg-[#357ABD] dark:bg-[#64b5f6] dark:hover:bg-[#42a5f5] text-white rounded text-sm lg:text-base font-medium transition-colors disabled:opacity-50 touch-manipulation min-h-[48px] lg:min-h-[56px]"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <MdAutoAwesome className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">Generate Note ({topic.trim() ? '⌘' : ''}↵)</span>
                  <span className="sm:hidden">Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerateModal;

