import React, { useState, useRef, useCallback, ReactNode } from 'react';

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
}

const SplitPane: React.FC<SplitPaneProps> = ({ left, right }) => {
  const [dividerPosition, setDividerPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

    if (newPosition > 15 && newPosition < 85) { // Keep panes within reasonable bounds
      setDividerPosition(newPosition);
    }
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [onMouseMove, onMouseUp]);

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden split-pane-container">
      <div style={{ width: `${dividerPosition}%` }} className="h-full overflow-hidden">
        {left}
      </div>
      <div 
        onMouseDown={onMouseDown} 
        className="w-4 h-full cursor-col-resize flex-shrink-0 bg-gradient-to-r from-transparent via-border-color/10 to-transparent dark:via-dark-border-color/10 hover:via-accent/20 dark:hover:via-dark-accent/20 transition-all duration-300 split-pane-divider relative group flex items-center justify-center"
        title="Drag to resize"
      >
        {/* Subtle border lines */}
        <div className="absolute left-0 top-0 w-px h-full bg-border-color/20 dark:bg-dark-border-color/20"></div>
        <div className="absolute right-0 top-0 w-px h-full bg-border-color/20 dark:bg-dark-border-color/20"></div>
        
        {/* Central grip indicator */}
        <div className="flex flex-col items-center justify-center space-y-1 opacity-30 group-hover:opacity-70 transition-all duration-300 group-hover:scale-110">
          <div className="w-1 h-1 bg-text-muted dark:bg-dark-text-muted rounded-full shadow-sm"></div>
          <div className="w-1 h-1 bg-text-muted dark:bg-dark-text-muted rounded-full shadow-sm"></div>
          <div className="w-1 h-1 bg-text-muted dark:bg-dark-text-muted rounded-full shadow-sm"></div>
        </div>
        
        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent dark:via-dark-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm"></div>
      </div>
      <div style={{ width: `calc(100% - ${dividerPosition}% - 16px)` }} className="h-full overflow-hidden">
        {right}
      </div>
    </div>
  );
};

export default SplitPane;
