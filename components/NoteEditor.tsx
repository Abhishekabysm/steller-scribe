import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Note, AITextAction, NoteVersion } from "../types";
import {
  summarizeText,
  suggestTagsForText,
  generateNoteContent,
  performTextAction,
  generateTitle,
} from "../services/geminiService";
import { getWordMeaning } from "../services/dictionaryService";
import { useToasts } from "../hooks/useToasts";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useVersionControl } from "../hooks/useVersionControl";
import { versionControlService } from "../services/versionControlService";

import {
  FaPencil,
  FaEye,
  FaPenNib,
} from "react-icons/fa6";
import ConfirmationModal from "./ConfirmationModal";
import AIGenerateModal from "./AIGenerateModal";
import SplitPane from "./SplitPane";
import DownloadModal from "./DownloadModal";
import SummaryModal from "./SummaryModal";
import ShareModal from "./ShareModal";
import AIModifyModal from "./AIModifyModal";
import VersionHistoryModal from "./VersionHistory/VersionHistoryModal";

// Import refactored components and hooks
import { NoteEditorProps } from "./NoteEditor/types";
import {
  useUndoRedo,
  useModalStates,
  useContextualMenu,
  useSelectionNavigator,
  useMarkdownProcessing,
} from "./NoteEditor/hooks";
import { initializeMarkdownProcessing, setupScrollSync } from "./NoteEditor/utils";
import EditorPane from "./NoteEditor/EditorPane";
import PreviewPane from "./NoteEditor/PreviewPane";

