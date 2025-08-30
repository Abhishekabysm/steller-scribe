import React from 'react';
import { FaClock, FaTrash, FaSave, FaUndo } from 'react-icons/fa';
import { NoteVersion } from '../../types';
import VersionItem from './VersionItem';

interface VersionSidebarProps {
  versions: NoteVersion[];
  selectedVersion: NoteVersion | null;
  compareVersion: NoteVersion | null;
  compareMode: boolean;
  onSelectVersion: (version: NoteVersion) => void;
  onSetCompareVersion: (version: NoteVersion | null) => void;
  onSetCompareMode: (mode: boolean) => void;
  onDeleteVersion: (version: NoteVersion) => void;
}

const VersionSidebar: React.FC<VersionSidebarProps> = ({
  versions,
  selectedVersion,
  compareVersion,
  compareMode,
  onSelectVersion,
  onSetCompareVersion,
  onSetCompareMode,
  onDeleteVersion
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

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'auto': return <FaSave className="w-3 h-3 text-gray-400" />;
      case 'manual': return <FaSave className="w-3 h-3 text-blue-500" />;
      case 'restore': return <FaUndo className="w-3 h-3 text-green-500" />;
      default: return <FaClock className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="w-72 border-r border-gray-100 dark:border-gray-800 bg-gradient-to-b from-gray-50/80 to-gray-100/40 dark:from-gray-800/80 dark:to-gray-900/40">
      <div className="p-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Versions ({versions.length})
            </h3>
          </div>
          {compareMode && (
            <button
              onClick={() => {
                onSetCompareMode(false);
                onSetCompareVersion(null);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
            >
              Cancel
            </button>
          )}
        </div>

        {compareMode ? (
          <div className="space-y-3">
            <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium text-center">
                Select two versions to compare
              </p>
            </div>
            {versions.map((version) => (
              <VersionItem
                key={version.id}
                version={version}
                isSelected={selectedVersion?.version === version.version}
                isCompareSelected={compareVersion?.version === version.version}
                compareMode={true}
                formatDate={formatDate}
                getChangeTypeLabel={getChangeTypeLabel}
                getChangeTypeIcon={getChangeTypeIcon}
                onSelect={() => {
                  if (compareVersion?.version === version.version) {
                    onSetCompareVersion(null);
                  } else if (selectedVersion?.version === version.version) {
                    onSelectVersion(compareVersion!);
                    onSetCompareVersion(version);
                  } else {
                    onSetCompareVersion(version);
                  }
                }}
                onDelete={onDeleteVersion}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaClock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">No versions yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Start editing to create your first version</p>
              </div>
            ) : (
              versions.map((version) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isSelected={selectedVersion?.version === version.version}
                  isCompareSelected={false}
                  compareMode={false}
                  formatDate={formatDate}
                  getChangeTypeLabel={getChangeTypeLabel}
                  getChangeTypeIcon={getChangeTypeIcon}
                  onSelect={() => onSelectVersion(version)}
                  onDelete={onDeleteVersion}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionSidebar;
