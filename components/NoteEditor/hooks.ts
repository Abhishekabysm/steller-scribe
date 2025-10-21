import { useState, useCallback, useEffect, useRef } from "react";
import { Note, AITextAction } from "../../types";
import {
  UseUndoRedoReturn,
  UseModalStatesReturn,
  UseContextualMenuReturn,
  UseSelectionNavigatorReturn,
  UseMarkdownProcessingReturn,
  UndoRedoState,
  ContextualMenuState,
  SelectionNavigatorState,
} from "./types";
import {
  parseMarkdown,
  parseMarkdownWithDiagrams,
  calculateMenuPosition,
  createSearchPattern,
  normalizeSelectedText,
  processLinks,
  createCopyButton,
  addPerLineClickFunctionality,
} from "./utils";

declare const hljs: any;
declare const mermaid: any;

const MAX_HISTORY_LENGTH = 100;

/**
 * Hook for undo/redo functionality
 */
export const useUndoRedo = (
  activeNote: Note | undefined,
  currentEditorContent: string,
  setCurrentEditorContent: (content: string) => void,
  onUpdateNote: (note: Partial<Note>) => void,
  editorRef: React.RefObject<HTMLTextAreaElement>
): UseUndoRedoReturn => {
  const [undoStack, setUndoStack] = useState<UndoRedoState[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoState[]>([]);
  const lastCursorPosRef = useRef(0);

  // Effect to track cursor position reliably
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const updateCursorPos = () => {
      lastCursorPosRef.current = editor.selectionStart;
    };

    editor.addEventListener('keyup', updateCursorPos);
    editor.addEventListener('mousedown', updateCursorPos);

    return () => {
      editor.removeEventListener('keyup', updateCursorPos);
      editor.removeEventListener('mousedown', updateCursorPos);
    };
  }, [activeNote]);

  const pushToUndoStack = useCallback((oldContent: string) => {
    setUndoStack((prev) => {
      const newStack = [...prev, { content: oldContent, cursorPos: lastCursorPosRef.current }];
      if (newStack.length > MAX_HISTORY_LENGTH) {
        return newStack.slice(newStack.length - MAX_HISTORY_LENGTH);
      }
      return newStack;
    });
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    const currentCursorPos = editorRef.current?.selectionStart || 0;
    
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, { content: currentEditorContent, cursorPos: currentCursorPos }]);

    setCurrentEditorContent(previousState.content);
    onUpdateNote({ content: previousState.content });

    setTimeout(() => {
      const textarea = editorRef.current;
      if (textarea) {
        textarea.focus();
        const pos = Math.min(previousState.cursorPos, previousState.content.length);
        textarea.setSelectionRange(pos, pos);
      }
    }, 0);
  }, [undoStack, redoStack, currentEditorContent, onUpdateNote, editorRef, setCurrentEditorContent]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const currentCursorPos = editorRef.current?.selectionStart || 0;
    
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, { content: currentEditorContent, cursorPos: currentCursorPos }]);

    setCurrentEditorContent(nextState.content);
    onUpdateNote({ content: nextState.content });

    setTimeout(() => {
      const textarea = editorRef.current;
      if (textarea) {
        textarea.focus();
        const pos = Math.min(nextState.cursorPos, nextState.content.length);
        textarea.setSelectionRange(pos, pos);
      }
    }, 0);
  }, [undoStack, redoStack, currentEditorContent, onUpdateNote, editorRef, setCurrentEditorContent]);

  const clearStacks = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    undoStack,
    redoStack,
    pushToUndoStack,
    undo,
    redo,
    clearStacks,
  };
};

/**
 * Hook for managing modal states
 */
export const useModalStates = (): UseModalStatesReturn => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAIModifyModalOpen, setIsAIModifyModalOpen] = useState(false);

  return {
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isAIGenerateModalOpen,
    setIsAIGenerateModalOpen,
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    isSummaryModalOpen,
    setIsSummaryModalOpen,
    isShareModalOpen,
    setIsShareModalOpen,
    isAIModifyModalOpen,
    setIsAIModifyModalOpen,
  };
};

/**
 * Hook for contextual menu functionality
 */
