import React from 'react';
import { NoteVersion } from '../../types';
import { versionControlService } from '../../services/versionControlService';
import { useToasts } from '../../hooks/useToasts';

interface VersionModalFooterProps {
  versions: NoteVersion[];
  onClose: () => void;
}

const VersionModalFooter: React.FC<VersionModalFooterProps> = ({
  versions,
  onClose
}) => {
  const { addToast } = useToasts();
  const storageInfo = versionControlService.getStorageSize();
  const storageStatus = versionControlService.checkStorageQuota();
  const maxBytes = versionControlService.getMaxStorageSize();
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageStatusColor = () => {
    if (storageStatus.usagePercent > 0.9) return 'text-red-600 dark:text-red-400';
    if (storageStatus.usagePercent > 0.7) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getStorageStatusIcon = () => {
    if (storageStatus.usagePercent > 0.9) return '⚠️';
    if (storageStatus.usagePercent > 0.7) return '⚡';
    return '💾';
  };

  return (
    <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {versions.length} total versions • {formatBytes(storageInfo.totalSize)} of {formatBytes(maxBytes)} used
        </div>
        
        {/* Storage Status Indicator */}
        <div className={`flex items-center space-x-1 text-xs ${getStorageStatusColor()}`}>
          <span>{getStorageStatusIcon()}</span>
          <span>{(storageStatus.usagePercent * 100).toFixed(1)}% storage used</span>
        </div>
        
        {/* Storage Warning */}
        {storageStatus.needsCleanup && (
          <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md">
            Storage getting full - consider cleanup
          </div>
        )}
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={() => {
            const cleanedCount = versionControlService.cleanupOldVersions(20);
            if (cleanedCount > 0) {
              addToast(`Removed ${cleanedCount} old version${cleanedCount > 1 ? 's' : ''}.`, 'success');
            } else {
              addToast('No old versions to clean up.', 'info');
            }
            // Notify modal to refresh its data without a full reload
            window.dispatchEvent(new CustomEvent('versions:cleanup'));
          }}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
        >
          Cleanup Old Versions
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 shadow-sm transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default VersionModalFooter;
