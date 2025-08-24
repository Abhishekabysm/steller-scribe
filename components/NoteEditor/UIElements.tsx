import React from "react";
import { FaXmark } from "react-icons/fa6";
import { LoadingSpinnerProps, TagProps } from "./types";

/**
 * Loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = () => (
  <div className="w-5 h-5 border-2 border-text-muted/50 border-t-accent dark:border-dark-text-muted/50 dark:border-t-dark-accent rounded-full animate-spin"></div>
);

/**
 * Tag component with remove functionality
 */
export const Tag: React.FC<TagProps> = ({ tag, onRemove }) => (
  <div className="flex items-center bg-accent/20 text-accent dark:bg-dark-accent/20 dark:text-dark-accent-hover text-xs sm:text-sm font-medium px-2 py-1 sm:pl-3 sm:pr-2 rounded-full animate-fade-in">
    <span>{tag}</span>
    <button
      onClick={() => onRemove(tag)}
      className="ml-1.5 p-0.5 rounded-full hover:bg-accent/30 dark:hover:bg-dark-accent/30"
    >
      <FaXmark className="w-3 h-3" />
    </button>
  </div>
);