export const useContextualMenu = (): UseContextualMenuReturn => {
  const [contextualMenu, setContextualMenu] = useState<ContextualMenuState | null>(null);

  const handleTextSelection = useCallback((
    e: React.MouseEvent<HTMLTextAreaElement> | React.TouchEvent<HTMLTextAreaElement>,
    editorRef: React.RefObject<HTMLTextAreaElement>,
    editorContainerRef: React.RefObject<HTMLDivElement>,
    isDesktop: boolean
  ) => {
    const textarea = e.currentTarget;
    const isTouch = "touches" in e || "changedTouches" in e;
    const timeout = isTouch ? 350 : 200;

    setTimeout(() => {
      try {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        if (
          selectedText.length > 0 &&
          start !== end &&
          document.activeElement === textarea
        ) {
          const containerRect = editorContainerRef.current?.getBoundingClientRect();
          if (containerRect && editorContainerRef.current) {
            let clientX: number, clientY: number;
            const textareaRect = textarea.getBoundingClientRect();

            if ("clientX" in e && e.clientX > 0 && e.clientY > 0) {
              clientX = e.clientX;
              clientY = e.clientY;
            } else if ("changedTouches" in e) {
              const touch = e.changedTouches[0] || e.touches[0];
              if (touch && touch.clientX > 0 && touch.clientY > 0) {
                clientX = touch.clientX;
                clientY = touch.clientY;
              } else {
                clientX = textareaRect.left + textareaRect.width / 2;
                clientY = textareaRect.top + textareaRect.height / 2;
              }
            } else {
              clientX = textareaRect.left + textareaRect.width / 2;
              clientY = textareaRect.top + textareaRect.height / 2;
            }

            const viewportHeight = window.visualViewport?.height || window.innerHeight;
            const menuWidth = isTouch ? 320 : 280;

            const { top, left } = calculateMenuPosition(
              clientX,
              clientY,
              containerRect,
              isTouch,
              viewportHeight,
              menuWidth
            );

            setContextualMenu({ top, left });
            document.body.classList.add("contextual-menu-active");
          }
        } else {
          setContextualMenu(null);
          document.body.classList.remove("contextual-menu-active");
        }
      } catch (error) {
        setContextualMenu(null);
        document.body.classList.remove("contextual-menu-active");
      }
    }, timeout);
  }, []);

  // Close contextual menu on outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        const target = event.target;
        if (!target || !(target instanceof Node)) return;

        const menu = document.querySelector(".contextual-menu-container");
        if (menu && !menu.contains(target)) {
          setContextualMenu(null);
          document.body.classList.remove("contextual-menu-active");
        }
      } catch (error) {
        setContextualMenu(null);
        document.body.classList.remove("contextual-menu-active");
      }
    };

    const handleKeyDown = (event: Event) => {
      try {
        const keyEvent = event as unknown as KeyboardEvent;
        if (keyEvent.key === "Escape") {
          setContextualMenu(null);
          document.body.classList.remove("contextual-menu-active");
        }
      } catch (error) {
        setContextualMenu(null);
        document.body.classList.remove("contextual-menu-active");
      }
    };

    if (contextualMenu) {
      document.addEventListener("mousedown", handleClickOutside, { passive: true });
      document.addEventListener("keydown", handleKeyDown, { passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextualMenu]);

  return {
    contextualMenu,
    setContextualMenu,
    handleTextSelection,
  };
};

/**
 * Hook for selection navigator functionality
 */
