import React, { useRef, useEffect, useCallback, useState } from 'react';
import InlineSuggestion from './SuggestionBox';
import { useSuggestions } from '../hooks/useSuggestions';

interface SuggestionTextareaProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    className?: string;
    placeholder?: string;
    noteTitle?: string;
    suggestionsEnabled?: boolean;
    [key: string]: any; // For other textarea props
}

const SuggestionTextarea = React.forwardRef<HTMLTextAreaElement, SuggestionTextareaProps>((
    {
        value,
        onChange,
        onKeyDown,
        className,
        placeholder,
        noteTitle,
        suggestionsEnabled = true,
        ...otherProps
    },
    ref
) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Expose the ref to parent components
    useEffect(() => {
        if (ref && textareaRef.current) {
            if (typeof ref === 'function') {
                ref(textareaRef.current);
            } else {
                ref.current = textareaRef.current;
            }
        }
    });
    const overlayRef = useRef<HTMLDivElement>(null);
    const [cursorPosition, setCursorPosition] = useState(0);

    const handleAcceptSuggestion = useCallback((suggestion: string) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        const newValue = value.slice(0, start) + suggestion + value.slice(end);
        onChange(newValue);
        
        // Set cursor position after the inserted suggestion
        const newCursorPos = start + suggestion.length;
        setTimeout(() => {
            if (textarea) {
                textarea.focus();
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                setCursorPosition(newCursorPos);
            }
        }, 0);
    }, [value, onChange]);

    const {
        currentSuggestion,
        isLoading,
        isVisible,
        requestSuggestion,
        acceptSuggestion,
        dismissSuggestion,
        clearSuggestion
    } = useSuggestions({
        isEnabled: suggestionsEnabled,
        noteTitle,
        noteContent: value,
        onAcceptSuggestion: handleAcceptSuggestion
    });

    const updateCursorPosition = useCallback(() => {
        if (!textareaRef.current) return;
        
        const textarea = textareaRef.current;
        const position = textarea.selectionStart;
        setCursorPosition(position);
        
        // Request suggestion based on current cursor position
        const textBefore = value.slice(0, position);
        const textAfter = value.slice(position);
        
        requestSuggestion(textBefore, textAfter, position);
    }, [value, requestSuggestion]);

    const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        
        // Clear suggestions when user types over them
        if (isVisible) {
            clearSuggestion();
        }
        
        // Update cursor position and potentially request new suggestions
        setTimeout(() => {
            updateCursorPosition();
        }, 0);
    }, [onChange, isVisible, clearSuggestion, updateCursorPosition]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Handle suggestion acceptance
        if (isVisible && currentSuggestion) {
            switch (e.key) {
                case 'Tab':
                    e.preventDefault();
                    acceptSuggestion(currentSuggestion);
                    return;
                case 'Escape':
                    e.preventDefault();
                    dismissSuggestion();
                    return;
                case 'ArrowRight':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        const words = currentSuggestion.split(' ');
                        if (words.length > 0) {
                            acceptSuggestion(words[0] + ' ');
                        }
                        return;
                    }
                    break;
            }
        }
        
        // Clear suggestions on various navigation keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
            clearSuggestion();
        }
        
        // Call original onKeyDown if provided
        if (onKeyDown) {
            onKeyDown(e);
        }
        
        // Update cursor position after key handling
        setTimeout(() => {
            updateCursorPosition();
        }, 0);
    }, [isVisible, currentSuggestion, acceptSuggestion, dismissSuggestion, clearSuggestion, onKeyDown, updateCursorPosition]);

    const handleSelectionChange = useCallback(() => {
        if (isVisible) {
            clearSuggestion();
        }
        updateCursorPosition();
    }, [isVisible, clearSuggestion, updateCursorPosition]);

    // Calculate suggestion position to flow naturally to next line
    const getSuggestionPosition = useCallback(() => {
        if (!textareaRef.current) {
            return { top: 0, left: 0 };
        }

        const textarea = textareaRef.current;
        const styles = window.getComputedStyle(textarea);
        
        // Get text before cursor
        const textBeforeCursor = value.slice(0, cursorPosition);
        
        // Count lines to estimate vertical position
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        const lineHeight = parseInt(styles.lineHeight) || 24;
        const fontSize = parseInt(styles.fontSize) || 14;
        const padding = parseInt(styles.paddingLeft) || 16;
        const paddingTop = parseInt(styles.paddingTop) || 16;

        // More accurate character width estimation for monospace
        const charWidth = fontSize * 0.6;
        const textareaWidth = textarea.clientWidth - padding * 2;

        // Calculate how many characters fit per line
        const charsPerLine = Math.floor(textareaWidth / charWidth);

        // Handle wrapping based on width
        const wrapLines = Math.floor(currentLine.length / charsPerLine);
        const currentLinePosition = currentLine.length % charsPerLine;
        const wrapOffset = currentLinePosition * charWidth;
        
        // Check if we're near the end of the line and should wrap to next line
        const remainingCharsOnLine = charsPerLine - currentLinePosition;
        const shouldWrapToNextLine = remainingCharsOnLine < 15; // Less than 15 chars remaining
        
        if (shouldWrapToNextLine) {
            // Move to next line
            return {
                top: ((lines.length - 1 + wrapLines + 1) * lineHeight) + paddingTop,
                left: padding
            };
        }

        return {
            top: ((lines.length - 1 + wrapLines) * lineHeight) + paddingTop,
            left: wrapOffset + padding
        };
    }, [value, cursorPosition]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const handleClick = () => updateCursorPosition();
        const handleFocus = () => updateCursorPosition();
        
        textarea.addEventListener('click', handleClick);
        textarea.addEventListener('focus', handleFocus);
        
        return () => {
            textarea.removeEventListener('click', handleClick);
            textarea.removeEventListener('focus', handleFocus);
        };
    }, [updateCursorPosition]);

    const suggestionPosition = getSuggestionPosition();

    return (
        <div className="relative w-full h-full">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onSelect={handleSelectionChange}
                className={className}
                placeholder={placeholder}
                style={{
                    ...otherProps.style,
                    minHeight: '100%',
                    height: '100%'
                }}
                {...otherProps}
            />
            
            {/* Overlay for positioning suggestions */}
            <div
                ref={overlayRef}
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                    width: '100%',
                    minHeight: '100%',
                    overflow: 'visible'
                }}
            >
                {isVisible && currentSuggestion && (
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            top: suggestionPosition.top + 'px',
                            left: suggestionPosition.left + 'px',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            lineHeight: 'inherit',
                            zIndex: 1000
                        }}
                    >
                        <div 
                            className="text-gray-400 dark:text-gray-500 font-mono"
                            style={{
                                width: `${(textareaRef.current?.clientWidth || 0) - suggestionPosition.left - 20}px`,
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap',
                                overflow: 'visible'
                            }}
                        >
                            {currentSuggestion}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Mobile-friendly suggestion controls */}
            {isVisible && currentSuggestion && (
                <div className="absolute bottom-2 right-2 sm:hidden z-50 flex gap-2">
                    <button
                        onClick={() => acceptSuggestion(currentSuggestion)}
                        className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md shadow-lg hover:bg-blue-600 transition-colors touch-manipulation"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        ✓ Accept
                    </button>
                    <button
                        onClick={dismissSuggestion}
                        className="px-3 py-2 bg-gray-500 text-white text-sm rounded-md shadow-lg hover:bg-gray-600 transition-colors touch-manipulation"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        ✕ Dismiss
                    </button>
                </div>
            )}
            
            {/* Desktop suggestion controls */}
            <InlineSuggestion
                suggestion={currentSuggestion}
                isVisible={isVisible}
                textareaRef={textareaRef}
                cursorPosition={cursorPosition}
                onAcceptSuggestion={acceptSuggestion}
                onDismissSuggestion={dismissSuggestion}
            />
            
            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute top-2 right-2 pointer-events-none">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
});

export default SuggestionTextarea;
