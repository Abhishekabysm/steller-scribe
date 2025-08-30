import React from 'react';
import { FaUndo } from 'react-icons/fa';
import { versionControlService } from '../../services/versionControlService';
import { NoteVersion } from '../../types';
import DiffView from './DiffView';

interface VersionCompareViewProps {
  compareVersion: NoteVersion;
  selectedVersion: NoteVersion;
  showDiff: boolean;
  setShowDiff: (show: boolean) => void;
  diffView: 'side-by-side' | 'unified';
  setDiffView: (view: 'side-by-side' | 'unified') => void;
  onRestoreVersion: (version: NoteVersion) => void;
  showCharDiff?: boolean;
  setShowCharDiff?: (show: boolean) => void;
  currentNoteVersion?: number; // Add this prop to identify the current version
}

const VersionCompareView: React.FC<VersionCompareViewProps> = ({
  compareVersion,
  selectedVersion,
  showDiff,
  setShowDiff,
  diffView,
  setDiffView,
  onRestoreVersion,
  showCharDiff,
  setShowCharDiff,
  currentNoteVersion
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'auto': return 'Auto-save';
      case 'manual': return 'Manual save';
      case 'restore': return 'Restored';
      default: return 'Unknown';
    }
  };

  // Check if this version is the current one in the editor
  const isCurrentVersion = (version: NoteVersion) => {
    return currentNoteVersion && version.version === currentNoteVersion;
  };

  // Function to render content with diff highlighting
  const renderHighlightedContent = (content: string, isOldVersion: boolean) => {
    const oldLines = compareVersion.content.split('\n');
    const newLines = selectedVersion.content.split('\n');
    const contentLines = content.split('\n');
    const otherLines = isOldVersion ? newLines : oldLines;
    
    return contentLines.map((line, index) => {
      const otherLine = otherLines[index];
      const isDifferent = line !== otherLine;
      const lineNumber = index + 1;
      
      // Skip empty lines to reduce spacing
      if (line.trim() === '') {
        return null;
      }
      
      if (isDifferent) {
        const highlightClass = isOldVersion 
          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-l-4 border-red-400 dark:border-red-600'
          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-l-4 border-green-400 dark:border-green-600';
        
        return (
          <div key={index} className={`${highlightClass} px-1 py-0.5 flex items-start`}>
            <span className="text-gray-400 dark:text-gray-500 mr-2 text-xs font-mono flex-shrink-0 w-8">
              {lineNumber}
            </span>
            <span className="flex-1">{line}</span>
          </div>
        );
      } else {
        return (
          <div key={index} className="px-1 py-0.5 flex items-start">
            <span className="text-gray-400 dark:text-gray-500 mr-2 text-xs font-mono flex-shrink-0 w-8">
              {lineNumber}
            </span>
            <span className="flex-1">{line}</span>
          </div>
        );
      }
    }).filter(Boolean); // Remove null entries (empty lines)
  };

  const getDiffStats = () => {
    const stats = versionControlService.compareVersions(selectedVersion.noteId, compareVersion.version, selectedVersion.version);
    console.log('Diff stats:', {
      compareVersion: compareVersion.version,
      selectedVersion: selectedVersion.version,
      stats: stats.diff,
      compareContent: compareVersion.content.substring(0, 100) + '...',
      selectedContent: selectedVersion.content.substring(0, 100) + '...'
    });
    return stats;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Comparing v{compareVersion.version} → v{selectedVersion.version}
            </h3>
            {(() => {
              const stats = getDiffStats();
              return stats && (
                <div className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>+{stats.diff.addedLines} lines</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>-{stats.diff.removedLines} lines</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>{stats.diff.changedChars} chars</span>
                  </span>
                </div>
              );
            })()}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                showDiff 
                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
              }`}
            >
              {showDiff ? 'Hide Diff' : 'Show Diff'}
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
      </div>
      
      {showDiff ? (
        <DiffView
          compareVersion={compareVersion}
          selectedVersion={selectedVersion}
          diffView={diffView}
          setDiffView={setDiffView}
          showCharDiff={showCharDiff}
          setShowCharDiff={setShowCharDiff}
        />
      ) : (
        <div className="flex-1 flex min-h-0 h-full">
          <div className="w-1/2 border-r border-gray-100 dark:border-gray-800 flex flex-col min-h-0 h-full">
            <div className="flex-shrink-0 p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  v{compareVersion.version}
                </h4>
                {isCurrentVersion(compareVersion) && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                    Current Version
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {formatDate(compareVersion.createdAt)}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Diff highlighting enabled • Red = removed/changed
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono leading-relaxed">
                {renderHighlightedContent(compareVersion.content, true)}
              </div>
            </div>
          </div>
          
          <div className="w-1/2 flex flex-col min-h-0 h-full">
            <div className="flex-shrink-0 p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  v{selectedVersion.version}
                </h4>
                {isCurrentVersion(selectedVersion) && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                    Current Version
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {formatDate(selectedVersion.createdAt)}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Diff highlighting enabled • Green = added/changed
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono leading-relaxed">
                {renderHighlightedContent(selectedVersion.content, false)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionCompareView;
