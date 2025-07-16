import React from 'react';
import { FaChevronUp, FaChevronDown, FaXmark } from 'react-icons/fa6';

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
          <FaChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          className="p-1 rounded-full hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary"
        >
          <FaChevronDown className="w-4 h-4" />
        </button>
      </div>
      <button
        onClick={onClose}
        className="ml-1 p-1 rounded-full hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary"
      >
        <FaXmark className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SelectionNavigator;