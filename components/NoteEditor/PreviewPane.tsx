import React, { useEffect, useState, useRef } from "react";
import {
  FaTag,
  FaDownload,
  FaRegTrashCan,
  FaCopy,
  FaExpand,
  FaMagnifyingGlassPlus,
} from "react-icons/fa6";
import { FaMagic } from "react-icons/fa";
import { MdShare } from "react-icons/md";
import { PreviewPaneProps } from "./types";
import { LoadingSpinner } from "./UIElements";
import SelectionNavigator from "../SelectionNavigator";
import { versionControlService } from "../../services/versionControlService";
import { MermaidDiagram } from "./types";

// Component to render markdown with embedded Mermaid diagrams
const MarkdownWithDiagrams: React.FC<{
  renderedMarkdown: string;
  mermaidDiagrams: MermaidDiagram[];
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  onMouseUp?: (e: React.MouseEvent<HTMLDivElement>) => void;
}> = ({ renderedMarkdown, mermaidDiagrams, id, className, style, onMouseUp }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  useEffect(() => {
    if (!containerRef.current || mermaidDiagrams.length === 0) return;

    const processPlaceholders = async () => {
      // Import mermaid dynamically
      const mermaid = await import('mermaid').then(m => m.default);
      
      // Initialize mermaid
      const isDark = document.documentElement.classList.contains('dark');
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: 16,
        themeVariables: isDark ? {
          primaryColor: '#1f2937',
          primaryTextColor: '#f9fafb',
          primaryBorderColor: '#4b5563',
          lineColor: '#6b7280',
          secondaryColor: '#374151',
          tertiaryColor: '#111827',
          background: '#1f2937',
          mainBkg: '#1f2937',
          secondBkg: '#374151',
          tertiaryBkg: '#111827',
        } : {
          primaryColor: '#ffffff',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#d1d5db',
          lineColor: '#6b7280',
          secondaryColor: '#f3f4f6',
          tertiaryColor: '#e5e7eb',
          background: '#ffffff',
          mainBkg: '#ffffff',
          secondBkg: '#f9fafb',
          tertiaryBkg: '#f3f4f6',
        },
        flowchart: { 
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis',
          padding: 20,
        },
        sequence: { 
          diagramMarginX: 50,
          diagramMarginY: 10,
          actorMargin: 50,
          width: 150,
          height: 65,
          boxMargin: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35,
        },
      });

      // Process each diagram
      for (const diagram of mermaidDiagrams) {
        const placeholder = containerRef.current!.querySelector(`[data-diagram-id="${diagram.id}"]`);
        if (placeholder && placeholder.parentNode) {
          try {
            // Create unique ID for mermaid
            const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Render the diagram
            const { svg } = await mermaid.render(uniqueId, diagram.code.trim());
            
            // Create container
            const mermaidContainer = document.createElement('div');
            mermaidContainer.className = 'mermaid-renderer my-4 w-full max-w-xl mx-auto';
            
            // Create the main container
            const compactDiv = document.createElement('div');
            compactDiv.className = 'mermaid-compact-container bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group relative';
            compactDiv.style.cssText = 'padding: 16px; max-height: 300px; overflow: hidden;';
            
            // Create SVG wrapper
            const svgWrapper = document.createElement('div');
            svgWrapper.className = 'mermaid-svg-wrapper';
            svgWrapper.style.cssText = 'width: 100%; height: auto; display: flex; justify-content: center; align-items: center;';
            svgWrapper.innerHTML = svg;
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'absolute inset-0 bg-gradient-to-t from-white/15 to-transparent dark:from-gray-900/15 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity';
            
            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/95 dark:bg-gray-800/95 px-2 py-1 rounded shadow-sm border border-gray-200/50 dark:border-gray-600/50 flex items-center';
            console.log('Creating tooltip with icon and text...');
            
            // Create icon using a simpler approach
            const icon = document.createElement('span');
            icon.innerHTML = '🔍'; // Using magnifying glass emoji for now to ensure visibility
            icon.style.fontSize = '12px';
            icon.style.marginRight = '4px';
            
            const text = document.createTextNode('Click to expand');
            tooltip.appendChild(icon);
            tooltip.appendChild(text);
            
            overlay.appendChild(tooltip);
            compactDiv.appendChild(svgWrapper);
            compactDiv.appendChild(overlay);
            mermaidContainer.appendChild(compactDiv);
            
            // Add event listeners
            const compactContainer = mermaidContainer.querySelector('.mermaid-compact-container');
            const svgElement = svgWrapper.querySelector('svg'); // Get SVG from wrapper, not from entire container
            
            // Function to expand diagram to fullscreen
            const expandDiagram = () => {
              if (!svgElement) return;
              
              // Create fullscreen overlay
              const overlay = document.createElement('div');
              overlay.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4';
              
              const container = document.createElement('div');
              container.className = 'w-full h-full max-w-[98vw] max-h-[98vh] sm:max-w-[95vw] sm:max-h-[95vh] bg-white dark:bg-gray-900 rounded-none sm:rounded-lg shadow-2xl overflow-hidden flex flex-col';
              container.style.minHeight = 'auto';
              
              const header = document.createElement('div');
              header.className = 'flex-shrink-0 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800';
              header.innerHTML = `
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span class="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">Mermaid Diagram</span>
                </div>
                <button class="close-fullscreen p-1.5 sm:p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 touch-manipulation">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
              `;
              
              const content = document.createElement('div');
              content.className = 'flex-1 p-2 sm:p-4 md:p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-auto';
              content.style.minHeight = '0'; // Allow flex shrinking
              
              const svgContainer = document.createElement('div');
              svgContainer.className = 'w-full h-full flex items-center justify-center';
              svgContainer.style.maxWidth = '100%';
              svgContainer.style.maxHeight = '100%';
              
              const clonedSvg = svgElement.cloneNode(true) as SVGElement;
              clonedSvg.removeAttribute('width');
              clonedSvg.removeAttribute('height');
              clonedSvg.style.width = 'auto';
              clonedSvg.style.height = 'auto';
              clonedSvg.style.maxWidth = '100%';
              clonedSvg.style.maxHeight = '100%';
              clonedSvg.style.objectFit = 'contain';
              clonedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
              
              svgContainer.appendChild(clonedSvg);
              content.appendChild(svgContainer);
              
              // Calculate optimal size after DOM insertion
              setTimeout(() => {
                const containerRect = content.getBoundingClientRect();
                const isMobile = window.innerWidth < 640; // sm breakpoint
                const padding = isMobile ? 16 : 48; // Less padding on mobile
                const availableWidth = containerRect.width - padding;
                const availableHeight = containerRect.height - padding;
                
                // Get SVG dimensions
                const svgRect = clonedSvg.getBoundingClientRect();
                if (svgRect.width > 0 && svgRect.height > 0) {
                  const scaleX = availableWidth / svgRect.width;
                  const scaleY = availableHeight / svgRect.height;
                  // On mobile, allow more scaling, on desktop limit to 1.5x
                  const maxScale = isMobile ? 2.5 : 1.5;
                  const scale = Math.min(scaleX, scaleY, maxScale);
                  
                  // On mobile, apply scaling even if smaller to ensure visibility
                  const minScale = isMobile ? 0.6 : 0.8;
                  if (scale > minScale || isMobile) {
                    clonedSvg.style.transform = `scale(${scale})`;
                    clonedSvg.style.transformOrigin = 'center';
                  }
                }
              }, 100);
              
              container.appendChild(header);
              container.appendChild(content);
              overlay.appendChild(container);
              
              // Close handlers
              const closeFullscreen = () => {
                document.body.removeChild(overlay);
              };
              
              header.querySelector('.close-fullscreen')?.addEventListener('click', closeFullscreen);
              overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeFullscreen();
              });
              
              document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                  closeFullscreen();
                  document.removeEventListener('keydown', escHandler);
                }
              });
              
              document.body.appendChild(overlay);
            };
            
            // Make entire diagram clickable
            if (compactContainer) {
              compactContainer.addEventListener('click', expandDiagram);
            }
            
            // Make SVG responsive and properly sized
            if (svgElement) {
              svgElement.removeAttribute('width');
              svgElement.removeAttribute('height');
              svgElement.style.width = '100%';
              svgElement.style.height = 'auto';
              svgElement.style.maxWidth = '100%';
              svgElement.style.maxHeight = '250px';
              svgElement.style.display = 'block';
              svgElement.style.margin = '0 auto';
              
              // Ensure the SVG scales properly
              if (!svgElement.hasAttribute('viewBox')) {
                const bbox = svgElement.getBBox?.();
                if (bbox) {
                  svgElement.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
                }
              }
              
              // Set preserveAspectRatio for better scaling
              svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
            
            // Replace placeholder
            placeholder.parentNode.replaceChild(mermaidContainer, placeholder);
            
          } catch (error) {
            console.warn(`Failed to render Mermaid diagram ${diagram.id}:`, error);
            // Show error message in place of diagram
            const errorContainer = document.createElement('div');
            errorContainer.className = 'my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg';
            errorContainer.innerHTML = `
              <div class="text-red-700 dark:text-red-300 font-medium mb-2">Failed to render Mermaid diagram</div>
              <div class="text-sm text-red-600 dark:text-red-400 font-mono">${error instanceof Error ? error.message : 'Unknown error'}</div>
            `;
            placeholder.parentNode.replaceChild(errorContainer, placeholder);
          }
        }
      }
    };

    processPlaceholders();
  }, [renderedMarkdown, mermaidDiagrams]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      style={style}
      onMouseUp={onMouseUp}
    >
      <div dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
    </div>
  );
};

