import React from 'react';
import { NoteVersion } from '../../types';

interface DiffViewProps {
  compareVersion: NoteVersion;
  selectedVersion: NoteVersion;
  diffView: 'side-by-side' | 'unified';
  setDiffView: (view: 'side-by-side' | 'unified') => void;
}

const DiffView: React.FC<DiffViewProps> = ({
  compareVersion,
  selectedVersion,
  diffView,
  setDiffView
}) => {
  const generateDiffView = (oldContent: string, newContent: string) => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diffLines: Array<{
      type: 'unchanged' | 'added' | 'removed' | 'modified';
      oldLine?: string;
      newLine?: string;
      lineNumber?: number;
      oldLineNumber?: number;
      newLineNumber?: number;
    }> = [];

    // Remove trailing empty lines from both arrays
    while (oldLines.length > 0 && oldLines[oldLines.length - 1].trim() === '') {
      oldLines.pop();
    }
    while (newLines.length > 0 && newLines[newLines.length - 1].trim() === '') {
      newLines.pop();
    }

    // Use the same improved diff algorithm as the service
    const diff = calculateLineDiff(oldLines, newLines);
    
    // Convert to the format expected by the UI
    for (const change of diff) {
      if (change.type === 'unchanged') {
        // Only show unchanged lines if they have content
        if ((change.oldLine || '').trim() !== '') {
          diffLines.push({
            type: 'unchanged',
            oldLine: change.oldLine,
            newLine: change.newLine,
            lineNumber: (change.oldIndex || 0) + 1,
            oldLineNumber: (change.oldIndex || 0) + 1,
            newLineNumber: (change.newIndex || 0) + 1
          });
        }
      } else if (change.type === 'added') {
        // Only show added lines if they have content
        if ((change.newLine || '').trim() !== '') {
          diffLines.push({
            type: 'added',
            newLine: change.newLine,
            lineNumber: (change.newIndex || 0) + 1,
            newLineNumber: (change.newIndex || 0) + 1
          });
        }
      } else if (change.type === 'removed') {
        // Only show removed lines if they have content
        if ((change.oldLine || '').trim() !== '') {
          diffLines.push({
            type: 'removed',
            oldLine: change.oldLine,
            lineNumber: (change.oldIndex || 0) + 1,
            oldLineNumber: (change.oldIndex || 0) + 1
          });
        }
      }
    }

    return diffLines;
  };

  // Character diff removed per request

  // Helper function for line diff calculation (same as in service)
  const calculateLineDiff = (oldLines: string[], newLines: string[]): Array<{
    type: 'added' | 'removed' | 'modified' | 'unchanged';
    oldLine?: string;
    newLine?: string;
    oldIndex?: number;
    newIndex?: number;
  }> => {
    const result: Array<{
      type: 'added' | 'removed' | 'modified' | 'unchanged';
      oldLine?: string;
      newLine?: string;
      oldIndex?: number;
      newIndex?: number;
    }> = [];
    
    // Create a map of line content to positions for quick lookup
    const oldLineMap = new Map<string, number[]>();
    const newLineMap = new Map<string, number[]>();
    
    // Build maps for both arrays
    oldLines.forEach((line, index) => {
      if (!oldLineMap.has(line)) {
        oldLineMap.set(line, []);
      }
      oldLineMap.get(line)!.push(index);
    });
    
    newLines.forEach((line, index) => {
      if (!newLineMap.has(line)) {
        newLineMap.set(line, []);
      }
      newLineMap.get(line)!.push(index);
    });
    
    // Find matching lines that appear in both arrays
    const matches: Array<{oldIndex: number, newIndex: number}> = [];
    const usedOld = new Set<number>();
    const usedNew = new Set<number>();
    
    // Find exact matches first
    for (const [line, oldIndices] of oldLineMap) {
      if (newLineMap.has(line)) {
        const newIndices = newLineMap.get(line)!;
        // Match as many as possible
        const minCount = Math.min(oldIndices.length, newIndices.length);
        for (let i = 0; i < minCount; i++) {
          const oldIndex = oldIndices[i];
          const newIndex = newIndices[i];
          if (!usedOld.has(oldIndex) && !usedNew.has(newIndex)) {
            matches.push({oldIndex, newIndex});
            usedOld.add(oldIndex);
            usedNew.add(newIndex);
          }
        }
      }
    }
    
    // Sort matches by old index to maintain order
    matches.sort((a, b) => a.oldIndex - b.oldIndex);
    
    // Process all lines
    let oldIndex = 0, newIndex = 0, matchIndex = 0;
    
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      // Check if current positions match
      const currentMatch = matchIndex < matches.length && 
                          matches[matchIndex].oldIndex === oldIndex && 
                          matches[matchIndex].newIndex === newIndex;
      
      if (currentMatch) {
        // Lines match
        result.push({
          type: 'unchanged',
          oldLine: oldLines[oldIndex],
          newLine: newLines[newIndex],
          oldIndex: oldIndex,
          newIndex: newIndex
        });
        oldIndex++;
        newIndex++;
        matchIndex++;
      } else if (newIndex < newLines.length && !usedNew.has(newIndex)) {
        // Line was added
        result.push({
          type: 'added',
          newLine: newLines[newIndex],
          newIndex: newIndex
        });
        newIndex++;
      } else if (oldIndex < oldLines.length && !usedOld.has(oldIndex)) {
        // Line was removed
        result.push({
          type: 'removed',
          oldLine: oldLines[oldIndex],
          oldIndex: oldIndex
        });
        oldIndex++;
      } else {
        // Skip used lines
        oldIndex++;
        newIndex++;
      }
    }
    
    return result;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-6">
      <div className="mb-6 flex items-center space-x-3 flex-shrink-0">
        <button
          onClick={() => setDiffView('side-by-side')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            diffView === 'side-by-side'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Side by Side
        </button>
        <button
          onClick={() => setDiffView('unified')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            diffView === 'unified'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Unified
        </button>
        {/* Character diff toggle removed */}
      </div>
      
      <div className="flex-1 min-h-0">
        {diffView === 'side-by-side' ? (
          // Side by side diff
          <div className="grid grid-cols-2 gap-6 h-full">
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  v{compareVersion.version} (Original)
                </h4>
              </div>
              <div className="flex-1 overflow-y-auto">
                {generateDiffView(compareVersion.content, selectedVersion.content)
                  .filter(line => line.type === 'removed' || line.type === 'unchanged')
                  .map((line, index) => (
                  <div
                    key={index}
                    data-line={line.oldLineNumber || line.lineNumber}
                    className={`px-4 py-1 text-sm font-mono border-l-4 ${
                      line.type === 'removed'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-400 dark:border-red-600'
                        : 'text-gray-900 dark:text-gray-100 border-transparent'
                    }`}
                  >
                    <span className="text-gray-400 dark:text-gray-500 mr-3 text-xs">
                      {line.oldLineNumber || line.lineNumber}
                    </span>
                    <span className="mr-2 text-red-500 dark:text-red-400">
                      {line.type === 'removed' ? '-' : ' '}
                    </span>
                    {line.oldLine || ''}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  v{selectedVersion.version} (Current)
                </h4>
              </div>
              <div className="flex-1 overflow-y-auto">
                {generateDiffView(compareVersion.content, selectedVersion.content)
                  .filter(line => line.type === 'added' || line.type === 'unchanged')
                  .map((line, index) => (
                  <div
                    key={index}
                    data-line={line.newLineNumber || line.lineNumber}
                    className={`px-4 py-1 text-sm font-mono border-l-4 ${
                      line.type === 'added'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-400 dark:border-green-600'
                        : 'text-gray-900 dark:text-gray-100 border-transparent'
                    }`}
                  >
                    <span className="text-gray-400 dark:text-gray-500 mr-3 text-xs">
                      {line.newLineNumber || line.lineNumber}
                    </span>
                    <span className="mr-2 text-green-500 dark:text-green-400">
                      {line.type === 'added' ? '+' : ' '}
                    </span>
                    {line.newLine || ''}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Unified diff
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Unified Diff View
              </h4>
            </div>
            <div className="flex-1 overflow-y-auto">
              {generateDiffView(compareVersion.content, selectedVersion.content)
                .filter(line => line.type !== 'unchanged') // Show only changes in unified view
                .map((line, index) => (
                <div
                  key={index}
                  data-line={line.type === 'added' ? line.newLineNumber : line.oldLineNumber || line.lineNumber}
                  className={`px-4 py-1 text-sm font-mono border-l-4 ${
                    line.type === 'added'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-400 dark:border-green-600'
                      : line.type === 'removed'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-400 dark:border-red-600'
                      : line.type === 'modified'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-400 dark:border-yellow-600'
                      : 'text-gray-900 dark:text-gray-100 border-transparent'
                  }`}
                >
                  <span className="text-gray-400 dark:text-gray-500 mr-3 text-xs">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : '~'}
                  </span>
                  <span className="text-gray-500 mr-3 text-xs">
                    {line.type === 'added' ? line.newLineNumber : line.oldLineNumber || line.lineNumber}
                  </span>
                  {line.type === 'added' ? line.newLine : line.type === 'removed' ? line.oldLine : line.oldLine || line.newLine || ''}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiffView;
