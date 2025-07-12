import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from './icons/ChevronIcons';

interface SelectionNavigatorProps {
  top: number;
  left: number;
  matchCount: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

const SelectionNavigator: React.FC<SelectionNavigatorProps> = ({
  top,
  left,
  matchCount,
  currentIndex,
  onNext,
  onPrev,
  onClose,
}) => {
  return (
    <div
      className="absolute z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-primary dark:bg-dark-bg-primary border border-border-color dark:border-dark-border-color shadow-lg"
      style={{ top: `${top}px`, left: `${left}px` }}
    >
      <span className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
        {currentIndex + 1} of {matchCount}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="p-1 rounded-full hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary"
        >
          <ChevronUpIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          className="p-1 rounded-full hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary"
        >
          <ChevronDownIcon className="w-4 h-4" />
        </button>
      </div>
      <button
        onClick={onClose}
        className="ml-1 p-1 rounded-full hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default SelectionNavigator;