const PreviewPane: React.FC<PreviewPaneProps> = ({
  activeNote,
  renderedMarkdown,
  mermaidDiagrams,
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
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-dark-text-primary break-words flex-1">
              {activeNote.title || "Untitled Note"}
            </h1>
            {/* Version indicator */}
            {(() => {
              // Use the note's version property instead of calculating from version history
              const currentVersion = activeNote.version || 0;
              return currentVersion > 0 ? (
                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-mono font-semibold border border-blue-200 dark:border-blue-700">
                    v{currentVersion}
                  </span>
                </div>
              ) : null;
            })()}
          </div>
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
        <MarkdownWithDiagrams
          id="preview-content"
          className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none w-full"
          style={{ userSelect: "text", cursor: "text" }}
          onMouseUp={onPreviewSelection}
          renderedMarkdown={renderedMarkdown}
          mermaidDiagrams={mermaidDiagrams}
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
         prev.mermaidDiagrams === next.mermaidDiagrams &&
         prev.activeNote === next.activeNote &&
         prev.selectionNavigator === next.selectionNavigator &&
         prev.isSuggestingTags === next.isSuggestingTags &&
         prev.isSummarizing === next.isSummarizing &&
         prev.suggestedTags === next.suggestedTags;
}

export default React.memo(PreviewPane, areEqual);
