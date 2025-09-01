import React from 'react';
import { FaEye, FaUndo } from 'react-icons/fa';
import { NoteVersion } from '../../types';

interface VersionContentViewProps {
  selectedVersion: NoteVersion;
  onSetCompareMode: (mode: boolean) => void;
  onRestoreVersion: (version: NoteVersion) => void;
}

const VersionContentView: React.FC<VersionContentViewProps> = ({
  selectedVersion,
  onSetCompareMode,
  onRestoreVersion
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Removed change type label from header per request

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              v{selectedVersion.version} - {selectedVersion.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(selectedVersion.createdAt)}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => onSetCompareMode(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex items-center space-x-2"
            >
              <FaEye className="w-4 h-4" />
              <span>Compare</span>
            </button>
            <button
              onClick={() => onRestoreVersion(selectedVersion)}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 shadow-sm transition-all duration-200 flex items-center space-x-2"
            >
              <FaUndo className="w-4 h-4" />
              <span>Restore</span>
            </button>
          </div>
        </div>
        {selectedVersion.changeDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            {selectedVersion.changeDescription}
          </p>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono leading-relaxed">
          {selectedVersion.content}
        </pre>
      </div>
    </div>
  );
};

export default VersionContentView;
