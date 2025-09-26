import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { FaExpand, FaCompress, FaDownload, FaCopy, FaSearchPlus, FaSearchMinus, FaRedo } from 'react-icons/fa';

interface MermaidRendererProps {
  content: string;
  className?: string;
  onError?: (error: string) => void;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ 
  content, 
  className = '', 
  onError 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagramId, setDiagramId] = useState<string>('');

  // Initialize Mermaid with enhanced configuration
  useEffect(() => {
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
      gantt: {
        leftPadding: 75,
        gridLineStartPadding: 35,
        fontSize: 11,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      },
      journey: {
        diagramMarginX: 50,
        diagramMarginY: 10,
      }
    });
  }, []);

  // Render the diagram
  const renderDiagram = useCallback(async () => {
    if (!content.trim() || !containerRef.current) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setDiagramId(id);

      // Clear container
      containerRef.current.innerHTML = '';

      // Render the diagram
      const { svg, bindFunctions } = await mermaid.render(id, content.trim());
      
      // Create a container div and insert the SVG
      const svgContainer = document.createElement('div');
      svgContainer.className = 'mermaid-svg-container';
      svgContainer.innerHTML = svg;
      
      const svgElement = svgContainer.querySelector('svg') as SVGElement;
      if (svgElement) {
        svgRef.current = svgElement;
        
        // Make SVG responsive
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        svgElement.style.width = '100%';
        svgElement.style.height = 'auto';
        svgElement.style.maxWidth = '100%';
        svgElement.style.display = 'block';
        
        // Apply scale
        if (scale !== 1) {
          svgElement.style.transform = `scale(${scale})`;
          svgElement.style.transformOrigin = 'top left';
        }
        
        containerRef.current.appendChild(svgContainer);
        
        // Bind any interactive functions
        if (bindFunctions) {
          bindFunctions(svgContainer);
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
      console.warn('Mermaid render error:', err);
    }
  }, [content, scale, onError]);

  // Re-render when content or scale changes
  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
  }, []);

  // Handle fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle export as SVG
  const handleExportSvg = useCallback(() => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mermaid-diagram-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Handle copy SVG to clipboard
  const handleCopySvg = useCallback(async () => {
    if (!svgRef.current) return;
    
    try {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      await navigator.clipboard.writeText(svgData);
    } catch (err) {
      console.warn('Failed to copy SVG to clipboard:', err);
    }
  }, []);

  // Close fullscreen on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  const ToolbarButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    disabled?: boolean;
  }> = ({ onClick, icon, title, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );

  const renderContent = () => (
    <div className={`mermaid-renderer ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Diagram Controls
          </span>
          {scale !== 1 && (
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
              {Math.round(scale * 100)}%
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={handleZoomOut}
            icon={<FaSearchMinus className="w-3 h-3" />}
            title="Zoom Out"
            disabled={scale <= 0.25}
          />
          
          <ToolbarButton
            onClick={handleResetZoom}
            icon={<FaRedo className="w-3 h-3" />}
            title="Reset Zoom"
            disabled={scale === 1}
          />
          
          <ToolbarButton
            onClick={handleZoomIn}
            icon={<FaSearchPlus className="w-3 h-3" />}
            title="Zoom In"
            disabled={scale >= 3}
          />
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          <ToolbarButton
            onClick={handleCopySvg}
            icon={<FaCopy className="w-3 h-3" />}
            title="Copy SVG"
            disabled={!svgRef.current}
          />
          
          <ToolbarButton
            onClick={handleExportSvg}
            icon={<FaDownload className="w-3 h-3" />}
            title="Download SVG"
            disabled={!svgRef.current}
          />
          
          <ToolbarButton
            onClick={handleToggleFullscreen}
            icon={isFullscreen ? <FaCompress className="w-3 h-3" /> : <FaExpand className="w-3 h-3" />}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          />
        </div>
      </div>

      {/* Diagram Container */}
      <div className="relative">
        {isLoading && (
          <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full mr-2"></div>
            Rendering diagram...
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-red-700 dark:text-red-300 font-medium mb-2">
              Failed to render diagram
            </div>
            <div className="text-sm text-red-600 dark:text-red-400 font-mono">
              {error}
            </div>
          </div>
        )}
        
        <div
          ref={containerRef}
          className="mermaid-container overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4
                     min-h-[200px] max-h-[600px] resize-y"
          style={{ display: isLoading || error ? 'none' : 'block' }}
        />
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="w-full h-full max-w-7xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col">
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  return renderContent();
};

export default MermaidRenderer;