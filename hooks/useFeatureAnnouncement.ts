import { useState, useEffect } from 'react';

/**
 * LocalStorage helpers with SSR safety
 */
function safeGetLocalStorageItem<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetLocalStorageItem<T>(key: string, value: T) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota or privacy errors
  }
}

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
 * A hook to manage feature announcements with device (localStorage) based dismissal.
 * Each feature announcement is shown only once per device. When you add a new
 * feature with a new featureId, it will show once on that device.
 */
export function useFeatureAnnouncement(config: FeatureAnnouncementConfig) {
  const {
    featureId,
    showAfterDelay = 0,
    enabled = true,
    ...announcementData
  } = config;

  const STORAGE_KEY = 'stellar-scribe-dismissed-features-v2';

  const [dismissedFeatures, setDismissedFeatures] = useState<string[]>(() =>
    safeGetLocalStorageItem<string[]>(STORAGE_KEY, [])
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // Persist to localStorage whenever list changes
  useEffect(() => {
    safeSetLocalStorageItem(STORAGE_KEY, dismissedFeatures);
  }, [dismissedFeatures]);

  // Check if this feature has been dismissed on this device
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

  const markDismissed = () => {
    if (!dismissedFeatures.includes(featureId)) {
      setDismissedFeatures([...dismissedFeatures, featureId]);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    markDismissed();
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

  // Clear all dismissed features on this device (useful for development/testing)
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
