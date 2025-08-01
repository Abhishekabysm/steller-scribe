import React, { useState, useEffect } from 'react';
import { FaLightbulb } from 'react-icons/fa6';
import FeatureAnnouncementModal from './FeatureAnnouncementModal';
import { useToasts } from '../hooks/useToasts';

// Define the shape of an announcement's configuration
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
}

/**
 * LocalStorage helpers (SSR safe)
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
    // ignore
  }
}

/**
 * Manages and displays a queue of feature announcements,
 * ensuring only one is shown at a time.
 * Uses localStorage so each feature is shown once per device.
 */
const FeatureAnnouncementManager: React.FC = () => {
  const { addToast } = useToasts();

  // --- Announcement Definitions ---
  // Define all announcements in the order they should appear.
  const ANNOUNCEMENT_QUEUE: FeatureAnnouncementConfig[] = [
    {
      featureId: 'code-line-copy-v1',
      featureName: 'Line copy in code blocks',
      title: '🔖 Click-to-copy a single code line',
      description:
        'Hover a code line to see a subtle gutter caret. Click to copy just that line. Inline code copies on click. Use the top-right button to copy the whole block.',
      visual: {
        type: 'icon',
        iconComponent: FaLightbulb,
      },
      primaryAction: {
        label: 'Try it now',
        onClick: () => {
          addToast('Tip: Hover a code line to see the gutter caret, then click to copy that line.', 'success');
        },
      },
      dismissAction: {
        label: 'Later',
        onClick: () => {
          addToast('You can use the gutter caret anytime to copy a single line from code blocks.', 'info');
        },
      },
    },
  ];

  const STORAGE_KEY = 'stellar-scribe-dismissed-features-v2';

  const [dismissedFeatures, setDismissedFeatures] = useState<string[]>(
    () => safeGetLocalStorageItem<string[]>(STORAGE_KEY, [])
  );
  const [activeAnnouncement, setActiveAnnouncement] = useState<FeatureAnnouncementConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Persist to localStorage whenever list changes
  useEffect(() => {
    safeSetLocalStorageItem(STORAGE_KEY, dismissedFeatures);
  }, [dismissedFeatures]);

  // Effect to find and show the first available announcement on component mount.
  useEffect(() => {
    if (isInitialized) return;

    const nextAnnouncement = ANNOUNCEMENT_QUEUE.find(
      config => !dismissedFeatures.includes(config.featureId)
    );

    if (nextAnnouncement) {
      // Delay the very first announcement to avoid overwhelming the user on load.
      const timer = setTimeout(() => {
        setActiveAnnouncement(nextAnnouncement);
      }, 1500); // 1.5 second delay on initial load
      
      return () => clearTimeout(timer);
    }
    
    setIsInitialized(true);
  }, [dismissedFeatures, isInitialized]);

  const handleClose = (shouldShowNext: boolean = true) => {
    if (!activeAnnouncement) return;

    const dismissedId = activeAnnouncement.featureId;
    
    // Clear current announcement immediately to prevent flickering
    setActiveAnnouncement(null);
    
    // Add the closed announcement to the dismissed list
    const newDismissedFeatures = [...dismissedFeatures, dismissedId];
    setDismissedFeatures(newDismissedFeatures);
    
    // Only show next announcement if shouldShowNext is true (i.e., user dismissed, not engaged)
    if (shouldShowNext) {
      // Find the next announcement in the queue
      const currentIndex = ANNOUNCEMENT_QUEUE.findIndex(a => a.featureId === dismissedId);
      const nextAnnouncement = ANNOUNCEMENT_QUEUE.slice(currentIndex + 1).find(
        config => !newDismissedFeatures.includes(config.featureId)
      );

      // Show the next announcement after a longer delay to avoid overwhelming the user
      if (nextAnnouncement) {
        setTimeout(() => {
          setActiveAnnouncement(nextAnnouncement);
        }, 1000); // 1 second delay between announcements
      }
    }
  };
  
  const handlePrimaryAction = () => {
    if (activeAnnouncement?.primaryAction?.onClick) {
      activeAnnouncement.primaryAction.onClick();
    }
    // When user clicks primary action, don't show next modal (they're engaged!)
    handleClose(false);
  };

  // --- Development Controls ---
  const handleForceShowLatest = () => {
    // This will show the latest feature modal even if dismissed, but only if no other modal is active
    if (!activeAnnouncement) {
      const latestConfig = ANNOUNCEMENT_QUEUE.find(a => a.featureId === 'code-line-copy-v1');
      if (latestConfig) setActiveAnnouncement(latestConfig);
    }
  };

  return (
    <>
      {activeAnnouncement && (
        <FeatureAnnouncementModal
          isOpen={!!activeAnnouncement}
          onClose={handleClose}
          featureName={activeAnnouncement.featureName}
          title={activeAnnouncement.title}
          description={activeAnnouncement.description}
          visual={activeAnnouncement.visual}
          primaryAction={{
            label: activeAnnouncement.primaryAction?.label || 'Try it now',
            onClick: handlePrimaryAction,
          }}
          dismissAction={{
            label: activeAnnouncement.dismissAction?.label || 'Later',
            onClick: handleClose,
          }}
        />
      )}
      
      {/* Development Button - Only visible in non-production environments */}
      {typeof window !== 'undefined' &&
       window.location.hostname !== 'stellar-scribe.vercel.app' &&
       !window.location.hostname.includes('.vercel.app') && (
        <button
          onClick={handleForceShowLatest}
          className="fixed bottom-4 right-4 z-50 p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
          title="Test Feature Announcement (Dev Only)"
        >
          🧪
        </button>
      )}
    </>
  );
};

export default FeatureAnnouncementManager;