export const useSelectionNavigator = (): UseSelectionNavigatorReturn => {
  const [selectionNavigator, setSelectionNavigator] = useState<SelectionNavigatorState | null>(null);

  const handlePreviewSelection = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    activeNote: Note,
    editorRef: React.RefObject<HTMLTextAreaElement>
  ) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setSelectionNavigator(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    const isCodeSelection = range.startContainer.parentElement?.closest("pre, code");
    const normalizedSelectedText = normalizeSelectedText(selectedText, !!isCodeSelection);

    if (normalizedSelectedText.length === 0 || !activeNote) {
      setSelectionNavigator(null);
      return;
    }

    const editorTextarea = editorRef.current;
    if (!editorTextarea) return;

    const originalContent = activeNote.content || '';
    const searchPattern = createSearchPattern(normalizedSelectedText);

    try {
      const searchRegex = new RegExp(searchPattern, "gi");
      const matches: Array<{ start: number; end: number }> = [];
      let match;
      while ((match = searchRegex.exec(originalContent)) !== null) {
        if (match[0].trim().length > 0) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
          });
        }
      }

      if (matches.length > 1) {
        const containerRect = e.currentTarget.getBoundingClientRect();
        const rangeRect = range.getBoundingClientRect();

        const navigatorWidth = 160;
        const navigatorHeight = 44;

        let left = e.clientX - containerRect.left - navigatorWidth / 2;
        let top = rangeRect.top - containerRect.top - navigatorHeight;

        if (top < 10) {
          top = rangeRect.bottom - containerRect.top + 10;
        }
        left = Math.max(10, Math.min(left, containerRect.width - navigatorWidth - 10));

        setSelectionNavigator({
          matches,
          currentIndex: 0,
          top,
          left,
        });

        const firstMatch = matches[0];
        editorTextarea.focus();
        editorTextarea.setSelectionRange(firstMatch.start, firstMatch.end);
        const scrollPosition =
          (firstMatch.start / originalContent.length) * editorTextarea.scrollHeight -
          editorTextarea.clientHeight / 2;
        editorTextarea.scrollTop = Math.max(0, scrollPosition);
      } else if (matches.length === 1) {
        setSelectionNavigator(null);
        editorTextarea.focus();
        editorTextarea.setSelectionRange(matches[0].start, matches[0].end);
        const scrollPosition =
          (matches[0].start / originalContent.length) * editorTextarea.scrollHeight -
          editorTextarea.clientHeight / 2;
        editorTextarea.scrollTop = Math.max(0, scrollPosition);
      } else {
        setSelectionNavigator(null);
      }
    } catch (error) {
      console.error("Error creating or executing regex:", error);
      setSelectionNavigator(null);
    }
  }, []);

  const navigateMatches = useCallback((direction: "next" | "prev") => {
    if (!selectionNavigator) return;

    const { matches, currentIndex } = selectionNavigator;
    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % matches.length
        : (currentIndex - 1 + matches.length) % matches.length;

    setSelectionNavigator((prev) =>
      prev ? { ...prev, currentIndex: nextIndex } : null
    );
  }, [selectionNavigator]);

  return {
    selectionNavigator,
    setSelectionNavigator,
    handlePreviewSelection,
    navigateMatches,
  };
};

/**
 * Hook for markdown processing functionality
 */
