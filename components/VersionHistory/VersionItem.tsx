import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { NoteVersion } from '../../types';

interface VersionItemProps {
  version: NoteVersion;
  isSelected: boolean;
  isCompareSelected: boolean;
  compareMode: boolean;
  formatDate: (timestamp: number) => string;
  getChangeTypeLabel: (changeType: string) => string;
  getChangeTypeIcon: (changeType: string) => React.ReactNode;
  onSelect: () => void;
  onDelete: (version: NoteVersion) => void;
}

const VersionItem: React.FC<VersionItemProps> = ({
  version,
  isSelected,
  isCompareSelected,
  compareMode,
  formatDate,
  getChangeTypeLabel,
  getChangeTypeIcon,
  onSelect,
  onDelete
}) => {
  const getBorderClass = () => {
    if (compareMode) {
      if (isSelected) return 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 scale-[1.02]';
      if (isCompareSelected) return 'border-green-300 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-100 dark:shadow-green-900/20 scale-[1.02]';
      return 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-800/50 hover:shadow-md hover:scale-[1.01]';
    } else {
      if (isSelected) return 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 scale-[1.02]';
      return 'hover:bg-white dark:hover:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md hover:scale-[1.01]';
    }
  };

  const getVersionBadgeClass = () => {
    if (isSelected) return 'bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400';
    if (isCompareSelected) return 'bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  };

  const getSelectionIndicator = () => {
    if (compareMode) {
      if (isSelected || isCompareSelected) {
        return (
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
            isSelected ? 'bg-blue-500' : 'bg-green-500'
          } shadow-lg`}></div>
        );
      }
    } else {
      if (isSelected) {
        return <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full shadow-lg"></div>;
      }
    }
    return null;
  };

  return (
    <div
      className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${getBorderClass()}`}
      onClick={onSelect}
    >
      {getSelectionIndicator()}
      
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${getVersionBadgeClass()}`}>
              <span className="font-bold text-sm">
                v{version.version}
              </span>
            </div>
            <div className="flex items-center space-x-2">
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              {formatDate(version.createdAt)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
              {version.changeDescription}
            </p>
            
            {version.diffStats && (
              <div className="flex items-center space-x-2 pt-2">
                {version.diffStats.addedLines > 0 && (
                  <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span className="text-xs font-medium">+{version.diffStats.addedLines}</span>
                  </div>
                )}
                {version.diffStats.removedLines > 0 && (
                  <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <span className="text-xs font-medium">-{version.diffStats.removedLines}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {!compareMode && (
          <div className="flex space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(version);
              }}
              className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center justify-center transition-all duration-200 hover:scale-110"
              title="Delete version"
            >
              <FaTrash className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionItem;
