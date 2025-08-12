import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  KeyboardEvent,
  useEffect,
} from "react";
import { Note, AITextAction } from "../types";
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

import {
  FaRegTrashCan,
  FaXmark,
  FaPencil,
  FaEye,
  FaTag,
  FaDownload,
  FaPenNib,
} from "react-icons/fa6";
import { FaMagic } from "react-icons/fa";
import ConfirmationModal from "./ConfirmationModal";
import AIGenerateModal from "./AIGenerateModal";
import EditorToolbar from "./EditorToolbar";
import SplitPane from "./SplitPane";
import ContextualMenu from "./ContextualMenu";
import { MdShare } from "react-icons/md";
import DownloadModal from "./DownloadModal";
import SelectionNavigator from "./SelectionNavigator";
import SummaryModal from "./SummaryModal";
import ShareModal from "./ShareModal";
import AIModifyModal from "./AIModifyModal"; // Import the new modal
import { MdCloudDownload } from "react-icons/md";
import SuggestionTextarea from "./SuggestionTextarea";

declare const marked: any;
declare const hljs: any;

interface NoteEditorProps {
  activeNote: Note | undefined;
  onUpdateNote: (note: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onAddNote: (note: Note) => void;
  viewMode?: "split" | "editor" | "preview";
}

const LoadingSpinner: React.FC = () => (
  <div className="w-5 h-5 border-2 border-text-muted/50 border-t-accent dark:border-dark-text-muted/50 dark:border-t-dark-accent rounded-full animate-spin"></div>
);

const Tag: React.FC<{ tag: string; onRemove: (tag: string) => void }> = ({
  tag,
  onRemove,
}) => (
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

const NoteEditor: React.FC<NoteEditorProps> = ({
  activeNote,
  onUpdateNote,
  onDeleteNote,
  onAddNote,
  viewMode = "split",
}) => {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] = useState(false);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [contextualMenu, setContextualMenu] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isAiActionLoading, setIsAiActionLoading] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAIModifyModalOpen, setIsAIModifyModalOpen] = useState(false); // New state for AIModifyModal
  const [textToModify, setTextToModify] = useState(""); // State to hold text for AI modification
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false); // Auto suggestions toggle - default OFF


  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<{content: string, cursorPos: number}[]>([]);
  const [redoStack, setRedoStack] = useState<{content: string, cursorPos: number}[]>([]);
  const [currentEditorContent, setCurrentEditorContent] = useState(
    activeNote?.content || ""
  );

  const MAX_HISTORY_LENGTH = 100; // Limit undo history to 100 steps

  // State for selection navigation
  const [selectionNavigator, setSelectionNavigator] = useState<{
    top: number;
    left: number;
    matches: { start: number; end: number }[];
    currentIndex: number;
  } | null>(null);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Effect to track cursor position reliably
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const updateCursorPos = () => {
      lastCursorPosRef.current = editor.selectionStart;
    };

    // These events fire before the onChange event, capturing the cursor position pre-change.
    editor.addEventListener('keyup', updateCursorPos);
    editor.addEventListener('mousedown', updateCursorPos);

    return () => {
      editor.removeEventListener('keyup', updateCursorPos);
      editor.removeEventListener('mousedown', updateCursorPos);
    };
  }, [activeNote]); // Re-attach listeners if the note/editor changes
  const [mobileView, setMobileView] = useState<"editor" | "preview">("preview");

  const { addToast } = useToasts();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lastCursorPosRef = useRef(0);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const previewPaneRef = useRef<HTMLDivElement>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Initialize Marked and Highlight.js here, in the component that uses them.
    if (typeof marked !== "undefined" && typeof hljs !== "undefined") {
      marked.setOptions({
        highlight: function (code: string, lang: string) {
          const language = hljs.getLanguage(lang) ? lang : "plaintext";
          return hljs.highlight(code, { language, ignoreIllegals: true }).value;
        },
        langPrefix: "hljs language-",
        gfm: true,
        breaks: true, // Treat single newlines as <br>
        linkify: true, // Automatically convert URLs to links
      });
    }
  }, []);

  const renderedMarkdown = useMemo(() => {
    if (activeNote && typeof marked !== "undefined") {
      try {
        const dirty = marked.parse(activeNote.content);
        return dirty;
      } catch (e) {
        console.error("Markdown parsing error:", e);
        return activeNote.content; // Fallback to raw content
      }
    }
    return "";
  }, [activeNote?.content]);

  // Function to restore copy buttons in code blocks (for mobile view switching)
  const restoreCopyButtons = useCallback(() => {
    const previewPane =
      previewPaneRef.current || document.querySelector(".preview-pane");
    if (!previewPane) return;

    const codeBlocks = previewPane.querySelectorAll("pre");
    codeBlocks.forEach((preBlock) => {
      const codeElement = preBlock.querySelector("code");
      if (!codeElement) return;

      // Ensure enhanced data attribute
      (preBlock as HTMLElement).dataset.enhanced = "true";
      (preBlock as HTMLElement).style.position = "relative";

      // Create copy button if it doesn't exist
      if (!preBlock.querySelector(".copy-button-container")) {
        const buttonContainer = document.createElement("div");
        buttonContainer.className =
          "copy-button-container absolute top-2 right-2 z-60";

        const copyButton = document.createElement("button");
        copyButton.className =
          "p-1.5 rounded-md bg-bg-secondary dark:bg-dark-bg-secondary text-text-secondary dark:text-dark-text-secondary hover:bg-border-color dark:hover:bg-dark-border-color transition-colors flex items-center justify-center gap-1 shadow-sm";

        const copyIconSVG = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>`;
        const checkIconSVG = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`;

        copyButton.innerHTML = copyIconSVG;
        copyButton.title = "Copy code";
        copyButton.setAttribute("data-copy-button", "true");

        copyButton.onclick = (e: MouseEvent) => {
          e.stopPropagation();
          const text = (codeElement as HTMLElement).innerText;
          navigator.clipboard
            .writeText(text)
            .then(() => {
              copyButton.innerHTML = `<span class="text-green-500 dark:text-green-400">Copied!</span> ${checkIconSVG}`;
              copyButton.title = "Copied!";
              copyButton.classList.remove(
                "text-text-secondary",
                "dark:text-dark-text-secondary"
              );
              copyButton.classList.add("text-green-500", "dark:text-green-400");
              setTimeout(() => {
                if (copyButton.parentNode) {
                  copyButton.innerHTML = copyIconSVG;
                  copyButton.title = "Copy code";
                  copyButton.classList.remove(
                    "text-green-500",
                    "dark:text-green-400"
                  );
                  copyButton.classList.add(
                    "text-text-secondary",
                    "dark:text-dark-text-secondary"
                  );
                }
              }, 1500);
            })
            .catch((err) => {
              addToast("Failed to copy code: " + err, "error");
              console.error("Failed to copy code: ", err);
            });
        };

        buttonContainer.appendChild(copyButton);
        preBlock.appendChild(buttonContainer);
      }
    });
  }, [addToast]);

  // Function to process URLs and add copy buttons to code blocks
  const processPreviewContent = useCallback(() => {
    const previewPane =
      previewPaneRef.current || document.querySelector(".preview-pane");
    if (!previewPane) return;

    // Add target="_blank" and rel="noopener noreferrer" to all links
    const links = previewPane.querySelectorAll("a");
    links.forEach((link) => {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      // Add styling classes
      link.classList.add(
        "text-accent",
        "dark:text-dark-accent",
        "hover:underline"
      );
    });

    // Add one block-level copy button and enable per-line copy via click without extra buttons
    const codeBlocks = previewPane.querySelectorAll("pre");
    codeBlocks.forEach((preBlock) => {
      // Check if already enhanced, but allow re-enhancement if missing copy button
      const isEnhanced = (preBlock as HTMLElement).dataset.enhanced === "true";
      const hasCopyButton = preBlock.querySelector(".copy-button-container");
      
      if (isEnhanced && hasCopyButton) return;

      const codeElement = preBlock.querySelector("code");
      if (!codeElement) return;

      (preBlock as HTMLElement).style.position = "relative";
      (preBlock as HTMLElement).dataset.enhanced = "true";

      // Create single top-right copy button
      if (!preBlock.querySelector(".copy-button-container")) {
        const buttonContainer = document.createElement("div");
        buttonContainer.className =
          "copy-button-container absolute top-2 right-2 z-60";

        const copyButton = document.createElement("button");
        copyButton.className =
          "p-1.5 rounded-md bg-bg-secondary dark:bg-dark-bg-secondary text-text-secondary dark:text-dark-text-secondary hover:bg-border-color dark:hover:bg-dark-border-color transition-colors flex items-center justify-center gap-1 shadow-sm";

        const copyIconSVG = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>`;
        const checkIconSVG = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`;

        copyButton.innerHTML = copyIconSVG;
        copyButton.title = "Copy code";
        copyButton.setAttribute("data-copy-button", "true");

        copyButton.onclick = (e: MouseEvent) => {
          e.stopPropagation();
          const text = (codeElement as HTMLElement).innerText;
          navigator.clipboard
            .writeText(text)
            .then(() => {
              copyButton.innerHTML = `<span class="text-green-500 dark:text-green-400">Copied!</span> ${checkIconSVG}`;
              copyButton.title = "Copied!";
              copyButton.classList.remove(
                "text-text-secondary",
                "dark:text-dark-text-secondary"
              );
              copyButton.classList.add("text-green-500", "dark:text-green-400");
              setTimeout(() => {
                if (copyButton.parentNode) {
                  copyButton.innerHTML = copyIconSVG;
                  copyButton.title = "Copy code";
                  copyButton.classList.remove(
                    "text-green-500",
                    "dark:text-green-400"
                  );
                  copyButton.classList.add(
                    "text-text-secondary",
                    "dark:text-dark-text-secondary"
                  );
                }
              }, 1500);
            })
            .catch((err) => {
              addToast("Failed to copy code: " + err, "error");
              console.error("Failed to copy code: ", err);
            });
        };

        buttonContainer.appendChild(copyButton);
        preBlock.appendChild(buttonContainer);
      }

      // Enable per-line copy without adding visual buttons:
      // - On mouse move, track the hovered visual line by caret position
      // - On click (not on the top-right button), copy the hovered line
      let lastHoverLine = -1;

      // New approach for precise indication without relying on line-height math:
      // Show a left-gutter caret/indicator aligned to the actual DOM rect under the cursor.
      preBlock.addEventListener("mousemove", (evt: MouseEvent) => {
        const preEl = preBlock as HTMLElement;
        const codeEl = codeElement as HTMLElement;

        // Change cursor to pointer when over code area
        preEl.style.cursor = "default";

        // Remove prior indicator
        const prev = preEl.querySelector(".code-line-hover-caret");
        if (prev) prev.remove();

        // Find the exact text rect under cursor using Range.getClientRects
        const r = (document as any).caretRangeFromPoint
          ? (document as any).caretRangeFromPoint(evt.clientX, evt.clientY)
          : null;
        if (!r || !codeEl.contains(r.startContainer)) return;

        // Compute the zero-based visual line number at pointer by counting newline characters up to caret
        try {
          const tempRange = document.createRange();
          tempRange.selectNodeContents(codeEl);
          tempRange.setEnd(
            r.startContainer,
            Math.min(r.startOffset, (r.startContainer as any).length ?? 0)
          );
          const upToCaret = tempRange.toString();
          lastHoverLine =
            upToCaret.replace(/\r\n/g, "\n").split("\n").length - 1;
        } catch {
          lastHoverLine = -1;
        }

        const rects = (r as Range).getClientRects
          ? (r as Range).getClientRects()
          : [];
        const codeRect = codeEl.getBoundingClientRect();
        const preRect = preEl.getBoundingClientRect();
        if (!rects || rects.length === 0) return;

        // Pick the fragment whose vertical span contains the pointer y
        const y = evt.clientY;
        let current: DOMRect | null = null;
        for (let i = 0; i < rects.length; i++) {
          const rr = rects[i] as DOMRect;
          if (y >= rr.top && y <= rr.bottom) {
            current = rr;
            break;
          }
        }
        // Fallback: pick the closest rect to the cursor Y
        if (!current) {
          let minDy = Number.POSITIVE_INFINITY;
          for (let i = 0; i < rects.length; i++) {
            const rr = rects[i] as DOMRect;
            const dy = Math.min(Math.abs(y - rr.top), Math.abs(y - rr.bottom));
            if (dy < minDy) {
              minDy = dy;
              current = rr;
            }
          }
        }
        if (!current) return;

        // Draw a thin left gutter caret aligned with the exact fragment rect
        const caret = document.createElement("div");
        caret.className = "code-line-hover-caret";
        Object.assign(caret.style, {
          position: "absolute",
          left: `${Math.max(4, codeRect.left - preRect.left - 6)}px`,
          width: "3px",
          borderRadius: "2px",
          top: `${current.top - preRect.top}px`,
          height: `${Math.max(
            12,
            Math.min(current.height, codeRect.height)
          )}px`,
          background: "currentColor",
          opacity: "0.35",
          pointerEvents: "none",
          zIndex: "46",
        } as CSSStyleDeclaration);

        preEl.appendChild(caret);

        // Also switch cursor to pointer only when actually over code text rect
        if (
          evt.clientX >= codeRect.left &&
          evt.clientX <= codeRect.right &&
          evt.clientY >= codeRect.top &&
          evt.clientY <= codeRect.bottom
        ) {
          preEl.style.cursor = "pointer";
        }
      });

      preBlock.addEventListener(
        "mouseleave",
        () => {
          const preEl = preBlock as HTMLElement;
          preEl.style.cursor = "default";
          lastHoverLine = -1;

          // Clean up hover indicator
          const prevHover = preEl.querySelector(".code-line-hover-caret");
          if (prevHover) prevHover.remove();
        },
        { passive: true }
      );

      // Hide gutter caret when pointer leaves the code element area as well
      codeElement.addEventListener(
        "mouseleave",
        () => {
          const preEl = preBlock as HTMLElement;
          preEl.style.cursor = "default";
          lastHoverLine = -1;
          const prevHover = preEl.querySelector(".code-line-hover-caret");
          if (prevHover) prevHover.remove();
        },
        { passive: true }
      );

      // Ensure hover indicator is cleared before placing click feedback overlays
      preBlock.addEventListener("click", (evt: MouseEvent) => {
        const prevHover = (preBlock as HTMLElement).querySelector(
          ".code-line-hover-caret"
        );
        if (prevHover) prevHover.remove();
        // Ignore clicks on the top-right copy button
        if ((evt.target as HTMLElement).closest(".copy-button-container"))
          return;

        const codeText = (codeElement as HTMLElement).innerText;
        const lines = codeText.replace(/\r\n/g, "\n").split("\n");

        // If a specific visual line was found, copy it; otherwise, fall back to entire block
        const toCopy =
          lastHoverLine >= 0 && lastHoverLine < lines.length
            ? lines[lastHoverLine]
            : codeText;

        // Avoid copying empty string lines unless user actually clicked on them (still OK)
        navigator.clipboard.writeText(toCopy).catch((err) => {
          addToast("Failed to copy: " + err, "error");
          console.error("Failed to copy line/block: ", err);
        });
      });
    });
  }, [addToast]); // Add addToast to dependencies

  // Ensure preview actions (highlighting + copy buttons) always run when:
  // - markdown changes
  // - preview tab becomes visible (view mode changes)
  // - component mounts
  useEffect(() => {
    // If preview pane isn't mounted yet, try again on next tick
    const tryProcess = () => {
      if (typeof hljs === "undefined") return;
      const container =
        previewPaneRef.current || document.querySelector(".preview-pane");
      if (!container) return;

      const processContent = () => {
        const blocks = container.querySelectorAll("pre code");
        blocks.forEach((block) => {
          if (!block.classList.contains("hljs")) {
            hljs.highlightElement(block as HTMLElement);
          }
        });
        processPreviewContent();
      };

      // Setup MutationObserver to watch for changes
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }

      mutationObserverRef.current = new MutationObserver((mutations) => {
        let shouldProcess = false;

        mutations.forEach((mutation) => {
          if (
            mutation.type === "childList" ||
            mutation.type === "characterData"
          ) {
            shouldProcess = true;
          }
        });

        if (shouldProcess) {
          // Small delay to ensure DOM is stable
          setTimeout(processContent, 100);
        }
      });

      // Start observing
      mutationObserverRef.current.observe(container as Node, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      // Initial processing
      setTimeout(processContent, 100);

      // Also re-run processing when the preview pane becomes visible after switching tabs
      // Using an animation frame ensures the DOM for preview is mounted
      requestAnimationFrame(processContent);

      // Cleanup
      return () => {
        if (mutationObserverRef.current) {
          mutationObserverRef.current.disconnect();
        }
      };
    };

    // Run once now (mount or dependency change)
    tryProcess();

    // Also run when window gains focus (e.g. after tab switches)
    window.addEventListener("focus", tryProcess, { passive: true });

    // Fix for mobile view switching: re-process when mobile view changes
    const handleMobileViewChange = () => {
      if (!isDesktop && mobileView === "preview") {
        // Small delay to ensure DOM is stable after view switch
        setTimeout(() => {
          restoreCopyButtons();
          tryProcess();
        }, 200);
      }
    };

    // Listen for mobile view changes
    window.addEventListener("resize", handleMobileViewChange, { passive: true });

    return () => {
      window.removeEventListener("focus", tryProcess);
      window.removeEventListener("resize", handleMobileViewChange);
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
  }, [renderedMarkdown, processPreviewContent, restoreCopyButtons, viewMode, isDesktop, mobileView]);

  // Reset suggestions when activeNote changes
  useEffect(() => {
    setSuggestedTags([]);
    setIsSuggestingTags(false);
  }, [activeNote?.id]);


  // Bug fix: Close contextual menu on any click outside of it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        // Safely check if the click is outside the menu container
        const target = event.target;
        if (!target || !(target instanceof Node)) return;

        const menu = document.querySelector(".contextual-menu-container");
        if (menu && !menu.contains(target)) {
          setContextualMenu(null);
          document.body.classList.remove("contextual-menu-active");
        }
      } catch (error) {
        // Silently handle any errors and just close the menu
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
        // Silently handle any errors and just close the menu
        setContextualMenu(null);
        document.body.classList.remove("contextual-menu-active");
      }
    };

    if (contextualMenu) {
      document.addEventListener("mousedown", handleClickOutside, {
        passive: true,
      });
      document.addEventListener("keydown", handleKeyDown, { passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextualMenu]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNote({ title: e.target.value });
  };

  useEffect(() => {
    if (activeNote) {
      setCurrentEditorContent(activeNote.content);
      // Reset undo/redo stacks when activeNote changes
      setUndoStack([]);
      setRedoStack([]);
    }
  }, [activeNote?.id]); // Only re-run when the note ID changes

  const pushToUndoStack = useCallback((oldContent: string) => {

    setUndoStack((prev) => {
      const newStack = [...prev, {content: oldContent, cursorPos: lastCursorPosRef.current}];
      // Trim history if it exceeds MAX_HISTORY_LENGTH
      if (newStack.length > MAX_HISTORY_LENGTH) {
        return newStack.slice(newStack.length - MAX_HISTORY_LENGTH);
      }
      return newStack;
    });
    setRedoStack([]); // Clear redo stack on new action
  }, []);

  // Deprecated handler (kept here earlier) removed to avoid unused warning.

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    const currentCursorPos = editorRef.current?.selectionStart || 0;
    
    setUndoStack((prev) => prev.slice(0, -1)); // Remove last item
    setRedoStack((prev) => [...prev, {content: currentEditorContent, cursorPos: currentCursorPos}]); // Add current to redo stack

    setCurrentEditorContent(previousState.content);
    onUpdateNote({ content: previousState.content });

    // Restore cursor position
    setTimeout(() => {
      const textarea = editorRef.current;
      if (textarea) {
        textarea.focus();
        const pos = Math.min(previousState.cursorPos, previousState.content.length);
        textarea.setSelectionRange(pos, pos);
      }
    }, 0);
  }, [undoStack, redoStack, currentEditorContent, onUpdateNote]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const currentCursorPos = editorRef.current?.selectionStart || 0;
    
    setRedoStack((prev) => prev.slice(0, -1)); // Remove last item
    setUndoStack((prev) => [...prev, {content: currentEditorContent, cursorPos: currentCursorPos}]); // Add current to undo stack

    setCurrentEditorContent(nextState.content);
    onUpdateNote({ content: nextState.content });

    // Restore cursor position
    setTimeout(() => {
      const textarea = editorRef.current;
      if (textarea) {
        textarea.focus();
        const pos = Math.min(nextState.cursorPos, nextState.content.length);
        textarea.setSelectionRange(pos, pos);
      }
    }, 0);
  }, [undoStack, redoStack, currentEditorContent, onUpdateNote]);

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim().toLowerCase();
      if (newTag && !activeNote?.tags.includes(newTag)) {
        onUpdateNote({ tags: [...(activeNote?.tags || []), newTag] });
      }
      e.currentTarget.value = ""; // Clear the input field
    }
  };

  const handleTagKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    // Check if the key pressed was a comma, or if the value now contains a comma
    // The second check is crucial for mobile keyboards where e.key might not be ','
    if (e.key === "," || e.currentTarget.value.includes(",")) {
      e.preventDefault(); // Prevent the comma from being typed if it's not already
      const newTag = e.currentTarget.value.split(",")[0].trim().toLowerCase();

      if (newTag && !activeNote?.tags.includes(newTag)) {
        onUpdateNote({ tags: [...(activeNote?.tags || []), newTag] });
      }
      e.currentTarget.value = ""; // Clear the input field
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdateNote({ tags: activeNote?.tags.filter((t) => t !== tagToRemove) });
  };

  const addSuggestedTag = (tagToAdd: string) => {
    if (tagToAdd && !activeNote?.tags.includes(tagToAdd)) {
      onUpdateNote({ tags: [...(activeNote?.tags || []), tagToAdd] });
      setSuggestedTags((prev) => prev.filter((t) => t !== tagToAdd));
    }
  };

  // Ensure handleSummarize is correctly used
  const handleSummarize = useCallback(async () => {
    if (!activeNote) return;
    setIsSummarizing(true);
    setIsSummaryModalOpen(true);
    setSummaryContent("");

    try {
      const summary = await summarizeText(activeNote.content);
      setSummaryContent(summary);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to get summary.",
        "error"
      );
      setIsSummaryModalOpen(false);
    } finally {
      setIsSummarizing(false);
    }
  }, [activeNote, addToast]);

  const handleAddSummaryToNote = useCallback(() => {
    if (!activeNote || !summaryContent) return;
    const summarySection = `\n\n---\n\n**AI Summary:**\n*${summaryContent}*`;
    onUpdateNote({ content: activeNote.content + summarySection });
    addToast("Summary added to note!", "success");
  }, [activeNote, summaryContent, onUpdateNote, addToast]);

  const handleSuggestTags = useCallback(async () => {
    if (!activeNote) return;
    setIsSuggestingTags(true);
    try {
      const tags = await suggestTagsForText(activeNote.content);
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
        id: Date.now().toString(), // Simple unique ID
        title: topic,
        content: content,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
        isImported: false,
      };
      onAddNote(newNote); // Add the new note instead of updating the current one
      addToast("Note generated successfully!", "success");
      setIsAIGenerateModalOpen(false);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to generate note.",
        "error"
      );
    } finally {
      setIsGeneratingNote(false);
    }
  };

  /** Handler to auto-generate the title from content **/
  const handleGenerateTitle = useCallback(async () => {
    if (!activeNote) return;
    // avoid spamming on very short content
    if (activeNote.content.trim().length < 20) {
      addToast("Please write more content before generating a title.", "info");
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const newTitle = await generateTitle(activeNote.content);
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

  const handleTextSelection = (
    e:
      | React.MouseEvent<HTMLTextAreaElement>
      | React.TouchEvent<HTMLTextAreaElement>
  ) => {
    const textarea = e.currentTarget;

    // Use different timeouts for mouse vs touch
    const isTouch = "touches" in e || "changedTouches" in e;
    const timeout = isTouch ? 350 : 200; // Longer timeout for aggressive selections

    setTimeout(() => {
      try {
        // Force refresh the selection state
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        // Only show menu if we have a valid selection and textarea is focused
        if (
          selectedText.length > 0 &&
          start !== end &&
          document.activeElement === textarea
        ) {
          const containerRect =
            editorContainerRef.current?.getBoundingClientRect();
          if (containerRect && editorContainerRef.current) {
            // Get position - use simple fallback approach for reliability
            let clientX: number, clientY: number;

            const textareaRect = textarea.getBoundingClientRect();

            // Try event coordinates first
            if ("clientX" in e && e.clientX > 0 && e.clientY > 0) {
              clientX = e.clientX;
              clientY = e.clientY;
            } else if ("changedTouches" in e) {
              const touch = e.changedTouches[0] || e.touches[0];
              if (touch && touch.clientX > 0 && touch.clientY > 0) {
                clientX = touch.clientX;
                clientY = touch.clientY;
              } else {
                // Fallback to center of textarea
                clientX = textareaRect.left + textareaRect.width / 2;
                clientY = textareaRect.top + textareaRect.height / 2;
              }
            } else {
              // Fallback to center of textarea for aggressive selections
              clientX = textareaRect.left + textareaRect.width / 2;
              clientY = textareaRect.top + textareaRect.height / 2;
            }

            // For mobile, account for virtual keyboard and use different positioning
            const viewportHeight =
              window.visualViewport?.height || window.innerHeight;
            const keyboardOpen =
              isTouch && viewportHeight < window.innerHeight * 0.8;

            // Position menu relative to selection point
            let top, left;

            if (isTouch) {
              // Mobile positioning - show above selection by default
              top = clientY - containerRect.top - 80; // Position above selection
              left = clientX - containerRect.left;

              // If near top of screen or not enough space above, show below
              if (top < 20) {
                top = clientY - containerRect.top + 25; // Show below selection
              }

              // If keyboard is open and we're at bottom, ensure it's above
              if (keyboardOpen && clientY > viewportHeight - 150) {
                top = Math.max(20, clientY - containerRect.top - 80);
              }
            } else {
              // Desktop positioning - show above selected text by default
              top = clientY - containerRect.top - 70; // Position above cursor/selection
              left = clientX - containerRect.left;

              // If menu would go above visible area, show it below
              if (top < 20) {
                top = clientY - containerRect.top + 15; // Show below selection
              }

              // Ensure menu stays within container bounds
              top = Math.max(10, Math.min(top, containerRect.height - 80));
            }

            // Ensure the menu doesn't go too far left or right
            const menuWidth = isTouch ? 320 : 280; // Wider menu for touch devices
            const currentViewportWidth = window.innerWidth;
            const currentViewportHeight =
              window.visualViewport?.height || window.innerHeight;

            // Calculate bounds relative to viewport, not just container
            const containerOffsetX = containerRect.left;
            const containerOffsetY = containerRect.top;

            // Calculate absolute position in viewport
            const absoluteLeft = containerOffsetX + left;
            const absoluteTop = containerOffsetY + top;

            // Ensure menu stays within viewport bounds
            let adjustedAbsoluteLeft = Math.max(
              10,
              Math.min(absoluteLeft, currentViewportWidth - menuWidth - 10)
            );
            let adjustedAbsoluteTop = Math.max(
              10,
              Math.min(absoluteTop, currentViewportHeight - 80)
            );

            // Convert back to container-relative coordinates
            left = adjustedAbsoluteLeft - containerOffsetX;
            top = adjustedAbsoluteTop - containerOffsetY;

            // Final safety check to ensure it's within container bounds
            if (isNaN(left) || isNaN(top) || left < 0 || top < 0) {
              // Ultimate fallback - position at center of textarea
              const textareaRect = textarea.getBoundingClientRect();
              left = textareaRect.width / 2 - menuWidth / 2;
              top = textareaRect.height / 2 - 40;
              // Ensure it's within bounds
              left = Math.max(
                10,
                Math.min(left, containerRect.width - menuWidth - 10)
              );
              top = Math.max(10, Math.min(top, containerRect.height - 80));
            }

            setContextualMenu({ top, left });
            // Add class to body to suppress default selection behavior
            document.body.classList.add("contextual-menu-active");
          }
        } else {
          // Clicks/touches inside the textarea without selection should hide the menu.
          setContextualMenu(null);
          document.body.classList.remove("contextual-menu-active");
        }
      } catch (error) {
        // If any error occurs, clear the menu
        setContextualMenu(null);
        document.body.classList.remove("contextual-menu-active");
      }
    }, timeout);
  };

  // Add selection change handler for mobile support only - but only when selection is stable
  const handleSelectionChange = () => {
    // Only handle selection changes on mobile/touch devices and when no touch is active
    if (!("ontouchstart" in window) || isDesktop) return;

    const textarea = editorRef.current;
    if (!textarea) return;

    // Only trigger if no active touch (selection is complete)
    if (document.body.classList.contains("contextual-menu-active")) return;

    setTimeout(() => {
      try {
        const selectedText = textarea.value.substring(
          textarea.selectionStart,
          textarea.selectionEnd
        );

        // Only show if selection is stable and textarea is focused
        if (selectedText.length > 0 && document.activeElement === textarea) {
          // Double check selection is still there after timeout (selection is stable)
          const currentSelection = textarea.value.substring(
            textarea.selectionStart,
            textarea.selectionEnd
          );
          if (
            currentSelection === selectedText &&
            currentSelection.length > 0
          ) {
            const containerRect =
              editorContainerRef.current?.getBoundingClientRect();
            if (containerRect && editorContainerRef.current) {
              // For mobile selection change, position menu above selection
              const rect = textarea.getBoundingClientRect();
              const left = rect.left + rect.width / 2 - containerRect.left;
              let top = rect.top - containerRect.top - 70; // Position above selection for mobile

              // If not enough space above, show below
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
    }, 300); // Longer timeout to ensure selection is complete
  };

  // Add effect to listen for selection changes
  React.useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.body.classList.remove("contextual-menu-active");
    };
  }, []);

  const handlePreviewSelection = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setSelectionNavigator(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      const isCodeSelection =
        range.startContainer.parentElement?.closest("pre, code");
      let normalizedSelectedText;

      if (isCodeSelection) {
        // For code, preserve internal newlines but trim the whole block
        normalizedSelectedText = selectedText.trim();
      } else {
        // For regular text, normalize all whitespace to a single space
        normalizedSelectedText = selectedText
          .replace(/\s+/g, " ")
          .replace(/[’‘]/g, "'")
          .replace(/[“”]/g, '"')
          .trim();
      }

      if (normalizedSelectedText.length === 0 || !activeNote) {
        setSelectionNavigator(null);
        return;
      }

      const editorTextarea = editorRef.current;
      if (!editorTextarea) return;

      const originalContent = activeNote.content;
      const words = normalizedSelectedText.split(/\s+/);
      let searchPattern;

      // Use a more robust regex strategy
      if (words.length > 8) {
        // Sparse regex for long selections using non-greedy match
        const firstWords = words
          .slice(0, 4)
          .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("\\W*");
        const lastWords = words
          .slice(-4)
          .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("\\W*");
        searchPattern = `${firstWords}[\\s\\S]*?${lastWords}`;
      } else {
        // Full regex for shorter selections
        searchPattern = words
          .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("\\W*");
      }

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

          const navigatorWidth = 160; // Estimated width of the navigator
          const navigatorHeight = 44; // Estimated height

          // Center based on the cursor's X position for better accuracy on multi-line selections
          let left = e.clientX - containerRect.left - navigatorWidth / 2;
          let top = rangeRect.top - containerRect.top - navigatorHeight;

          // Boundary checks to keep it on screen
          if (top < 10) {
            // Not enough space above
            top = rangeRect.bottom - containerRect.top + 10; // Position below
          }
          left = Math.max(
            10,
            Math.min(left, containerRect.width - navigatorWidth - 10)
          );

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
            (firstMatch.start / originalContent.length) *
              editorTextarea.scrollHeight -
            editorTextarea.clientHeight / 2;
          editorTextarea.scrollTop = Math.max(0, scrollPosition);
        } else if (matches.length === 1) {
          setSelectionNavigator(null);
          editorTextarea.focus();
          editorTextarea.setSelectionRange(matches[0].start, matches[0].end);
          const scrollPosition =
            (matches[0].start / originalContent.length) *
              editorTextarea.scrollHeight -
            editorTextarea.clientHeight / 2;
          editorTextarea.scrollTop = Math.max(0, scrollPosition);
        } else {
          setSelectionNavigator(null);
        }
      } catch (error) {
        console.error("Error creating or executing regex:", error);
        setSelectionNavigator(null);
      }
    },
    [activeNote]
  );

  const navigateMatches = (direction: "next" | "prev") => {
    if (!selectionNavigator) return;

    const { matches, currentIndex } = selectionNavigator;
    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % matches.length
        : (currentIndex - 1 + matches.length) % matches.length;

    const nextMatch = matches[nextIndex];
    const editorTextarea = editorRef.current;
    if (editorTextarea) {
      editorTextarea.focus();
      editorTextarea.setSelectionRange(nextMatch.start, nextMatch.end);

      const scrollPosition =
        (nextMatch.start / activeNote!.content.length) *
          editorTextarea.scrollHeight -
        editorTextarea.clientHeight / 2;
      editorTextarea.scrollTop = Math.max(0, scrollPosition);
    }

    setSelectionNavigator((prev) =>
      prev ? { ...prev, currentIndex: nextIndex } : null
    );
  };

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
        setIsAIModifyModalOpen(true);
      } else {
        const modifiedText = await performTextAction(
          selectedText,
          action,
          language
        );

        // Push current content to undo stack before change
        pushToUndoStack(textarea.value);

        // Use execCommand for undo-friendly text replacement
        textarea.focus();
        textarea.setSelectionRange(start, end);
        document.execCommand("insertText", false, modifiedText);

        // Manually update currentEditorContent and propagate change to parent
        setCurrentEditorContent(textarea.value);
        onUpdateNote({ content: textarea.value });

        const editorWrapper = document.querySelector(
          ".editor-textarea-wrapper"
        );
        if (editorWrapper) {
          editorWrapper.classList.add("flash-glow");
          setTimeout(() => editorWrapper.classList.remove("flash-glow"), 600);
        }

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
      ); // Re-use performTextAction for now
      const textarea = editorRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.focus();
        textarea.setSelectionRange(start, end);
        document.execCommand("insertText", false, modifiedText);

        // Manually update currentEditorContent and propagate change to parent
        setCurrentEditorContent(textarea.value);
        onUpdateNote({ content: textarea.value });

        const editorWrapper = document.querySelector(
          ".editor-textarea-wrapper"
        );
        if (editorWrapper) {
          editorWrapper.classList.add("flash-glow");
          setTimeout(() => editorWrapper.classList.remove("flash-glow"), 600);
        }

        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start, start + modifiedText.length);
        }, 0);
      }
      setIsAIModifyModalOpen(false);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!activeNote || !editorRef.current) return;

    const textarea = editorRef.current;

    // Handle Undo/Redo
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undoStack.length > 0) {
          undo();
        }
        return;
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
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

    // Only proceed with wrapping if there's selected text
    if (!selectedText || start === end) return;

    let wrappedText = "";
    let shouldWrap = false;

    // Check for Ctrl/Cmd key combinations for formatting
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
      // Check for regular key presses for wrapping (e.g., quotes)
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
      // Prevent the default key press behavior
      e.preventDefault();

      // Push current content to undo stack before change
      pushToUndoStack(textarea.value);

      // Execute the command through the textarea's execCommand for proper undo support
      textarea.focus();
      textarea.setSelectionRange(start, end); // Ensure the selected text is replaced
      document.execCommand("insertText", false, wrappedText);

      // Update local state and propagate change to parent
      setCurrentEditorContent(textarea.value);
      onUpdateNote({ content: textarea.value });

      // Update cursor position to after the wrapped text
      setTimeout(() => {
        textarea.setSelectionRange(
          start + wrappedText.length,
          start + wrappedText.length
        );
      }, 0);
    }
  };

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
    <div
      className="flex flex-col h-full bg-gray-50 dark:bg-dark-surface relative"
      ref={editorContainerRef}
    >
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
              onClick={handleGenerateTitle}
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
          {/* Mobile ghost suggestion chip — removed to keep mobile minimal and avoid blue banner */}
          {/* Intentionally disabled. Inline ghost with tap-to-accept in SuggestionTextarea handles mobile UX. */}
        </div>
      </div>
      <EditorToolbar
        textareaRef={editorRef as React.RefObject<HTMLTextAreaElement>}
        onUpdate={(v, newCursorPos) => {
          // Only push to undo stack if content actually changed
          if (activeNote && v !== activeNote.content) {
            pushToUndoStack(activeNote.content);
          }
          setCurrentEditorContent(v);
          onUpdateNote({ content: v });

          // Set cursor position if provided and textarea is available
          if (editorRef.current && newCursorPos !== undefined) {
            // Use setTimeout to ensure DOM is updated before setting selection
            setTimeout(() => {
              editorRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
          }
        }}
        onGenerateClick={() => setIsAIGenerateModalOpen(true)}
        suggestionsEnabled={suggestionsEnabled}
        onToggleSuggestions={(enabled) => {
          setSuggestionsEnabled(enabled);
          addToast(
            enabled
              ? "Auto suggestions enabled! Start typing to see AI suggestions."
              : "Auto suggestions disabled.",
            enabled ? "success" : "info"
          );
        }}
      />
      <div className="flex-grow overflow-y-auto p-4 editor-textarea-wrapper">
        <SuggestionTextarea
          ref={editorRef}
          value={currentEditorContent} // Use local state for controlled component
          onChange={(val: string) => {
            // Push current content to undo stack before changing
            if (val !== currentEditorContent) {
              pushToUndoStack(currentEditorContent);
            }
            setCurrentEditorContent(val);
            onUpdateNote({ content: val });
          }}
          onKeyDown={handleKeyDown}
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
          onContextMenu={(e: React.MouseEvent<HTMLTextAreaElement>) => {
            // Prevent default browser context menu on text selection
            e.preventDefault();
          }}
          onMouseDown={(e: React.MouseEvent<HTMLTextAreaElement>) => {
            // Don't clear menu if clicking on the contextual menu
            if (
              !(e.target as HTMLElement).closest(".contextual-menu-container")
            ) {
              // Only clear menu if we're not starting a new selection
              setTimeout(() => {
                if (!editorRef.current) return;
                const hasSelection =
                  editorRef.current.selectionStart !==
                  editorRef.current.selectionEnd;
                if (!hasSelection) {
                  setContextualMenu(null);
                  document.body.classList.remove("contextual-menu-active");
                }
              }, 10);
            }
          }}
          onTouchStart={(e: React.TouchEvent<HTMLTextAreaElement>) => {
            // Don't clear menu if touching the contextual menu
            if (
              !(e.target as HTMLElement).closest(".contextual-menu-container")
            ) {
              // Only clear menu if we're not starting a new selection
              setTimeout(() => {
                if (!editorRef.current) return;
                const hasSelection =
                  editorRef.current.selectionStart !==
                  editorRef.current.selectionEnd;
                if (!hasSelection) {
                  setContextualMenu(null);
                  document.body.classList.remove("contextual-menu-active");
                }
              }, 10);
            }
          }}
          onFocus={() => {
            // When textarea gets focus, set up selection monitoring for mobile
            setTimeout(() => {
              if ("ontouchstart" in window) {
                handleSelectionChange();
              }
            }, 500);
            // Keep ghost suggestion visible on focus; no-op
          }}
          style={{
            WebkitUserSelect: "text",
            WebkitTouchCallout: "none", // Disable iOS callout menu
            WebkitTapHighlightColor: "transparent",
            fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace !important"
          }}
          className="w-full h-full bg-transparent text-gray-800 dark:text-dark-text-secondary focus:outline-none resize-none leading-relaxed font-mono editor-textarea"
          placeholder="Start writing..."
          suggestionsEnabled={suggestionsEnabled}
          noteTitle={activeNote.title}
        />
      </div>
      {/* Removed spacer for mobile chip since chip is disabled */}
      <footer className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-dark-border-color text-xs text-gray-500 dark:text-dark-text-muted flex items-center justify-between">
        <span>
          {activeNote.content.split(/\s+/).filter(Boolean).length} words
        </span>
        <span>
          Last updated: {new Date(activeNote.updatedAt).toLocaleString()}
        </span>
      </footer>
      {contextualMenu && (
        <ContextualMenu
          top={contextualMenu.top}
          left={contextualMenu.left}
          onAction={handleAiTextAction}
          isLoading={isAiActionLoading}
          selectedText={editorRef.current?.value.substring(
            editorRef.current?.selectionStart || 0,
            editorRef.current?.selectionEnd || 0
          )}
        />
      )}
    </div>
  );

  const previewPane = (
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
        className="flex-grow overflow-y-auto overflow-x-hidden p-4 sm:p-6 select-text preview-pane min-w-0"
        onClick={(e) => {
          // Clear navigator if clicking on the pane itself, but not on selected text
          if ((window.getSelection()?.toString().trim() || "") === "") {
            setSelectionNavigator(null);
          }

          const target = e.target as HTMLElement;

          // Ignore clicks on the block copy button inside pre blocks
          if (target.closest(".copy-button-container")) return;

          // Robust inline-code click-to-copy (outside of PRE)
          if (target.tagName === "CODE" && !target.closest("pre")) {
            const codeEl = target.closest("code");
            if (codeEl) {
              const text = (codeEl.textContent || "").trim();
              if (text.length > 0) {
                const notify = () => addToast("Copied to clipboard", "success");
                const flash = () => {
                  codeEl.classList.add("inline-code-copied");
                  setTimeout(() => codeEl.classList.remove("inline-code-copied"), 300);
                };
                const onSuccess = () => {
                  flash();
                  notify();
                };
                const fallback = () => {
                  try {
                    const r = document.createRange();
                    r.selectNodeContents(codeEl);
                    const sel = window.getSelection();
                    sel?.removeAllRanges();
                    sel?.addRange(r);
                    const ok = document.execCommand("copy");
                    sel?.removeAllRanges();
                    if (ok) onSuccess();
                  } catch (err) {
                    console.error("Failed to copy inline code via fallback:", err);
                    addToast("Failed to copy", "error");
                  }
                };
                navigator.clipboard.writeText(text).then(onSuccess).catch(fallback);
              }
            }
          }
        }}
      >
        {/* Title Section */}
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-dark-border-color">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-dark-text-primary break-words">
              {activeNote.title || "Untitled Note"}
            </h1>
            {activeNote.isImported && (
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-full border border-blue-300 dark:border-blue-800 flex-shrink-0">
                <MdCloudDownload
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400"
                  title="This note was imported from a shared link"
                />
                <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 font-medium">
                  <span className="hidden sm:inline">Imported</span>
                  <span className="sm:hidden">Imported</span>
                  {activeNote.importedAt && (
                    <span className="ml-1 text-xs opacity-75 hidden sm:inline">
                      on {new Date(activeNote.importedAt).toLocaleDateString()}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
          {activeNote && activeNote.tags && activeNote.tags.length > 0 && (
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
          ref={previewPaneRef} // Attach ref to the preview pane
          className="prose prose-xs sm:prose-sm md:prose-base dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
          style={{ userSelect: "text", cursor: "text" }}
          onMouseUp={handlePreviewSelection}
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
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={handleSuggestTags}
            disabled={isSuggestingTags}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-dark-bg-secondary text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-dark-border-color transition-colors disabled:opacity-50"
          >
            {isSuggestingTags ? (
              <LoadingSpinner />
            ) : (
              <FaTag className="w-4 h-4 text-blue-600 dark:text-dark-accent" />
            )}
            <span className="hidden sm:inline">Suggest Tags</span>
            <span className="sm:hidden">Tags</span>
          </button>
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-dark-bg-secondary text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-dark-border-color transition-colors disabled:opacity-50"
          >
            {isSummarizing ? (
              <LoadingSpinner />
            ) : (
              <FaMagic className="w-4 h-4 text-blue-600 dark:text-dark-accent" />
            )}
            <span className="hidden md:inline">Summarize</span>
            <span className="md:hidden">Summary</span>
          </button>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-dark-bg-secondary text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-dark-border-color transition-colors"
          >
            <MdShare className="w-4 h-4 text-blue-600 dark:text-dark-accent" />
            <span className="hidden lg:inline">Share</span>
          </button>
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-dark-bg-secondary text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-dark-border-color transition-colors"
          >
            <FaDownload className="w-4 h-4 text-blue-600 dark:text-dark-accent" />
            <span className="hidden lg:inline">Download</span>
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
          >
            <FaRegTrashCan className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
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

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDeleteNote(activeNote.id);
          setIsDeleteModalOpen(false);
        }}
        title="Delete Note"
        message={
          <>
            Are you sure you want to delete "<strong>{activeNote.title}</strong>
            "? This action cannot be undone.
          </>
        }
        confirmText="Delete"
        confirmVariant="danger"
      />

      <AIGenerateModal
        isOpen={isAIGenerateModalOpen}
        isGenerating={isGeneratingNote}
        onClose={() => setIsAIGenerateModalOpen(false)}
        onGenerate={handleGenerateNote}
      />

      <AIModifyModal
        isOpen={isAIModifyModalOpen}
        onClose={() => setIsAIModifyModalOpen(false)}
        onModify={handleModifyTextWithAI}
        isLoading={isAiActionLoading}
        selectedText={textToModify}
      />

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        note={activeNote}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={summaryContent}
        isLoading={isSummarizing}
        onAddToNote={handleAddSummaryToNote}
        noteTitle={activeNote?.title || ""}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        note={activeNote}
        onToast={addToast}
      />
    </>
  );
};

export default NoteEditor;
