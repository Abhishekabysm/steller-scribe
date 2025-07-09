
import React, { useState } from 'react';

interface AIGenerateModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onGenerate: (data: { topic: string; language: string }) => void;
}

const AIGenerateModal: React.FC<AIGenerateModalProps> = ({ 
    isOpen, 
    isGenerating,
    onClose, 
    onGenerate
}) => {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('English');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
        onGenerate({ topic, language: language.trim() || 'English' });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-generate-title"
    >
      <div 
        className="bg-surface dark:bg-dark-surface rounded-lg shadow-2xl max-w-md w-full p-6 animate-slide-in" 
        onClick={e => e.stopPropagation()}
      >
        <h3 id="ai-generate-title" className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Generate Note with AI</h3>
        <p className="text-text-secondary dark:text-dark-text-secondary mb-6">Describe the topic for the note you want to create.</p>
        
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">Topic</label>
                    <input
                        id="topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., The History of Ancient Rome"
                        className="w-full px-3 py-2 bg-bg-secondary dark:bg-dark-bg-secondary rounded-md text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="language" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">Language (optional)</label>
                    <input
                        id="language"
                        type="text"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        placeholder="e.g., English, Spanish, Hindi"
                        className="w-full px-3 py-2 bg-bg-secondary dark:bg-dark-bg-secondary rounded-md text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent"
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
            <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 bg-bg-secondary dark:bg-dark-bg-secondary text-text-primary dark:text-dark-text-primary font-bold rounded-md hover:bg-border-color dark:hover:bg-dark-border-color transition-colors disabled:opacity-50"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className="px-4 py-2 text-white font-bold rounded-md transition-colors bg-accent hover:bg-accent-hover dark:bg-dark-accent dark:hover:bg-dark-accent-hover flex items-center justify-center space-x-2 w-28 disabled:opacity-50"
            >
                {isGenerating ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <span>Generate</span>}
            </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AIGenerateModal;
