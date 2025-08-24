import { ScrollSyncOptions } from "./types";

declare const marked: any;
declare const hljs: any;

/**
 * Initialize Marked and Highlight.js with configuration
 */
export const initializeMarkdownProcessing = () => {
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
};

/**
 * Parse markdown content safely
 */
export const parseMarkdown = (content: string): string => {
  if (content && typeof marked !== "undefined") {
    try {
      return marked.parse(content);
    } catch (e) {
      console.error("Markdown parsing error:", e);
      return content; // Fallback to raw content
    }
  }
  return "";
};

/**
 * Add target="_blank" and rel="noopener noreferrer" to all links in preview
 */
export const processLinks = (previewPane: Element) => {
  const links = previewPane.querySelectorAll("a");
  links.forEach((link) => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    link.classList.add(
      "text-accent",
      "dark:text-dark-accent",
      "hover:underline"
    );
  });
};

/**
 * Create copy button for code blocks
 */
export const createCopyButton = (
  codeElement: Element,
  onToast: (message: string, type: "error" | "success" | "info") => void
): HTMLDivElement => {
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "copy-button-container absolute top-2 right-2 z-60";

  const copyButton = document.createElement("button");
  copyButton.className =
    "p-1.5 rounded-md bg-bg-secondary dark:bg-dark-bg-secondary text-text-secondary dark:text-dark-text-secondary hover:bg-border-color dark:hover:bg-dark-border-color transition-colors flex items-center justify-center gap-1 shadow-sm";

  const copyIconSVG = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>`;

  copyButton.innerHTML = copyIconSVG;
            copyButton.style.width = "";
            copyButton.style.transform = "";
  copyButton.title = "Copy code";
  copyButton.setAttribute("data-copy-button", "true");

  copyButton.onclick = (e: MouseEvent) => {
    e.stopPropagation();
        const text = (codeElement as HTMLElement).innerText;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        onToast("Copied!", "success");
                copyButton.innerHTML = `<span class="flex items-center gap-1 text-green-500 dark:text-green-400"><span>Copied</span><span>✓</span></span>`;
        // Expand width to fit new content and shift left so it stays inside pre
        const expandedWidth = copyButton.scrollWidth;
        copyButton.style.width = `${expandedWidth}px`;
        copyButton.title = "Copied!";
        copyButton.classList.remove(
          "text-text-secondary",
          "dark:text-dark-text-secondary"
        );
        copyButton.classList.add("text-green-500", "dark:text-green-400");
        setTimeout(() => {
          if (copyButton.parentNode) {
            copyButton.innerHTML = copyIconSVG;
            copyButton.style.width = "";
            copyButton.style.transform = "";
            copyButton.title = "Copy code";
            copyButton.classList.remove("text-green-500", "dark:text-green-400");
            copyButton.classList.add(
              "text-text-secondary",
              "dark:text-dark-text-secondary"
            );
          }
        }, 1500);
      })
      .catch((err) => {
        onToast("Failed to copy code: " + err, "error");
        console.error("Failed to copy code: ", err);
      });
  };

  buttonContainer.appendChild(copyButton);
  return buttonContainer;
};

/**
 * Add per-line click functionality to code blocks
 */
export const addPerLineClickFunctionality = (
  preBlock: Element,
  codeElement: Element,
  onToast: (message: string, type: "error" | "success" | "info") => void
) => {
  let lastHoverLine = -1;

  preBlock.addEventListener("mousemove", (evt: Event) => {
    const mouseEvent = evt as MouseEvent;
        const preEl = preBlock as HTMLElement;
    const codeEl = codeElement as HTMLElement;

    preEl.style.cursor = "default";

    const prev = preEl.querySelector(".code-line-hover-caret");
    if (prev) prev.remove();

    const r = (document as any).caretRangeFromPoint
      ? (document as any).caretRangeFromPoint(mouseEvent.clientX, mouseEvent.clientY)
      : null;
    if (!r || !codeEl.contains(r.startContainer)) return;

    try {
      const tempRange = document.createRange();
      tempRange.selectNodeContents(codeEl);
      tempRange.setEnd(
        r.startContainer,
        Math.min(r.startOffset, (r.startContainer as any).length ?? 0)
      );
      const upToCaret = tempRange.toString();
      lastHoverLine = upToCaret.replace(/\r\n/g, "\n").split("\n").length - 1;
    } catch {
      lastHoverLine = -1;
    }

    const rects = (r as Range).getClientRects ? (r as Range).getClientRects() : [];
    const codeRect = codeEl.getBoundingClientRect();
    const preRect = preEl.getBoundingClientRect();
    if (!rects || rects.length === 0) return;

    const y = mouseEvent.clientY;
    let current: DOMRect | null = null;
    for (let i = 0; i < rects.length; i++) {
      const rr = rects[i] as DOMRect;
      if (y >= rr.top && y <= rr.bottom) {
        current = rr;
        break;
      }
    }

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

    const caret = document.createElement("div");
    caret.className = "code-line-hover-caret";
    Object.assign(caret.style, {
      position: "absolute",
      left: `${Math.max(4, codeRect.left - preRect.left - 6)}px`,
      width: "3px",
      borderRadius: "2px",
      top: `${current.top - preRect.top}px`,
      height: `${Math.max(12, Math.min(current.height, codeRect.height))}px`,
      background: "currentColor",
      opacity: "0.35",
      pointerEvents: "none",
      zIndex: "46",
    } as CSSStyleDeclaration);

    preEl.appendChild(caret);

    if (
      mouseEvent.clientX >= codeRect.left &&
      mouseEvent.clientX <= codeRect.right &&
      mouseEvent.clientY >= codeRect.top &&
      mouseEvent.clientY <= codeRect.bottom
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
      const prevHover = preEl.querySelector(".code-line-hover-caret");
      if (prevHover) prevHover.remove();
    },
    { passive: true }
  );

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

  preBlock.addEventListener("click", (evt: Event) => {
        const prevHover = (preBlock as HTMLElement).querySelector(".code-line-hover-caret");
    if (prevHover) prevHover.remove();

    if ((evt.target as HTMLElement).closest(".copy-button-container")) return;

    const codeText = (codeElement as HTMLElement).innerText;
    const lines = codeText.replace(/\r\n/g, "\n").split("\n");

    const toCopy =
      lastHoverLine >= 0 && lastHoverLine < lines.length
        ? lines[lastHoverLine]
        : codeText;

    navigator.clipboard.writeText(toCopy)
      .then(() => {
        onToast("Copied!", "success");
                // Flash visual feedback on successful copy
        (preBlock as HTMLElement).classList.add("flash-copied");
        setTimeout(() => (preBlock as HTMLElement).classList.remove("flash-copied"), 600);
      })
      .catch((err) => {
      onToast("Failed to copy: " + err, "error");
      console.error("Failed to copy line/block: ", err);
    });
  });
};

/**
 * Setup scroll sync between editor and preview
 */
export const setupScrollSync = ({
  editorRef,
  previewRef,
  viewMode,
}: ScrollSyncOptions) => {
  const editor = editorRef.current;
  const preview = previewRef.current;

  // Only activate in split view when both refs exist
  if (!editor || !preview || viewMode !== 'split') return null;

  // Allow user-driven smooth scrolling (via CSS) while ensuring programmatic sync is instant.
  // No need to override scrollBehavior here; it will be temporarily set to 'auto' only during syncing.

  let isSyncing = false;

  const syncScroll = (source: HTMLElement, target: HTMLElement) => {
    if (isSyncing) return;
    isSyncing = true;

    const sourceMax = source.scrollHeight - source.clientHeight;
    const targetMax = target.scrollHeight - target.clientHeight;
    if (sourceMax > 0) {
      const ratio = source.scrollTop / sourceMax;
      target.scrollTop = ratio * targetMax;
    }

    requestAnimationFrame(() => {
      isSyncing = false;
    });
  };

  const handleEditorScroll = () => syncScroll(editor, preview);
  const handlePreviewScroll = () => syncScroll(preview, editor);

  editor.addEventListener('scroll', handleEditorScroll);
  preview.addEventListener('scroll', handlePreviewScroll);

  // Cleanup callback for caller
  return () => {
    editor.removeEventListener('scroll', handleEditorScroll);
    preview.removeEventListener('scroll', handlePreviewScroll);
  };
};


/**
 * Calculate menu position for contextual menu
 */
export const calculateMenuPosition = (
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  isTouch: boolean,
  viewportHeight: number,
  menuWidth: number = 280
) => {
  const keyboardOpen = isTouch && viewportHeight < window.innerHeight * 0.8;
  let top, left;

  if (isTouch) {
    top = clientY - containerRect.top - 80;
    left = clientX - containerRect.left;

    if (top < 20) {
      top = clientY - containerRect.top + 25;
    }

    if (keyboardOpen && clientY > viewportHeight - 150) {
      top = Math.max(20, clientY - containerRect.top - 80);
    }
  } else {
    top = clientY - containerRect.top - 70;
    left = clientX - containerRect.left;

    if (top < 20) {
      top = clientY - containerRect.top + 15;
    }

    top = Math.max(10, Math.min(top, containerRect.height - 80));
  }

  const currentViewportWidth = window.innerWidth;
  const currentViewportHeight = window.visualViewport?.height || window.innerHeight;

  const containerOffsetX = containerRect.left;
  const containerOffsetY = containerRect.top;

  const absoluteLeft = containerOffsetX + left;
  const absoluteTop = containerOffsetY + top;

  let adjustedAbsoluteLeft = Math.max(
    10,
    Math.min(absoluteLeft, currentViewportWidth - menuWidth - 10)
  );
  let adjustedAbsoluteTop = Math.max(
    10,
    Math.min(absoluteTop, currentViewportHeight - 80)
  );

  left = adjustedAbsoluteLeft - containerOffsetX;
  top = adjustedAbsoluteTop - containerOffsetY;

  if (isNaN(left) || isNaN(top) || left < 0 || top < 0) {
    left = containerRect.width / 2 - menuWidth / 2;
    top = containerRect.height / 2 - 40;
    left = Math.max(10, Math.min(left, containerRect.width - menuWidth - 10));
    top = Math.max(10, Math.min(top, containerRect.height - 80));
  }

  return { top, left };
};

/**
 * Create regex pattern for text search
 */
export const createSearchPattern = (normalizedText: string): string => {
  const words = normalizedText.split(/\s+/);
  
  if (words.length > 8) {
    const firstWords = words
      .slice(0, 4)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\W*");
    const lastWords = words
      .slice(-4)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\W*");
    return `${firstWords}[\\s\\S]*?${lastWords}`;
  } else {
    return words
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\W*");
  }
};

/**
 * Normalize selected text for search
 */
export const normalizeSelectedText = (selectedText: string, isCodeSelection: boolean): string => {
  if (isCodeSelection) {
    return selectedText.trim();
  } else {
    return selectedText
      .replace(/\s+/g, " ")
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .trim();
  }
};
