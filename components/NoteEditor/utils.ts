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
  
  // Remove any existing event listeners to prevent duplicates
  const newPreBlock = preBlock.cloneNode(true) as Element;
  preBlock.parentNode?.replaceChild(newPreBlock, preBlock);
  
  // Re-get references after cloning
  const preEl = newPreBlock as HTMLElement;
  const codeEl = newPreBlock.querySelector('code') || codeElement;

  preEl.addEventListener("mousemove", (evt: Event) => {
    const mouseEvent = evt as MouseEvent;
    
    // Remove previous hover indicator
    const prev = preEl.querySelector(".code-line-hover-caret");
    if (prev) prev.remove();

    // Get the text content and split into lines
    const codeText = (codeEl as HTMLElement).innerText || (codeEl as HTMLElement).textContent || '';
    const lines = codeText.replace(/\r\n/g, "\n").split("\n");
    
    // Calculate which line the mouse is hovering over
    const codeRect = (codeEl as HTMLElement).getBoundingClientRect();
    const preRect = preEl.getBoundingClientRect();
    
    if (codeRect.height === 0) return;
    
    // Calculate line height and current line
    const lineHeight = codeRect.height / lines.length;
    const relativeY = mouseEvent.clientY - codeRect.top;
    const currentLine = Math.floor(relativeY / lineHeight);
    
    console.log('Mouse Y:', mouseEvent.clientY, 'Code top:', codeRect.top, 'Relative Y:', relativeY, 'Line height:', lineHeight, 'Current line:', currentLine);
    
    // Ensure line index is within bounds
    if (currentLine >= 0 && currentLine < lines.length) {
      lastHoverLine = currentLine;
      console.log('Setting lastHoverLine to:', currentLine, 'Line content:', lines[currentLine]);
      
      // Create visual indicator for the hovered line
      const caret = document.createElement("div");
      caret.className = "code-line-hover-caret";
      Object.assign(caret.style, {
        position: "absolute",
        left: `${Math.max(4, codeRect.left - preRect.left - 6)}px`,
        width: `${codeRect.width - 8}px`,
        borderRadius: "4px",
        top: `${codeRect.top - preRect.top + (currentLine * lineHeight)}px`,
        height: `${Math.max(16, lineHeight - 2)}px`,
        background: "transparent",
        pointerEvents: "none",
        zIndex: "46",
      } as CSSStyleDeclaration);

      preEl.appendChild(caret);
      preEl.style.cursor = "pointer";
    } else {
      lastHoverLine = -1;
      preEl.style.cursor = "default";
    }
  });

  preEl.addEventListener(
    "mouseleave",
    () => {
      preEl.style.cursor = "default";
      lastHoverLine = -1;
      console.log('Mouse left, resetting lastHoverLine to -1');
      const prevHover = preEl.querySelector(".code-line-hover-caret");
      if (prevHover) prevHover.remove();
    },
    { passive: true }
  );

  preEl.addEventListener("click", (evt: Event) => {
    console.log('Click event! lastHoverLine:', lastHoverLine);
    
    const prevHover = preEl.querySelector(".code-line-hover-caret");
    if (prevHover) prevHover.remove();

    if ((evt.target as HTMLElement).closest(".copy-button-container")) return;

    const codeText = (codeEl as HTMLElement).innerText || (codeEl as HTMLElement).textContent || '';
    const lines = codeText.replace(/\r\n/g, "\n").split("\n");
    
    console.log('Total lines:', lines.length, 'Lines:', lines);

    let toCopy: string;
    let message: string;

    if (lastHoverLine >= 0 && lastHoverLine < lines.length) {
      // Copy specific line
      let lineContent = lines[lastHoverLine].trim();
      
      // Remove comments from the line
      // Handle different comment styles: //, /* */, #, <!-- -->, --, REM, etc.
      
      // Handle single-line comments (//, #, --, REM)
      if (lineContent.includes('//')) {
        // Remove single-line comment (C, C++, Java, JavaScript, C#, etc.)
        lineContent = lineContent.split('//')[0].trim();
      }
      if (lineContent.includes('#')) {
        // Remove hash comment (Python, Ruby, Shell, Perl, etc.)
        lineContent = lineContent.split('#')[0].trim();
      }
      if (lineContent.includes('--')) {
        // Remove double dash comment (SQL, Lua, etc.)
        // But be careful not to remove valid operators like x--
        const dashIndex = lineContent.indexOf('--');
        if (dashIndex > 0 && !lineContent[dashIndex - 1].match(/[a-zA-Z0-9_]/)) {
          lineContent = lineContent.substring(0, dashIndex).trim();
        }
      }
      
      // Handle multi-line comment blocks
      if (lineContent.includes('/*')) {
        // Remove multi-line comment start (C, C++, Java, JavaScript, CSS, etc.)
        lineContent = lineContent.split('/*')[0].trim();
      }
      if (lineContent.includes('*/')) {
        // Remove multi-line comment end
        const parts = lineContent.split('*/');
        lineContent = parts.length > 1 ? parts[1].trim() : parts[0].trim();
      }
      
      // Handle HTML/XML comments
      if (lineContent.includes('<!--')) {
        lineContent = lineContent.split('<!--')[0].trim();
      }
      if (lineContent.includes('-->')) {
        const parts = lineContent.split('-->');
        lineContent = parts.length > 1 ? parts[1].trim() : parts[0].trim();
      }
      
      // Handle special comment styles
      if (lineContent.toUpperCase().includes('REM ')) {
        // Remove REM comments (BASIC, Batch files)
        const remIndex = lineContent.toUpperCase().indexOf('REM ');
        if (remIndex === 0) {
          lineContent = ''; // Line is just a comment
        } else if (remIndex > 0) {
          lineContent = lineContent.substring(0, remIndex).trim();
        }
      }
      
      // Handle assembly-style comments (;)
      if (lineContent.includes(';')) {
        // Remove semicolon comment (Assembly, INI files, etc.)
        // But be careful with valid semicolons in code
        const semicolonIndex = lineContent.indexOf(';');
        if (semicolonIndex > 0) {
          // Check if it's not inside quotes
          const beforeSemicolon = lineContent.substring(0, semicolonIndex);
          const quoteCount = (beforeSemicolon.match(/"/g) || []).length;
          if (quoteCount % 2 === 0) { // Even number of quotes means semicolon is outside quotes
            lineContent = beforeSemicolon.trim();
          }
        }
      }
      
      // If after removing comments the line is empty, copy the original line
      if (!lineContent) {
        lineContent = lines[lastHoverLine].trim();
      }
      
      toCopy = lineContent;
      message = `Copied line ${lastHoverLine + 1}: "${toCopy}"`;
      console.log('Copying specific line:', lastHoverLine, 'Content:', toCopy);
    } else {
      // Copy entire code block
      toCopy = codeText;
      message = "Copied entire code block";
      console.log('Copying entire block because lastHoverLine is:', lastHoverLine);
    }

    navigator.clipboard.writeText(toCopy)
      .then(() => {
        onToast(message, "success");
        // Flash visual feedback on successful copy
        preEl.classList.add("flash-copied");
        setTimeout(() => preEl.classList.remove("flash-copied"), 600);
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