export const useMarkdownProcessing = (
  content: string,
  onToast: (message: string, type: "error" | "success" | "info") => void
): UseMarkdownProcessingReturn => {
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const previewPaneRef = useRef<HTMLDivElement>(null);

  const { html: renderedMarkdown, diagrams: mermaidDiagrams } = parseMarkdownWithDiagrams(content);

  const restoreCopyButtons = useCallback(() => {
    const previewPane = previewPaneRef.current || document.querySelector(".preview-pane");
    if (!previewPane) return;

    const codeBlocks = previewPane.querySelectorAll("pre");
    codeBlocks.forEach((preBlock) => {
      const codeElement = preBlock.querySelector("code");
      if (!codeElement) return;

      // Apply syntax highlighting immediately if not already done
      if (!codeElement.classList.contains("hljs") && typeof hljs !== "undefined") {
        try {
          hljs.highlightElement(codeElement as HTMLElement);
        } catch (error) {
          console.warn("Highlighting failed:", error);
        }
      }

      (preBlock as HTMLElement).dataset.enhanced = "true";
      (preBlock as HTMLElement).style.position = "relative";

      if (!preBlock.querySelector(".copy-button-container")) {
        const buttonContainer = createCopyButton(codeElement, onToast);
        preBlock.appendChild(buttonContainer);
      }
    });
  }, [onToast]);

  const processPreviewContent = useCallback(() => {
    const previewPane = previewPaneRef.current || document.querySelector(".preview-pane");
    if (!previewPane) return;

    processLinks(previewPane);

    // Mermaid diagrams are now handled by the enhanced MermaidRenderer component

    // Handle multi-line code blocks
    const codeBlocks = previewPane.querySelectorAll("pre");
    codeBlocks.forEach((preBlock) => {
      const codeElement = preBlock.querySelector("code");
      if (!codeElement) return;

      // Always ensure proper styling
      (preBlock as HTMLElement).style.position = "relative";
      
      // Check if already enhanced and has copy button
      const isEnhanced = (preBlock as HTMLElement).dataset.enhanced === "true";
      const hasCopyButton = preBlock.querySelector(".copy-button-container");
      
      // If not enhanced or missing copy button, add/restore functionality
      if (!isEnhanced || !hasCopyButton) {
        // Mark as enhanced
        (preBlock as HTMLElement).dataset.enhanced = "true";
        
        // Remove existing copy button if any (to avoid duplicates)
        const existingButton = preBlock.querySelector(".copy-button-container");
        if (existingButton) {
          existingButton.remove();
        }
        
        // Add per-line functionality first (before copy button to avoid cloning issues)
        addPerLineClickFunctionality(preBlock, codeElement, onToast);
        
        // Then add copy button (after per-line setup to avoid event listener conflicts)
        const buttonContainer = createCopyButton(codeElement, onToast);
        preBlock.appendChild(buttonContainer);
      }
    });

    // Handle inline code elements (backticks)
    const inlineCodeElements = previewPane.querySelectorAll("code:not(pre > code)");
    inlineCodeElements.forEach((codeElement) => {
      const isEnhanced = (codeElement as HTMLElement).dataset.enhanced === "true";
      if (isEnhanced) return;

      (codeElement as HTMLElement).dataset.enhanced = "true";
      
      // Add click handler for inline code copying
      const clickHandler = (e: Event) => {
        e.stopPropagation();
        const text = (codeElement as HTMLElement).innerText;
        navigator.clipboard.writeText(text).then(() => {
          // Show toast with copied inline code text
          const preview = text.length > 100 ? text.slice(0, 97) + '...' : text;
          onToast(`Copied: ${preview}`, "success");
        }).catch((err) => {
          console.error("Failed to copy inline code: ", err);
        });
      };
      
      codeElement.addEventListener("click", clickHandler);
      
      // Store reference to handler for potential cleanup
      (codeElement as any)._clickHandler = clickHandler;
    });
  }, [onToast]);

  // Setup preview content processing
  useEffect(() => {
    const tryProcess = () => {
      if (typeof hljs === "undefined") return;
      const container = previewPaneRef.current || document.querySelector(".preview-pane");
      if (!container) return;

      const processContent = () => {
        // First, immediately highlight all code blocks
        const blocks = container.querySelectorAll("pre code");
        blocks.forEach((block) => {
          if (!block.classList.contains("hljs")) {
            try {
              hljs.highlightElement(block as HTMLElement);
            } catch (error) {
              // Fallback if highlighting fails
              console.warn("Highlighting failed for block:", error);
            }
          }
        });
        
        // Then process copy buttons and other functionality
        processPreviewContent();
      };

      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }

      mutationObserverRef.current = new MutationObserver((mutations) => {
        let shouldProcess = false;
        mutations.forEach((mutation) => {
          if (mutation.type === "childList" || mutation.type === "characterData") {
            shouldProcess = true;
          }
        });

        if (shouldProcess) {
          setTimeout(processContent, 100);
        }
      });

      mutationObserverRef.current.observe(container as Node, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      // Immediate processing
      processContent();
      // Backup processing
      requestAnimationFrame(processContent);

      return () => {
        if (mutationObserverRef.current) {
          mutationObserverRef.current.disconnect();
        }
      };
    };

    const cleanup = tryProcess();
    window.addEventListener("focus", tryProcess, { passive: true });
    
    // Listen for preview mount events to re-process content
    const handlePreviewMount = () => {
      // Immediate syntax highlighting
      const container = previewPaneRef.current || document.querySelector(".preview-pane");
      if (container && typeof hljs !== "undefined") {
        const blocks = container.querySelectorAll("pre code");
        blocks.forEach((block) => {
          if (!block.classList.contains("hljs")) {
            try {
              hljs.highlightElement(block as HTMLElement);
            } catch (error) {
              console.warn("Highlighting failed:", error);
            }
          }
        });
      }
      
      // Then process other functionality
      processPreviewContent();
      
      // Backup processing after DOM settles
      requestAnimationFrame(() => {
        processPreviewContent();
      });
    };
    
    window.addEventListener("preview-mounted", handlePreviewMount, { passive: true });

    // Theme changes are now handled automatically by MermaidRenderer component

    return () => {
      window.removeEventListener("focus", tryProcess);
      window.removeEventListener("preview-mounted", handlePreviewMount);
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
  }, [renderedMarkdown, processPreviewContent]);

  // Force re-processing when content changes (for view switches)
  useEffect(() => {
    // Immediate syntax highlighting first
    const container = previewPaneRef.current || document.querySelector(".preview-pane");
    if (container && typeof hljs !== "undefined") {
      const blocks = container.querySelectorAll("pre code:not(.hljs)");
      blocks.forEach((block) => {
        try {
          hljs.highlightElement(block as HTMLElement);
        } catch (error) {
          console.warn("Highlighting failed:", error);
        }
      });
    }
    
    // Then immediate processing for faster response
    processPreviewContent();
    
    // Backup processing
    const timer = setTimeout(() => {
      processPreviewContent();
    }, 50);

    return () => clearTimeout(timer);
  }, [content, processPreviewContent]);

  return {
    renderedMarkdown,
    mermaidDiagrams,
    processPreviewContent,
    restoreCopyButtons,
  };
};
