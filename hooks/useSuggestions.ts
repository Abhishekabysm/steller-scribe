import { useState, useCallback, useRef, useEffect } from 'react';
import {
    generateTextSuggestion,
    getCachedSuggestion,
    setCachedSuggestion,
    generateCacheKey,
    SuggestionRequest
} from '../services/suggestionService';

interface UseSuggestionsProps {
    isEnabled: boolean;
    noteTitle?: string;
    noteContent: string;
    onAcceptSuggestion: (suggestion: string) => void;
}

export const useSuggestions = ({
    isEnabled,
    noteTitle,
    noteContent,
    onAcceptSuggestion
}: UseSuggestionsProps) => {
    const [currentSuggestion, setCurrentSuggestion] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState<boolean>(false);
    
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastRequestRef = useRef<string>('');
    const abortControllerRef = useRef<AbortController | null>(null);

    const DEBOUNCE_DELAY = 300; // 300ms debounce for faster response
    const MIN_CHARS_FOR_SUGGESTION = 3; // Lowered to 3 characters

    const clearSuggestion = useCallback(() => {
        setCurrentSuggestion('');
        setIsVisible(false);
        setIsLoading(false);
        
        // Clear any pending requests
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }
        
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const requestSuggestion = useCallback(async (
        textBefore: string,
        textAfter: string,
        cursorPosition: number
    ) => {
        if (!isEnabled) {
            return;
        }

        // debug logs removed

        // Clear any existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Create a unique request identifier
        const requestId = `${textBefore.slice(-50)}|${cursorPosition}|${textAfter.slice(0, 20)}`;
        
        // Don't make duplicate requests
        if (requestId === lastRequestRef.current) {
            return;
        }

        // Clear previous suggestion immediately for new requests
        setCurrentSuggestion('');
        setIsVisible(false);

        // Basic validation
        if (textBefore.trim().length < MIN_CHARS_FOR_SUGGESTION) {
            return;
        }

        // Don't suggest if we're in the middle of a word
        const lastChar = textBefore.slice(-1);
        const nextChar = textAfter.slice(0, 1);
        // debug logs removed
        
        if (lastChar && /\w/.test(lastChar) && nextChar && /\w/.test(nextChar)) {
            return;
        }

        // Check cache first
        const cacheKey = generateCacheKey(textBefore, textAfter);
        const cachedSuggestion = getCachedSuggestion(cacheKey);
        
        if (cachedSuggestion) {
            setCurrentSuggestion(cachedSuggestion);
            setIsVisible(true);
            lastRequestRef.current = requestId;
            return;
        }

        // Debounce the API request
        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                setIsLoading(true);
                
                // Create abort controller for this request
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
                abortControllerRef.current = new AbortController();

                const request: SuggestionRequest = {
                    textBefore,
                    textAfter,
                    cursorPosition,
                    noteContext: noteContent,
                    noteTitle: noteTitle
                };

                const suggestion = await generateTextSuggestion(request);
                
                // Only set suggestion if this is still the latest request
                if (requestId === lastRequestRef.current || !lastRequestRef.current) {
                    if (suggestion && suggestion.trim()) {
                        setCurrentSuggestion(suggestion);
                        setIsVisible(true);
                        setCachedSuggestion(cacheKey, suggestion);
                    } else {
                        setCurrentSuggestion('');
                        setIsVisible(false);
                    }
                }
            } catch (error) {
                console.error('Error generating suggestion:', error);
                setCurrentSuggestion('');
                setIsVisible(false);
            } finally {
                setIsLoading(false);
            }
        }, DEBOUNCE_DELAY);

        lastRequestRef.current = requestId;
    }, [isEnabled, noteContent, noteTitle]);

    const acceptSuggestion = useCallback((suggestion: string) => {
        onAcceptSuggestion(suggestion);
        clearSuggestion();
    }, [onAcceptSuggestion, clearSuggestion]);

    const dismissSuggestion = useCallback(() => {
        clearSuggestion();
    }, [clearSuggestion]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        currentSuggestion,
        isLoading,
        isVisible,
        requestSuggestion,
        acceptSuggestion,
        dismissSuggestion,
        clearSuggestion
    };
};
