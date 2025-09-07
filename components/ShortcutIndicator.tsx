import React from 'react';
import { FaKeyboard } from 'react-icons/fa';

interface ShortcutIndicatorProps {
  shortcut: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

const ShortcutIndicator: React.FC<ShortcutIndicatorProps> = ({
  shortcut,
  description,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const variantClasses = {
    default: 'bg-gray-100 dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-secondary border-gray-300 dark:border-dark-border-color',
    primary: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
    secondary: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700',
    accent: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {description && (
        <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
          {description}
        </span>
      )}
      <kbd className={`
        font-mono font-semibold rounded border
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        shadow-sm
      `}>
        {shortcut}
      </kbd>
    </div>
  );
};

export default ShortcutIndicator;
