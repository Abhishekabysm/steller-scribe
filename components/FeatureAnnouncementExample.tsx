import React, { useState, useEffect } from 'react';
import { FaWandMagicSparkles, FaLightbulb } from 'react-icons/fa6';
import FeatureAnnouncementModal from './FeatureAnnouncementModal';
import { useSessionStorage } from '../hooks/useSessionStorage';
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
 * Manages and displays a queue of feature announcements,
 * ensuring only one is shown at a time.
 */
const FeatureAnnouncementManager: React.FC = () => {
  const { addToast } = useToasts();

  // --- Announcement Definitions ---
  // Define all announcements in the order they should appear.
  const ANNOUNCEMENT_QUEUE: FeatureAnnouncementConfig[] = [
    {
      featureId: 'inline-suggestions-v1',
      featureName: 'Smart Suggestions',
      title: '💡 Introducing Smart Suggestions',
      description: 'Get intelligent writing suggestions as you type to enhance your notes.',
      visual: {
        type: 'icon',
        iconComponent: FaLightbulb,
      },
      primaryAction: {
        label: 'Try it now',
        onClick: () => {
          addToast('💡 Smart suggestions enabled! Toggle the lightbulb icon in the toolbar to control this feature.', 'success');
        },
      },
      dismissAction: {
        label: 'Maybe later',
        onClick: () => {
          addToast('💡 You can enable smart suggestions anytime from the editor toolbar', 'info');
        },
      },
    },
    {
      featureId: 'ai-summary-v2',
      featureName: 'AI Summary',
      title: '✨ Introducing AI Summary',
      description: 'Transform lengthy notes into concise, intelligent summaries with AI.',
      visual: {
        type: 'icon',
        iconComponent: FaWandMagicSparkles,
      },
      primaryAction: {
        label: 'Try it now',
        onClick: () => {
          addToast('🎉 AI Summary feature activated! Look for the magic wand icon in your note toolbar.', 'success');
        },
      },
      dismissAction: {
        label: 'Maybe later',
        onClick: () => {
          addToast('💡 You can access AI Summary anytime from the note toolbar', 'info');
        },
      },
    },
    {
      featureId: 'enhanced-search-v3',
      featureName: 'Smart Search',
      title: '🔍 Enhanced Smart Search',
      description: 'Find notes faster with intelligent, context-aware search.',
      primaryAction: {
        label: 'Explore search',
        onClick: () => {
          addToast('🔍 Try searching for anything in the search bar above!', 'info');
        },
      },
      dismissAction: {
        label: 'Got it',
      },
    },
    {
      featureId: 'export-share-v1',
      featureName: 'Export & Share',
      title: '📤 Export & Share Your Notes',
      description: 'Export as PDF/Word or create shareable links for collaboration.',
      primaryAction: {
        label: 'Learn more',
        onClick: () => {
          addToast('📋 Find export and share options in each note\'s menu (⋯)', 'success');
        },
      },
      dismissAction: {
        label: 'Thanks',
      },
    },
  ];

  const [dismissedFeatures, setDismissedFeatures] = useSessionStorage<string[]>('stellar-scribe-dismissed-features', []);
  const [activeAnnouncement, setActiveAnnouncement] = useState<FeatureAnnouncementConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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

  const handleClose = () => {
    if (!activeAnnouncement) return;

    const dismissedId = activeAnnouncement.featureId;
    
    // Clear current announcement immediately to prevent flickering
    setActiveAnnouncement(null);
    
    // Add the closed announcement to the dismissed list
    const newDismissedFeatures = [...dismissedFeatures, dismissedId];
    setDismissedFeatures(newDismissedFeatures);
    
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
  };
  
  const handlePrimaryAction = () => {
    if (activeAnnouncement?.primaryAction?.onClick) {
      activeAnnouncement.primaryAction.onClick();
    }
    handleClose();
  };

  // --- Development Controls ---
  const handleForceShowLatest = () => {
    // This will show the latest feature modal even if dismissed, but only if no other modal is active
    if (!activeAnnouncement) {
      const latestConfig = ANNOUNCEMENT_QUEUE.find(a => a.featureId === 'inline-suggestions-v1');
      if(latestConfig) setActiveAnnouncement(latestConfig);
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
