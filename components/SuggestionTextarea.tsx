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
    const overlayRef = useRef<HTMLDivElement>(null);
    const [cursorPosition, setCursorPosition] = useState(0);

    // Expose the ref to parent components
    useEffect(() => {
        if (ref && textareaRef.current) {
            if (typeof ref === 'function') {
                ref(textareaRef.current);
            } else {
                (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = textareaRef.current;
            }
        }
    });

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
        dismissSuggestion
    } = useSuggestions({
        isEnabled: suggestionsEnabled,
        noteTitle,
        noteContent: value,
        onAcceptSuggestion: handleAcceptSuggestion
    });

    // Watchdog: ensure suggestions never stall while typing quickly.
    // If no request was issued in the last 400ms while enabled and focused, trigger one.
    const lastReqAtRef = useRef<number>(0);
    const watchdogRef = useRef<number | null>(null);

    const markRequested = useCallback(() => {
        lastReqAtRef.current = performance.now();
    }, []);

    useEffect(() => {
        // start watchdog
        if (watchdogRef.current) cancelAnimationFrame(watchdogRef.current);
        const tick = () => {
            const ta = textareaRef.current;
            const now = performance.now();
            const delta = now - (lastReqAtRef.current || 0);
            if (ta && ta === document.activeElement && suggestionsEnabled && delta > 400) {
                // re-request using current caret
                const pos = ta.selectionStart ?? 0;
                setCursorPosition(pos);
                const before = value.slice(0, pos);
                const after = value.slice(pos);
                requestSuggestion(before, after, pos);
                markRequested();
            }
            watchdogRef.current = requestAnimationFrame(tick);
        };
        watchdogRef.current = requestAnimationFrame(tick);
        return () => {
            if (watchdogRef.current) cancelAnimationFrame(watchdogRef.current);
            watchdogRef.current = null;
        };
    }, [suggestionsEnabled, value, requestSuggestion, markRequested]);

    const requestFromCaret = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        const pos = ta.selectionStart ?? 0;
        setCursorPosition(pos);
        const before = value.slice(0, pos);
        const after = value.slice(pos);
        requestSuggestion(before, after, pos);
        // mark to watchdog
        lastReqAtRef.current = performance.now();
    }, [value, requestSuggestion]);

    const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
        // After value updates, re-request at next frame to pick up new caret
        requestAnimationFrame(() => {
            requestFromCaret();
        });
    }, [onChange, requestFromCaret]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Accept / dismiss
        if (isVisible && currentSuggestion) {
            if (e.key === 'Tab') {
                e.preventDefault();
                acceptSuggestion(currentSuggestion);
                // After accept, re-request to continue flow
                requestAnimationFrame(requestFromCaret);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                dismissSuggestion();
                // After dismiss, re-request for the new context
                requestAnimationFrame(requestFromCaret);
                return;
            }
            if (e.key === 'ArrowRight' && e.ctrlKey) {
                e.preventDefault();
                const [first] = currentSuggestion.split(' ');
                acceptSuggestion(first ? first + ' ' : currentSuggestion);
                requestAnimationFrame(requestFromCaret);
                return;
            }
        }

        // Keep parent handling
        if (onKeyDown) onKeyDown(e);

        // Always update caret and request on next frame to avoid stale value/caret races
        requestAnimationFrame(() => {
            const ta = textareaRef.current;
            if (!ta) return;
            setCursorPosition(ta.selectionStart ?? 0);
            requestFromCaret();
        });
    }, [isVisible, currentSuggestion, acceptSuggestion, dismissSuggestion, onKeyDown, requestFromCaret]);

    const handleSelectionChange = useCallback(() => {
        // Moving selection should update caret and suggestion position
        const ta = textareaRef.current;
        if (!ta) return;
        setCursorPosition(ta.selectionStart ?? 0);
        requestFromCaret();
    }, [requestFromCaret]);

    // Keep overlay scroll in sync
    useEffect(() => {
        const ta = textareaRef.current;
        const ov = overlayRef.current;
        if (!ta || !ov) return;
        const sync = () => {
            ov.scrollTop = ta.scrollTop;
            ov.scrollLeft = ta.scrollLeft;
        };
        sync();
        ta.addEventListener('scroll', sync, { passive: true });
        return () => ta.removeEventListener('scroll', sync);
    }, []);

    // Fixed same-line inline ghost suggestion overlay
    const SameLineOverlay: React.FC = () => {
        const ta = textareaRef.current;
        if (!ta || !isVisible || !currentSuggestion) return null;

        const caretIndex = cursorPosition;
        const textBefore = value.slice(0, caretIndex);
        const textAfter = value.slice(caretIndex);

        // Get computed styles from textarea
        const cs = window.getComputedStyle(ta);
        
        // Base style to match textarea exactly
        const baseStyle: React.CSSProperties = {
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            lineHeight: cs.lineHeight,
            letterSpacing: cs.letterSpacing,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            margin: 0,
            padding: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
        };

        // Wrapper style
        const wrapperStyle: React.CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 1,
        };

        // Inner container to match textarea padding
        const innerStyle: React.CSSProperties = {
            ...baseStyle,
            paddingTop: cs.paddingTop,
            paddingRight: cs.paddingRight,
            paddingBottom: cs.paddingBottom,
            paddingLeft: cs.paddingLeft,
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
        };

        // Check if we need a visual gap
        const lastChar = textBefore.slice(-1);
        const firstSuggestionChar = currentSuggestion.charAt(0);
        const needsGap = lastChar && !/\s/.test(lastChar) && firstSuggestionChar && !/\s/.test(firstSuggestionChar);

        // Mobile tap-to-accept: clicking the ghost should accept suggestion
        const handleGhostTap = (e: React.MouseEvent<HTMLSpanElement>) => {
            // Only on small screens, keep desktop keyboard behavior intact
            if (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) {
                e.preventDefault();
                e.stopPropagation();
                // Call acceptSuggestion from outer scope via closure
                if (currentSuggestion && textareaRef.current) {
                    acceptSuggestion(currentSuggestion);
                    // After accept, request next suggestion at new caret
                    requestAnimationFrame(() => {
                        const ta = textareaRef.current!;
                        const pos = ta.selectionStart ?? 0;
                        setCursorPosition(pos);
                        const before = value.slice(0, pos);
                        const after = value.slice(pos);
                        requestSuggestion(before, after, pos);
                    });
                }
            }
        };

        return (
            <div style={wrapperStyle}>
                <div style={innerStyle}>
                    {/* Invisible text up to cursor position */}
                    <span style={{
                        ...baseStyle,
                        color: 'transparent',
                        userSelect: 'none',
                        position: 'relative'
                    }}>
                        {textBefore}
                    </span>
                    {/* Ghost suggestion appears right after the cursor.
                        On small screens, tapping selects (accepts) it silently without showing native selection handles. */}
                    <span
                        onTouchStart={(e) => {
                            // prevent native selection / context menu / scroll
                            e.preventDefault();
                            e.stopPropagation();
                            handleGhostTap(e as unknown as React.MouseEvent<HTMLSpanElement>);
                        }}
                        onMouseDown={(e) => {
                            // also prevent selection on mouse interactions
                            e.preventDefault();
                            e.stopPropagation();
                            handleGhostTap(e);
                        }}
                        style={{
                            ...baseStyle,
                            color: 'currentColor',
                            opacity: 0.4,
                            // prevent native selection highlight and callout bubbles on mobile
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            WebkitTouchCallout: 'none',
                            // keep minimal visual gap if needed
                            marginLeft: needsGap ? '1px' : '0',
                            position: 'relative',
                            cursor: 'pointer',
                        }}
                    >
                        {currentSuggestion}
                    </span>
                    {/* Invisible text after cursor to maintain layout */}
                    <span style={{
                        ...baseStyle,
                        color: 'transparent',
                        userSelect: 'none',
                        position: 'relative'
                    }}>
                        {textAfter}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full h-full">
            {/* Textarea */}
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
                    height: '100%',
                    position: 'relative',
                    zIndex: 2,
                    background: 'transparent',
                }}
                {...otherProps}
            />

            {/* Overlay for inline, same-line ghost suggestion */}
            <div
                ref={overlayRef}
                className="pointer-events-none absolute inset-0 overflow-auto"
                aria-hidden="true"
                style={{ zIndex: 1 }}
            >
                <SameLineOverlay />
            </div>

            {/* Desktop controls remain for keyboard hints; hide on small screens for minimal mobile UI */}
            <div className="hidden sm:block">
                <InlineSuggestion
                    suggestion={currentSuggestion}
                    isVisible={isVisible}
                    textareaRef={textareaRef}
                    cursorPosition={cursorPosition}
                    onAcceptSuggestion={(s: string) => {
                        acceptSuggestion(s);
                        requestAnimationFrame(requestFromCaret);
                    }}
                    onDismissSuggestion={() => {
                        dismissSuggestion();
                        requestAnimationFrame(requestFromCaret);
                    }}
                />
            </div>

            {/* Loading indicator - hide on small screens to keep UI minimal */}
            {isLoading && (
                <div className="absolute top-2 right-2 pointer-events-none hidden sm:block" style={{ zIndex: 3 }}>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
});

SuggestionTextarea.displayName = 'SuggestionTextarea';

export default SuggestionTextarea;
