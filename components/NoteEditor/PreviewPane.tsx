import React, { useEffect, useState } from "react";
import {
  FaTag,
  FaDownload,
  FaRegTrashCan,
  FaCopy,
} from "react-icons/fa6";
import { FaMagic } from "react-icons/fa";
import { MdShare } from "react-icons/md";
import { PreviewPaneProps } from "./types";
import { LoadingSpinner } from "./UIElements";
import SelectionNavigator from "../SelectionNavigator";

const PreviewPane: React.FC<PreviewPaneProps> = ({
  activeNote,
  renderedMarkdown,
  previewRef,
  selectionNavigator,
  navigateMatches,
  setSelectionNavigator,
  onPreviewSelection,
  suggestedTags,
  addSuggestedTag,
  isSuggestingTags,
  onSuggestTags,
  isSummarizing,
  onSummarize,
  onShare,
  onDownload,
  onCopyAll,
  onDelete,
}) => {
  // Compact footer when pane becomes narrow
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = previewRef?.current as HTMLElement | null;
    if (!el || !('ResizeObserver' in window)) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      setCompact(width < 500);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewRef]);
  // Force re-processing of code blocks when preview becomes visible
  useEffect(() => {
    // Immediate processing without delay
    const event = new CustomEvent('preview-mounted');
    window.dispatchEvent(event);
    
    // Also trigger after a short delay as backup
    const timer = setTimeout(() => {
      window.dispatchEvent(event);
    }, 50);

    return () => clearTimeout(timer);
  }, [renderedMarkdown]);

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-dark-bg-primary relative min-w-0">
      {selectionNavigator && (
        <SelectionNavigator
          top={selectionNavigator.top}
          left={selectionNavigator.left}
          matchCount={selectionNavigator.matches.length}
          currentIndex={selectionNavigator.currentIndex}
          onNext={() => navigateMatches("next")}
          onPrev={() => navigateMatches("prev")}
          onClose={() => setSelectionNavigator(null)}
        />
      )}
      
      <div 
        ref={previewRef} 
        className="flex-grow overflow-y-auto overflow-x-hidden p-4 sm:p-6 select-text preview-pane min-w-0"
      >
        {/* Title Section */}
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-dark-border-color">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-dark-text-primary break-words">
            {activeNote.title || "Untitled Note"}
          </h1>
          {activeNote.tags && activeNote.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeNote.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-dark-accent/20 dark:text-dark-accent-hover"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div
          id="preview-content"
          className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none w-full"
          dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
          style={{ userSelect: "text", cursor: "text" }}
          onMouseUp={onPreviewSelection}
        />
      </div>

      <div className="flex-shrink-0 p-2 sm:p-3 border-t border-gray-200 dark:border-dark-border-color">
        {suggestedTags.length > 0 && (
          <div className="mb-3">
            <div className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-dark-text-muted mb-2">
              Suggestions:
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => addSuggestedTag(tag)}
                  className="text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-dark-accent/20 dark:text-dark-accent-hover hover:bg-blue-200 dark:hover:bg-dark-accent/30 transition-colors whitespace-nowrap"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex flex-nowrap justify-start items-center gap-3 overflow-x-auto">
          <button
            onClick={onSuggestTags}
            disabled={isSuggestingTags}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-dark-bg-secondary text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-dark-border-color transition-colors disabled:opacity-50"
          >
            {isSuggestingTags ? (
              <LoadingSpinner />
            ) : (
              <FaTag className="w-4 h-4 text-blue-600 dark:text-dark-accent" />
            )}
            {!compact && <span className="text-xs font-medium">Suggest Tags</span>}
                      </button>
          
          <button
            onClick={onSummarize}
            disabled={isSummarizing}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-dark-bg-secondary text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-dark-border-color transition-colors disabled:opacity-50"
          >
            {isSummarizing ? (
              <LoadingSpinner />
            ) : (
              <FaMagic className="w-4 h-4 text-blue-600 dark:text-dark-accent" />
            )}
            {!compact && <span className="text-xs font-medium">Summarize</span>}
                      </button>
          
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-dark-bg-secondary text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-dark-border-color transition-colors"
          >
            <MdShare className="w-4 h-4 text-blue-600 dark:text-dark-accent" />
            {!compact && <span className="text-xs font-medium">Share</span>}
          </button>
          
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-dark-bg-secondary text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-dark-border-color transition-colors"
          >
            <FaDownload className="w-4 h-4 text-blue-600 dark:text-dark-accent" />
            {!compact && <span className="text-xs font-medium">Download</span>}
          </button>

          <button
            onClick={onCopyAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-dark-bg-secondary text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-dark-border-color transition-colors"
          >
            <FaCopy className="w-4 h-4 text-blue-600 dark:text-dark-accent" />
            {!compact && <span className="text-xs font-medium">Copy All</span>}
          </button>
          
          <button
            onClick={onDelete}
            className="p-2 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
          >
            <FaRegTrashCan className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

function areEqual(prev: Readonly<PreviewPaneProps>, next: Readonly<PreviewPaneProps>) {
  return prev.renderedMarkdown === next.renderedMarkdown &&
         prev.activeNote === next.activeNote &&
         prev.selectionNavigator === next.selectionNavigator &&
         prev.isSuggestingTags === next.isSuggestingTags &&
         prev.isSummarizing === next.isSummarizing &&
         prev.suggestedTags === next.suggestedTags;
}

export default React.memo(PreviewPane, areEqual);
