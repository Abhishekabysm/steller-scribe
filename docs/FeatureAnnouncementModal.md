# Feature Announcement Modal System

A reusable feature announcement modal component system for Stellar Scribe that shows feature announcements once per user session with full accessibility support.

## Components Overview

### 🎯 Core Components
- `FeatureAnnouncementModal` - The modal component itself
- `useFeatureAnnouncement` - Hook for managing announcement state and session dismissal
- `useSessionStorage` - Utility hook for session-based storage

## Quick Start

### 1. Basic Usage

```tsx
import React from 'react';
import FeatureAnnouncementModal from './components/FeatureAnnouncementModal';
import { useFeatureAnnouncement } from './hooks/useFeatureAnnouncement';
import { FaWandMagicSparkles } from 'react-icons/fa6';

function MyComponent() {
  const announcement = useFeatureAnnouncement({
    featureId: 'ai-feature-v1',
    featureName: 'AI Assistant',
    description: 'Get intelligent help with your notes using our new AI assistant.',
    visual: {
      type: 'icon',
      iconComponent: FaWandMagicSparkles,
    },
    primaryAction: {
      label: 'Try it now',
      onClick: () => {
        // Navigate to feature or trigger action
        console.log('Primary action clicked');
      },
    },
    showAfterDelay: 2000, // Show after 2 seconds
  });

  return (
    <div>
      <FeatureAnnouncementModal {...announcement.modalProps} />
      {/* Your other components */}
    </div>
  );
}
```

### 2. Multiple Announcements

```tsx
function App() {
  // First announcement - AI Feature
  const aiAnnouncement = useFeatureAnnouncement({
    featureId: 'ai-summary-v2',
    featureName: 'AI Summary',
    title: 'Enhanced AI Summary',
    description: 'Get better summaries with our improved AI model.',
    showAfterDelay: 1000,
  });

  // Second announcement - Export Feature
  const exportAnnouncement = useFeatureAnnouncement({
    featureId: 'export-v1',
    featureName: 'Export Options',
    description: 'Export your notes to PDF, DOCX, or share with others.',
    showAfterDelay: 5000, // Shows after first is dismissed
  });

  return (
    <>
      <FeatureAnnouncementModal {...aiAnnouncement.modalProps} />
      <FeatureAnnouncementModal {...exportAnnouncement.modalProps} />
    </>
  );
}
```

## Configuration Options

### `useFeatureAnnouncement` Hook

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `featureId` | `string` | ✅ | - | Unique identifier for the feature (used for session dismissal) |
| `featureName` | `string` | ✅ | - | Name of the feature being announced |
| `title` | `string` | ❌ | `"Introducing {featureName}"` | Modal title |
| `description` | `string` | ✅ | - | Feature description/benefits |
| `visual` | `VisualConfig` | ❌ | Star icon | Visual element (icon, image, or GIF) |
| `primaryAction` | `ActionConfig` | ❌ | `{ label: 'Try it now' }` | Primary button configuration |
| `dismissAction` | `ActionConfig` | ❌ | `{ label: 'Later' }` | Dismiss button configuration |
| `showAfterDelay` | `number` | ❌ | `0` | Delay in milliseconds before showing |
| `enabled` | `boolean` | ❌ | `true` | Whether announcement is enabled |

### Visual Configuration

```tsx
interface VisualConfig {
  type: 'icon' | 'image' | 'gif';
  src?: string;              // For image/gif types
  iconComponent?: React.ComponentType<{ className?: string }>; // For icon type
  alt?: string;              // Alt text for images
}
```

### Action Configuration

```tsx
interface ActionConfig {
  label: string;
  onClick?: () => void;
}
```

## Visual Examples

### 1. Icon Visual
```tsx
visual: {
  type: 'icon',
  iconComponent: FaWandMagicSparkles,
}
```

### 2. Image Visual
```tsx
visual: {
  type: 'image',
  src: '/feature-preview.png',
  alt: 'Feature preview screenshot',
}
```

### 3. GIF Visual
```tsx
visual: {
  type: 'gif',
  src: '/feature-demo.gif',
  alt: 'Feature demonstration',
}
```

## Advanced Usage

### Custom Actions

```tsx
const announcement = useFeatureAnnouncement({
  featureId: 'advanced-feature',
  featureName: 'Advanced Feature',
  description: 'A powerful new feature for power users.',
  primaryAction: {
    label: 'Get started',
    onClick: () => {
      // Custom logic
      navigate('/advanced-feature');
      trackEvent('feature_announcement_clicked', { feature: 'advanced-feature' });
    },
  },
  dismissAction: {
    label: 'Not interested',
    onClick: () => {
      // Custom dismiss logic
      trackEvent('feature_announcement_dismissed', { feature: 'advanced-feature' });
    },
  },
});
```

### Development Controls

The hook provides utility functions for development and testing:

```tsx
const announcement = useFeatureAnnouncement(config);

// Force show the announcement (bypasses session dismissal)
announcement.forceShow();

// Reset dismissal for this specific feature
announcement.resetDismissal();

// Clear all dismissed features in this session
announcement.clearAllDismissals();

// Check dismissal state
console.log(announcement.isDismissed); // boolean
console.log(announcement.hasShown);    // boolean
```

## Accessibility Features

The modal includes comprehensive accessibility support:

- **Focus Management**: Automatically focuses the primary action button
- **Focus Trapping**: Traps focus between interactive elements
- **Keyboard Navigation**: 
  - `Escape` key closes the modal
  - `Tab` and `Shift+Tab` navigate between buttons
  - `Enter` activates the focused button
- **ARIA Labels**: Proper ARIA roles and labels for screen readers
- **Backdrop Dismissal**: Click outside to close

## Session Management

- Announcements are tracked per browser session using `sessionStorage`
- Each feature is uniquely identified by `featureId`
- Once dismissed, the announcement won't show again in the same session
- Sessions reset when the browser tab/window is closed

## Styling & Theming

The modal uses Stellar Scribe's existing design system:

- Supports light and dark modes automatically
- Responsive design (mobile & desktop)
- Consistent with existing modal patterns
- Tailwind CSS classes with design tokens

### Custom Styling

```tsx
<FeatureAnnouncementModal 
  {...announcement.modalProps}
  className="custom-modal-class"
/>
```

## Best Practices

### 1. Timing
- Use `showAfterDelay` to prevent overwhelming users
- Stagger multiple announcements (e.g., 2s, 5s, 8s delays)
- Don't show immediately on app load

### 2. Content
- Keep descriptions concise and benefit-focused
- Use action-oriented button labels ("Try it now", "Get started")
- Highlight the value to the user

### 3. Visuals
- Use icons for simple features
- Use screenshots/GIFs for complex UI changes
- Ensure alt text for accessibility

### 4. Feature IDs
- Use semantic, versioned IDs: `ai-summary-v2`, `export-feature-v1`
- Include version numbers to re-show for major updates
- Use consistent naming convention

## Integration with Stellar Scribe

To integrate into the main app, add to your root component:

```tsx
// App.tsx
import FeatureAnnouncementExample from './components/FeatureAnnouncementExample';

function App() {
  return (
    <ToastProvider>
      <div className="app">
        {/* Your existing app content */}
        
        {/* Feature announcements */}
        <FeatureAnnouncementExample />
      </div>
    </ToastProvider>
  );
}
```

## Browser Support

- Modern browsers with `sessionStorage` support
- Graceful degradation if `sessionStorage` is unavailable
- Mobile-responsive design

## TypeScript Support

Full TypeScript support with proper type definitions for all props and hooks.
