import React, { KeyboardEvent } from "react";
import { FaMagic } from "react-icons/fa";
import { MdCloudDownload } from "react-icons/md";
import { EditorPaneProps } from "./types";
import { LoadingSpinner, Tag } from "./UIElements";
import EditorToolbar from "../EditorToolbar";
import SuggestionTextarea from "../SuggestionTextarea";
import ContextualMenu from "../ContextualMenu";
import { versionControlService } from "../../services/versionControlService";

const EditorPane: React.FC<EditorPaneProps> = ({
  activeNote,
  currentEditorContent,
  setCurrentEditorContent,
  onUpdateNote,
  editorRef,
  contextualMenu,
  onTextSelection,
  onKeyDown,
  onAiTextAction,
  isAiActionLoading,
  isGeneratingTitle,
  onGenerateTitle,
  suggestionsEnabled,
  setSuggestionsEnabled,
  onGenerateClick,
  pushToUndoStack,
  // Version control props
  onOpenVersionHistory,
  onCreateVersion,
  hasUnsavedChanges,
  versionCount,
}) => {
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNote({ title: e.target.value });
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim().toLowerCase();
      if (newTag && !activeNote?.tags.includes(newTag)) {
        onUpdateNote({ tags: [...(activeNote?.tags || []), newTag] });
      }
      e.currentTarget.value = "";
    }
  };

  const handleTagKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.currentTarget.value.includes(",")) {
      e.preventDefault();
      const newTag = e.currentTarget.value.split(",")[0].trim().toLowerCase();

      if (newTag && !activeNote?.tags.includes(newTag)) {
        onUpdateNote({ tags: [...(activeNote?.tags || []), newTag] });
      }
      e.currentTarget.value = "";
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdateNote({ tags: activeNote?.tags.filter((t) => t !== tagToRemove) });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-surface relative">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-dark-border-color">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-grow flex items-center">
            <input
              type="text"
              value={activeNote.title}
              onChange={handleTitleChange}
              placeholder="Untitled Note"
              className="flex-1 min-w-0 text-lg sm:text-xl md:text-2xl font-bold bg-transparent text-gray-900 dark:text-dark-text-primary focus:outline-none placeholder:text-gray-400"
            />
            <button
              onClick={onGenerateTitle}
              disabled={isGeneratingTitle}
              title="Generate title from content"
              className="flex-shrink-0 ml-2 p-1.5 text-gray-600 dark:text-dark-text-secondary hover:text-blue-600 dark:hover:text-dark-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 dark:hover:bg-dark-bg-secondary"
            >
              {isGeneratingTitle ? (
                <LoadingSpinner />
              ) : (
                <FaMagic className="w-5 h-5" />
              )}
            </button>
          </div>
          {/* Version indicator */}
          {(() => {
            // Use the note's version property instead of calculating from version history
            const currentVersion = activeNote.version || 0;
            return currentVersion > 0 ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-mono font-semibold border border-blue-200 dark:border-blue-700">
                  v{currentVersion}
                </span>
                {hasUnsavedChanges && (
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md font-semibold border border-orange-200 dark:border-orange-700">
                    Unsaved
                  </span>
                )}
              </div>
            ) : null;
          })()}
          {activeNote.isImported && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full border border-blue-300 dark:border-blue-800 flex-shrink-0 self-start sm:self-center">
              <MdCloudDownload
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                title="This note was imported from a shared link"
              />
              <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                Imported
                {activeNote.importedAt && (
                  <span className="ml-1 opacity-75 hidden sm:inline">
                    on {new Date(activeNote.importedAt).toLocaleDateString()}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-2 mt-4">
          {(activeNote.tags ?? []).map((tag) => (
            <Tag key={tag} tag={tag} onRemove={removeTag} />
          ))}
          <input
            type="text"
            onKeyDown={handleTagKeyDown}
            onKeyUp={handleTagKeyUp}
            placeholder="Add a tag..."
            className="bg-transparent text-sm focus:outline-none text-gray-900 dark:text-dark-text-primary placeholder-gray-400 dark:placeholder-dark-text-muted"
          />
        </div>
      </div>
      
      <EditorToolbar
        textareaRef={editorRef as React.RefObject<HTMLTextAreaElement>}
        onUpdate={(v, newCursorPos) => {
          if (activeNote && v !== activeNote.content) {
            pushToUndoStack(activeNote.content);
          }
          setCurrentEditorContent(v);
          onUpdateNote({ content: v });

          if (editorRef.current && newCursorPos !== undefined) {
            setTimeout(() => {
              editorRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
          }
        }}
        onGenerateClick={onGenerateClick}
        suggestionsEnabled={suggestionsEnabled}
        onToggleSuggestions={(enabled) => {
          setSuggestionsEnabled(enabled);
        }}
        // Version control props
        onOpenVersionHistory={onOpenVersionHistory}
        onCreateVersion={onCreateVersion}
        hasUnsavedChanges={hasUnsavedChanges}
        versionCount={versionCount}
      />
      
      <div className="flex-grow overflow-y-auto p-4 editor-textarea-wrapper">
        <SuggestionTextarea
          ref={editorRef}
          value={currentEditorContent}
          onChange={(val: string) => {
            if (val !== currentEditorContent) {
              pushToUndoStack(currentEditorContent);
            }
            setCurrentEditorContent(val);
            onUpdateNote({ content: val });
          }}
          onKeyDown={onKeyDown}
          onMouseUp={onTextSelection}
          onTouchEnd={onTextSelection}
          onContextMenu={(e: React.MouseEvent<HTMLTextAreaElement>) => {
            e.preventDefault();
          }}
          onMouseDown={(e: React.MouseEvent<HTMLTextAreaElement>) => {
            if (!(e.target as HTMLElement).closest(".contextual-menu-container")) {
              setTimeout(() => {
                if (!editorRef.current) return;
                const hasSelection =
                  editorRef.current.selectionStart !== editorRef.current.selectionEnd;
                if (!hasSelection) {
                  // Will be handled by parent component
                }
              }, 10);
            }
          }}
          onTouchStart={(e: React.TouchEvent<HTMLTextAreaElement>) => {
            if (!(e.target as HTMLElement).closest(".contextual-menu-container")) {
              setTimeout(() => {
                if (!editorRef.current) return;
                const hasSelection =
                  editorRef.current.selectionStart !== editorRef.current.selectionEnd;
                if (!hasSelection) {
                  // Will be handled by parent component
                }
              }, 10);
            }
          }}
          onFocus={() => {
            setTimeout(() => {
              if ("ontouchstart" in window) {
                // Handle mobile selection change if needed
              }
            }, 500);
          }}
          style={{
            WebkitUserSelect: "text",
            WebkitTouchCallout: "none",
            WebkitTapHighlightColor: "transparent",
            fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace !important"
          }}
          className="w-full h-full bg-transparent text-gray-800 dark:text-dark-text-secondary focus:outline-none resize-none leading-relaxed font-mono editor-textarea"
          placeholder="Start writing..."
          suggestionsEnabled={suggestionsEnabled}
          noteTitle={activeNote.title}
        />
      </div>
      
      <footer className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-dark-border-color text-xs text-gray-500 dark:text-dark-text-muted flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>
            {activeNote.content.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
        <span>
          Last updated: {new Date(activeNote.updatedAt).toLocaleString()}
        </span>
      </footer>
      
      {contextualMenu && (
        <ContextualMenu
          top={contextualMenu.top}
          left={contextualMenu.left}
          onAction={onAiTextAction}
          isLoading={isAiActionLoading}
          selectedText={editorRef.current?.value.substring(
            editorRef.current?.selectionStart || 0,
            editorRef.current?.selectionEnd || 0
          )}
        />
      )}
    </div>
  );
};

export default EditorPane;
