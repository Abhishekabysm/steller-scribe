import { useState, useEffect } from 'react';
import { useSessionStorage } from './useSessionStorage';

interface FeatureAnnouncementConfig {
  featureId: string;
  featureName: string;
  title?: string;
  description: string;
  visual?: {
    type: 'icon' | 'image' | 'gif';
    src?: string;
    iconComponent?: React.ComponentType<{ className?: string }>;
    alt?: string;
  };
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  dismissAction?: {
    label: string;
    onClick?: () => void;
  };
  showAfterDelay?: number; // Show modal after X milliseconds (default: 0)
  enabled?: boolean; // Whether this announcement is enabled (default: true)
}

/**
 * A hook to manage feature announcements with session-based dismissal.
 * Each feature announcement is shown only once per session.
 */
export function useFeatureAnnouncement(config: FeatureAnnouncementConfig) {
  const {
    featureId,
    showAfterDelay = 0,
    enabled = true,
    ...announcementData
  } = config;

  const [dismissedFeatures, setDismissedFeatures] = useSessionStorage<string[]>(
    'stellar-scribe-dismissed-features',
    []
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // Check if this feature has been dismissed in this session
  const isDismissed = dismissedFeatures.includes(featureId);

  // Show the modal after delay if enabled and not dismissed
  useEffect(() => {
    if (!enabled || isDismissed || hasShown) return;

    const timer = setTimeout(() => {
      setIsModalOpen(true);
      setHasShown(true);
    }, showAfterDelay);

    return () => clearTimeout(timer);
  }, [enabled, isDismissed, hasShown, showAfterDelay]);

  const handleClose = () => {
    setIsModalOpen(false);
    if (!dismissedFeatures.includes(featureId)) {
      setDismissedFeatures([...dismissedFeatures, featureId]);
    }
  };

  const handlePrimaryAction = () => {
    if (announcementData.primaryAction?.onClick) {
      announcementData.primaryAction.onClick();
    }
    handleClose();
  };

  const handleDismissAction = () => {
    if (announcementData.dismissAction?.onClick) {
      announcementData.dismissAction.onClick();
    }
    handleClose();
  };

  // Force show the announcement (useful for testing or re-triggering)
  const forceShow = () => {
    if (enabled) {
      setIsModalOpen(true);
      setHasShown(true);
    }
  };

  // Reset dismissal state for this feature (useful for testing)
  const resetDismissal = () => {
    const updatedFeatures = dismissedFeatures.filter(id => id !== featureId);
    setDismissedFeatures(updatedFeatures);
    setHasShown(false);
  };

  // Clear all dismissed features (useful for development/testing)
  const clearAllDismissals = () => {
    setDismissedFeatures([]);
    setHasShown(false);
  };

  return {
    // Modal state
    isModalOpen,
    isDismissed,
    hasShown,
    
    // Modal data
    modalProps: {
      isOpen: isModalOpen,
      onClose: handleClose,
      featureName: announcementData.featureName,
      title: announcementData.title,
      description: announcementData.description,
      visual: announcementData.visual,
      primaryAction: announcementData.primaryAction 
        ? {
            ...announcementData.primaryAction,
            onClick: handlePrimaryAction,
          }
        : undefined,
      dismissAction: announcementData.dismissAction
        ? {
            ...announcementData.dismissAction,
            onClick: handleDismissAction,
          }
        : { label: 'Later', onClick: handleDismissAction },
    },
    
    // Control functions
    forceShow,
    resetDismissal,
    clearAllDismissals,
  };
}
