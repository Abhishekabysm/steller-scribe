import React, { useEffect, useRef } from 'react';

interface InlineSuggestionProps {
    suggestion: string;
    isVisible: boolean;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    cursorPosition: number;
    onAcceptSuggestion: (suggestion: string) => void;
    onDismissSuggestion: () => void;
}

const InlineSuggestion: React.FC<InlineSuggestionProps> = ({
    suggestion,
    isVisible,
    textareaRef,
    cursorPosition,
    onAcceptSuggestion,
    onDismissSuggestion
}) => {
    const suggestionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isVisible || !suggestion) return;

            switch (e.key) {
                case 'Tab':
                    e.preventDefault();
                    onAcceptSuggestion(suggestion);
                    break;
                case 'Escape':
                    e.preventDefault();
                    onDismissSuggestion();
                    break;
                case 'ArrowRight':
                    // Accept suggestion word by word with Ctrl+Right Arrow
                    if (e.ctrlKey) {
                        e.preventDefault();
                        const words = suggestion.split(' ');
                        if (words.length > 0) {
                            onAcceptSuggestion(words[0] + ' ');
                        }
                    }
                    break;
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isVisible, suggestion, onAcceptSuggestion, onDismissSuggestion]);

    if (!isVisible || !suggestion) {
        return null;
    }

    // This component now only handles keyboard events, no UI rendering
    return null;
};

export default InlineSuggestion;
