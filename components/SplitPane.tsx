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
        className="w-2 h-full cursor-col-resize flex-shrink-0 bg-border-color/50 dark:bg-dark-border-color/50 hover:bg-accent/30 dark:hover:bg-dark-accent/30 transition-colors duration-200 split-pane-divider"
        title="Drag to resize"
      />
      <div style={{ width: `calc(100% - ${dividerPosition}% - 8px)` }} className="h-full overflow-hidden">
        {right}
      </div>
    </div>
  );
};

export default SplitPane;
