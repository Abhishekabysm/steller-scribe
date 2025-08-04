import React, { useState, useEffect } from 'react';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import { FaKeyboard } from 'react-icons/fa6';
import { FaQuestionCircle } from 'react-icons/fa';

const KeyboardShortcutsApp: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add keyboard shortcut listener for demo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      {/* Prominent Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <FaKeyboard className="w-6 h-6" />
          <h2 className="text-xl font-bold">Keyboard Shortcuts Demo</h2>
        </div>
        <p className="text-blue-100">
          Press <kbd className="px-2 py-1 bg-white/20 rounded text-white font-mono">Ctrl + ?</kbd> or click the floating button to open the shortcuts modal
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Keyboard Shortcuts Help Modal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A comprehensive help modal showing all available keyboard shortcuts in the application
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Features
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Categorized shortcuts for better organization
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Visual keyboard key representations
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Icons for each shortcut category and action
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Responsive design for mobile and desktop
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Dark/light theme support
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Accessible with proper ARIA labels
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            How to Use
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              <strong>Keyboard Shortcut:</strong> Press{' '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-mono rounded">
                Ctrl
              </kbd>{' '}
              +{' '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-mono rounded">
                ?
              </kbd>{' '}
              to open the shortcuts panel
            </p>
            <p>
              <strong>Button Click:</strong> Use the button below to open the modal
            </p>
          </div>
        </div>

        <div className="text-center space-y-6">
          <div className="space-y-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaKeyboard className="w-6 h-6" />
              Open Keyboard Shortcuts Modal
            </button>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <FaQuestionCircle className="w-4 h-4" />
                <span>Press</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-mono rounded">
                  Ctrl
                </kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-mono rounded">
                  ?
                </kbd>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
              <FaQuestionCircle className="w-5 h-5" />
              <span className="font-medium">Try it now!</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Click the button above or use either keyboard shortcut to see the modal in action
            </p>
          </div>
        </div>

        {/* Floating Help Button - Always Visible */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
            title="Open Keyboard Shortcuts (Ctrl + ? or Ctrl + /)"
          >
            <FaQuestionCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Integration Notes
          </h3>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p>
              • The modal follows the existing design patterns from other modals in the application
            </p>
            <p>
              • Uses the same color tokens and theme variables for consistency
            </p>
            <p>
              • Keyboard navigation and focus management included
            </p>
            <p>
              • Responsive design adapts to different screen sizes
            </p>
          </div>
        </div>
      </div>

      <KeyboardShortcutsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default KeyboardShortcutsApp;