const NoteEditor: React.FC<NoteEditorProps> = ({
  activeNote,
  onUpdateNote,
  onDeleteNote,
  onAddNote,
  viewMode = "split",
  onRestoreVersion,
}) => {
  // Basic state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isAiActionLoading, setIsAiActionLoading] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [textToModify, setTextToModify] = useState("");
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false);
  const [currentEditorContent, setCurrentEditorContent] = useState(
    activeNote?.content || ""
  );
  const [mobileView, setMobileView] = useState<"editor" | "preview">("preview");
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { addToast } = useToasts();
  
  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null!);
  const previewRef = useRef<HTMLDivElement>(null!);
  const editorContainerRef = useRef<HTMLDivElement>(null!);

  // Custom hooks
  const modalStates = useModalStates();
  const { contextualMenu, setContextualMenu, handleTextSelection } = useContextualMenu();
  const { selectionNavigator, setSelectionNavigator, handlePreviewSelection, navigateMatches } = useSelectionNavigator();
  const { renderedMarkdown, mermaidDiagrams } = useMarkdownProcessing(activeNote?.content || "", addToast);
  
  const {
    undoStack,
    redoStack,
    pushToUndoStack,
    undo,
    redo,
    clearStacks,
  } = useUndoRedo(
    activeNote,
    currentEditorContent,
    setCurrentEditorContent,
    onUpdateNote,
    editorRef
  );

  // Version control hook
  const {
    hasUnsavedChanges,
    lastSavedVersion,
    versionCount,
    createManualVersion,
    restoreVersion,
    deleteVersion,
    getVersions,
    enableAutoSave,
    disableAutoSave,
    isAutoSaveEnabled,
  } = useVersionControl({
    note: activeNote || null,
    onUpdateNote,
  });

  // Initialize markdown processing
  useEffect(() => {
    initializeMarkdownProcessing();
  }, []);

  // Version control handlers
  const handleOpenVersionHistory = useCallback(() => {
    setIsVersionHistoryOpen(true);
  }, []);

  const handleCreateVersion = useCallback(async () => {
    if (activeNote) {
      await createManualVersion();
    }
  }, [activeNote, createManualVersion]);

  const handleRestoreVersion = useCallback((version: NoteVersion) => {
    console.log('Restoring to version:', version.version, 'Current note version:', activeNote?.version);
    
    // Temporarily disable auto-save to prevent new version creation during restore
    if (activeNote) {
      versionControlService.clearAutoSaveTimer(activeNote.id);
    }
    
    // First, update the local editor content to immediately reflect the change
    setCurrentEditorContent(version.content);
    
    // Also force a re-render by updating the editor ref if available
    if (editorRef.current) {
      editorRef.current.value = version.content;
    }
    
    // Update the note immediately in the parent to ensure sync
    if (onRestoreVersion && activeNote) {
      const restoredNote = {
        ...activeNote,
        title: version.title,
        content: version.content,
        version: version.version, // Update the version number to the restored version
        updatedAt: Date.now(),
      };
      console.log('Restored note:', restoredNote);
      onRestoreVersion(restoredNote);
    }
    
    // Force a re-render after a short delay to ensure sync
    setTimeout(() => {
      setCurrentEditorContent(version.content);
    }, 0);
    
    addToast(`Restored to version ${version.version}`, 'success');
  }, [onRestoreVersion, activeNote, setCurrentEditorContent, addToast, editorRef]);

  // Update editor content when active note changes
  useEffect(() => {
    console.log('🔍 NoteEditor: activeNote changed:', { 
      id: activeNote?.id, 
      title: activeNote?.title, 
      content: (activeNote?.content || '').substring(0, 50) + '...',
      hasContent: !!activeNote?.content 
    });
    if (activeNote) {
      setCurrentEditorContent(activeNote.content || '');
      clearStacks();
      
      // Force focus to editor when new note is created
      setTimeout(() => {
        const editor = editorRef.current;
        if (editor) {
          console.log('🔍 NoteEditor: Focusing editor for new note');
          editor.focus();
          editor.setSelectionRange(editor.value.length, editor.value.length);
        }
      }, 200);
    }
  }, [activeNote?.id, clearStacks]);

  // Additional effect to ensure editor content stays in sync with note content
  useEffect(() => {
    if (activeNote && currentEditorContent !== (activeNote.content || '')) {
      setCurrentEditorContent(activeNote.content || '');
    }
  }, [activeNote?.content, currentEditorContent]);

  // Force sync editor content when note is restored
  useEffect(() => {
    if (activeNote && activeNote.lastVersionedAt) {
      // If the note was recently versioned (restored), ensure editor content is in sync
      if (currentEditorContent !== (activeNote.content || '')) {
        setCurrentEditorContent(activeNote.content || '');
      }
    }
  }, [activeNote?.lastVersionedAt, activeNote?.content, currentEditorContent]);

  // Reset suggestions when activeNote changes
  useEffect(() => {
    setSuggestedTags([]);
    setIsSuggestingTags(false);
  }, [activeNote?.id]);

  // Setup scroll sync
  useEffect(() => {
    const cleanup = setupScrollSync({
      editorRef,
      previewRef,
      viewMode,
      activeNoteId: activeNote?.id,
      currentEditorContent,
      renderedMarkdown,
    });

    return cleanup || undefined;
  }, [viewMode, activeNote?.id, currentEditorContent, renderedMarkdown]);

  // Handle selection change for mobile
  const handleSelectionChange = useCallback(() => {
    if (!(("ontouchstart" in window)) || isDesktop) return;

    const textarea = editorRef.current;
    if (!textarea) return;

    if (document.body.classList.contains("contextual-menu-active")) return;

    setTimeout(() => {
      try {
        const selectedText = textarea.value.substring(
          textarea.selectionStart,
          textarea.selectionEnd
        );

        if (selectedText.length > 0 && document.activeElement === textarea) {
          const currentSelection = textarea.value.substring(
            textarea.selectionStart,
            textarea.selectionEnd
          );
          if (
            currentSelection === selectedText &&
            currentSelection.length > 0
          ) {
            const containerRect = editorContainerRef.current?.getBoundingClientRect();
            if (containerRect && editorContainerRef.current) {
              const rect = textarea.getBoundingClientRect();
              const left = rect.left + rect.width / 2 - containerRect.left;
              let top = rect.top - containerRect.top - 70;

              if (top < 20) {
                top = rect.top - containerRect.top + 30;
              }

              setContextualMenu({
                top: Math.max(10, top),
                left: Math.max(10, Math.min(left, containerRect.width - 320)),
              });
              document.body.classList.add("contextual-menu-active");
            }
          }
        }
      } catch (error) {
        // Ignore errors in selection change
      }
    }, 300);
  }, [isDesktop, setContextualMenu]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.body.classList.remove("contextual-menu-active");
    };
  }, [handleSelectionChange]);

  // Handler functions
  const handleSummarize = useCallback(async () => {
    if (!activeNote) return;
    setIsSummarizing(true);
    modalStates.setIsSummaryModalOpen(true);
    setSummaryContent("");

    try {
      const summary = await summarizeText(activeNote.content || '');
      setSummaryContent(summary);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to get summary.",
        "error"
      );
      modalStates.setIsSummaryModalOpen(false);
    } finally {
      setIsSummarizing(false);
    }
  }, [activeNote, addToast, modalStates]);

  const handleAddSummaryToNote = useCallback(() => {
    if (!activeNote || !summaryContent) return;
    const summarySection = `\n\n---\n\n**AI Summary:**\n*${summaryContent}*`;
    onUpdateNote({ content: (activeNote.content || '') + summarySection });
    addToast("Summary added to note!", "success");
  }, [activeNote, summaryContent, onUpdateNote, addToast]);

  const handleCopyAll = useCallback(() => {
    if (!activeNote) return;
    navigator.clipboard.writeText(activeNote.content || '').then(() => {
      addToast("Copied note content to clipboard!", "success");
    }).catch(() => {
      addToast("Failed to copy content.", "error");
    });
  }, [activeNote, addToast]);

  const handleSuggestTags = useCallback(async () => {
    if (!activeNote) return;
    setIsSuggestingTags(true);
    try {
      const tags = await suggestTagsForText(activeNote.content || '');
      setSuggestedTags(tags.filter((t) => !activeNote.tags.includes(t)));
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to suggest tags.",
        "error"
      );
    } finally {
      setIsSuggestingTags(false);
    }
  }, [activeNote, addToast]);

  const addSuggestedTag = useCallback((tagToAdd: string) => {
    if (tagToAdd && !activeNote?.tags.includes(tagToAdd)) {
      onUpdateNote({ tags: [...(activeNote?.tags || []), tagToAdd] });
      setSuggestedTags((prev) => prev.filter((t) => t !== tagToAdd));
    }
  }, [activeNote?.tags, onUpdateNote]);

  const handleGenerateNote = async ({
    topic,
    language,
  }: {
    topic: string;
    language: string;
  }) => {
    setIsGeneratingNote(true);
    try {
      const content = await generateNoteContent(topic, language);
      const newNote: Note = {
        id: Date.now().toString(),
        title: topic,
        content: content,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
        isImported: false,
      };
      onAddNote(newNote);
      addToast("Note generated successfully!", "success");
      modalStates.setIsAIGenerateModalOpen(false);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to generate note.",
        "error"
      );
    } finally {
      setIsGeneratingNote(false);
    }
  };

  const handleGenerateTitle = useCallback(async () => {
    if (!activeNote) return;
    if ((activeNote.content || '').trim().length < 20) {
      addToast("Please write more content before generating a title.", "info");
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const newTitle = await generateTitle(activeNote.content || '');
      onUpdateNote({ title: newTitle });
      addToast("Title auto-generated!", "success");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to generate title.",
        "error"
      );
    } finally {
      setIsGeneratingTitle(false);
    }
  }, [activeNote, onUpdateNote, addToast]);

  const handleAiTextAction = async (
    action: AITextAction,
    language?: string
  ) => {
    const textarea = editorRef.current;
    if (!textarea || !activeNote) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) return;

    setIsAiActionLoading(true);

    try {
      if (action === "dictionary") {
        const meaning = await getWordMeaning(selectedText, language || "en");
        addToast(`"${selectedText}" → ${meaning}`, "info");
      } else if (action === "modify-expand") {
        setTextToModify(selectedText);
        modalStates.setIsAIModifyModalOpen(true);
      } else {
        const modifiedText = await performTextAction(
          selectedText,
          action,
          language
        );

        pushToUndoStack(textarea.value);

        textarea.focus();
        textarea.setSelectionRange(start, end);
        document.execCommand("insertText", false, modifiedText);

        setCurrentEditorContent(textarea.value);
        onUpdateNote({ content: textarea.value });

        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start, start + modifiedText.length);
        }, 0);
      }
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : `AI action failed.`,
        "error"
      );
    } finally {
      setIsAiActionLoading(false);
      setContextualMenu(null);
    }
  };

  // Listen for AI text action events from keyboard shortcuts
  useEffect(() => {
    const handleAiTextActionEvent = (event: CustomEvent) => {
      const { action } = event.detail;
      if (action && typeof action === 'string') {
        handleAiTextAction(action as AITextAction);
      }
    };

    document.addEventListener('aiTextAction', handleAiTextActionEvent as EventListener);
    
    return () => {
      document.removeEventListener('aiTextAction', handleAiTextActionEvent as EventListener);
    };
  }, [handleAiTextAction]);

  const handleModifyTextWithAI = async (
    selectedText: string,
    instructions: string
  ) => {
    setIsAiActionLoading(true);
    try {
      const modifiedText = await performTextAction(
        selectedText,
        "modify-expand",
        instructions
      );
      const textarea = editorRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        pushToUndoStack(textarea.value);
        
        textarea.focus();
        textarea.setSelectionRange(start, end);
        document.execCommand("insertText", false, modifiedText);

        setCurrentEditorContent(textarea.value);
        onUpdateNote({ content: textarea.value });

        const editorWrapper = document.querySelector(".editor-textarea-wrapper");
        if (editorWrapper) {
          editorWrapper.classList.add("flash-glow");
          setTimeout(() => editorWrapper.classList.remove("flash-glow"), 600);
        }

        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start, start + modifiedText.length);
        }, 0);
      }
      modalStates.setIsAIModifyModalOpen(false);
      addToast("Text modified successfully!", "success");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : `AI modification failed.`,
        "error"
      );
    } finally {
      setIsAiActionLoading(false);
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!activeNote || !editorRef.current) return;

    const textarea = editorRef.current;

    // Handle Undo/Redo
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undoStack.length > 0) {
          undo();
        }
        return;
      } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
        e.preventDefault();
        if (redoStack.length > 0) {
          redo();
        }
        return;
      }
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText || start === end) return;

    let wrappedText = "";
    let shouldWrap = false;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          wrappedText = `**${selectedText}**`;
          shouldWrap = true;
          e.preventDefault();
          break;
        case "i":
          wrappedText = `_${selectedText}_`;
          shouldWrap = true;
          e.preventDefault();
          break;
        case "u":
          wrappedText = `<u>${selectedText}</u>`;
          shouldWrap = true;
          e.preventDefault();
          break;
        case "k":
          wrappedText = `[${selectedText}](url)`;
          shouldWrap = true;
          e.preventDefault();
          break;
        case "l":
          wrappedText = `1. ${selectedText.replace(/\n/g, "\n1. ")}`;
          shouldWrap = true;
          e.preventDefault();
          break;
        case "m":
          wrappedText = `- [ ] ${selectedText.replace(/\n/g, "\n- [ ] ")}`;
          shouldWrap = true;
          e.preventDefault();
          break;
      }
    } else {
      switch (e.key) {
        case '"':
          wrappedText = `"${selectedText}"`;
          shouldWrap = true;
          break;
        case "'":
          wrappedText = `'${selectedText}'`;
          shouldWrap = true;
          break;
        case "`":
          wrappedText = `\`${selectedText}\``;
          shouldWrap = true;
          break;
        case "(":
          wrappedText = `(${selectedText})`;
          shouldWrap = true;
          break;
        case "[":
          wrappedText = `[${selectedText}]`;
          shouldWrap = true;
          break;
        case "{":
          wrappedText = `{${selectedText}}`;
          shouldWrap = true;
          break;
      }
    }

    if (shouldWrap) {
      e.preventDefault();
      pushToUndoStack(textarea.value);
      textarea.focus();
      textarea.setSelectionRange(start, end);
      document.execCommand("insertText", false, wrappedText);
      setCurrentEditorContent(textarea.value);
      onUpdateNote({ content: textarea.value });

      setTimeout(() => {
        textarea.setSelectionRange(
          start + wrappedText.length,
          start + wrappedText.length
        );
      }, 0);
    }
  }, [activeNote, undoStack, redoStack, undo, redo, pushToUndoStack, onUpdateNote]);

  const handleWrappedTextSelection = useCallback((
    e: React.MouseEvent<HTMLTextAreaElement> | React.TouchEvent<HTMLTextAreaElement>
  ) => {
    handleTextSelection(e, editorRef, editorContainerRef, isDesktop);
  }, [handleTextSelection, isDesktop]);

  const handleWrappedPreviewSelection = useCallback((
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (activeNote) {
      handlePreviewSelection(e, activeNote, editorRef);
    }
  }, [handlePreviewSelection, activeNote]);

  if (!activeNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-dark-text-muted bg-gray-50 dark:bg-dark-bg-primary">
        <FaPenNib className="w-24 h-24 mb-4 text-blue-400/50 dark:text-dark-accent/50 opacity-50" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">
          Select a note to get started
        </h2>
        <p className="mt-2 text-lg">
          Or create a new one to capture your ideas!
        </p>
      </div>
    );
  }

  const editorPane = (
    <div ref={editorContainerRef} className="h-full">
      <EditorPane
        activeNote={activeNote}
        currentEditorContent={currentEditorContent}
        setCurrentEditorContent={setCurrentEditorContent}
        onUpdateNote={onUpdateNote}
        editorRef={editorRef}
        contextualMenu={contextualMenu}
        onTextSelection={handleWrappedTextSelection}
        onKeyDown={handleKeyDown}
        onAiTextAction={handleAiTextAction}
        isAiActionLoading={isAiActionLoading}
        isGeneratingTitle={isGeneratingTitle}
        onGenerateTitle={handleGenerateTitle}
        suggestionsEnabled={suggestionsEnabled}
        setSuggestionsEnabled={(enabled) => {
          setSuggestionsEnabled(enabled);
          addToast(
            enabled
              ? "Auto suggestions enabled! Start typing to see AI suggestions."
              : "Auto suggestions disabled.",
            enabled ? "success" : "info"
          );
        }}
        onGenerateClick={() => modalStates.setIsAIGenerateModalOpen(true)}
        pushToUndoStack={pushToUndoStack}
        // Version control props
        onOpenVersionHistory={handleOpenVersionHistory}
        onCreateVersion={handleCreateVersion}
        hasUnsavedChanges={hasUnsavedChanges}
        versionCount={versionCount}
      />
    </div>
  );

  const previewPane = (
    <PreviewPane
      activeNote={activeNote}
      renderedMarkdown={renderedMarkdown}
      mermaidDiagrams={mermaidDiagrams}
      previewRef={previewRef}
      selectionNavigator={selectionNavigator}
      navigateMatches={navigateMatches}
      setSelectionNavigator={setSelectionNavigator}
      onPreviewSelection={handleWrappedPreviewSelection}
      suggestedTags={suggestedTags}
      addSuggestedTag={addSuggestedTag}
      isSuggestingTags={isSuggestingTags}
      onSuggestTags={handleSuggestTags}
      isSummarizing={isSummarizing}
      onSummarize={handleSummarize}
      onShare={() => modalStates.setIsShareModalOpen(true)}
      onDownload={() => modalStates.setIsDownloadModalOpen(true)}
      onCopyAll={handleCopyAll}
      onDelete={() => modalStates.setIsDeleteModalOpen(true)}
    />
  );

  return (
    <>
      <div className="w-full h-full bg-bg-primary dark:bg-dark-bg-primary">
        {isDesktop ? (
          // Desktop view modes
          viewMode === "split" ? (
            <SplitPane left={editorPane} right={previewPane} />
          ) : viewMode === "editor" ? (
            editorPane
          ) : (
            previewPane
          )
        ) : (
          // Mobile view with toggle
          <div className="h-full flex flex-col">
            <div className="relative flex-shrink-0 flex bg-gray-200 dark:bg-dark-bg-secondary border-b border-gray-300 dark:border-dark-border-color rounded-md mx-2 my-2 overflow-hidden">
              <div
                className={`absolute inset-0 w-1/2 rounded-md bg-blue-600 dark:bg-dark-accent/90 transition-all duration-300 ease-in-out ${
                  mobileView === "editor" ? "left-0" : "left-1/2"
                }`}
              ></div>
              <button
                onClick={() => setMobileView("editor")}
                className={`relative flex-1 p-2 rounded-md text-sm font-semibold z-10 transition-colors duration-300 ease-in-out ${
                  mobileView === "editor"
                    ? "text-white dark:text-dark-text-primary"
                    : "text-gray-700 dark:text-dark-text-muted"
                }`}
              >
                <FaPencil className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setMobileView("preview")}
                className={`relative flex-1 p-2 rounded-md text-sm font-semibold z-10 transition-colors duration-300 ease-in-out ${
                  mobileView === "preview"
                    ? "text-white dark:text-dark-text-primary"
                    : "text-gray-700 dark:text-dark-text-muted"
                }`}
              >
                <FaEye className="w-5 h-5 mx-auto" />
              </button>
            </div>
            <div className="flex-grow overflow-hidden">
              {mobileView === "editor" ? editorPane : previewPane}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={modalStates.isDeleteModalOpen}
        onClose={() => modalStates.setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDeleteNote(activeNote.id);
          modalStates.setIsDeleteModalOpen(false);
        }}
        title="Delete Note"
        message={
          <>
            Are you sure you want to delete "<strong>{activeNote.title}</strong>"? This action cannot be undone.
          </>
        }
        confirmText="Delete"
        confirmVariant="danger"
      />

      <AIGenerateModal
        isOpen={modalStates.isAIGenerateModalOpen}
        isGenerating={isGeneratingNote}
        onClose={() => modalStates.setIsAIGenerateModalOpen(false)}
        onGenerate={handleGenerateNote}
      />

      <AIModifyModal
        isOpen={modalStates.isAIModifyModalOpen}
        onClose={() => modalStates.setIsAIModifyModalOpen(false)}
        onModify={handleModifyTextWithAI}
        isLoading={isAiActionLoading}
        selectedText={textToModify}
      />

      <DownloadModal
        isOpen={modalStates.isDownloadModalOpen}
        onClose={() => modalStates.setIsDownloadModalOpen(false)}
        note={activeNote}
      />

      <SummaryModal
        isOpen={modalStates.isSummaryModalOpen}
        onClose={() => modalStates.setIsSummaryModalOpen(false)}
        summary={summaryContent}
        isLoading={isSummarizing}
        onAddToNote={handleAddSummaryToNote}
        noteTitle={activeNote?.title || ""}
      />

      <ShareModal
        isOpen={modalStates.isShareModalOpen}
        onClose={() => modalStates.setIsShareModalOpen(false)}
        note={activeNote}
        onToast={addToast}
      />

      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        note={activeNote || null}
        onRestoreVersion={handleRestoreVersion}
      />
    </>
  );
};

export default NoteEditor;
