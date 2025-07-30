import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

// Lazy-initialize the AI client to avoid crashing on load
const getAiClient = () => {
    if (!ai) {
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            throw new Error("VITE_GEMINI_API_KEY environment variable not set. Please configure it to use AI features.");
        }
        ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    }
    return ai;
};

export interface SuggestionRequest {
    textBefore: string;
    textAfter: string;
    cursorPosition: number;
    noteContext?: string;
    noteTitle?: string;
}

export const generateTextSuggestion = async (request: SuggestionRequest): Promise<string> => {
    const { textBefore, textAfter, noteTitle, noteContext } = request;
    
    console.log('🤖 AI Suggestion Request:', { textBefore: textBefore.slice(-50), textAfter: textAfter.slice(0, 20) });
    
    // Don't suggest if we're in the middle of a word or if there's very little context
    if (textBefore.trim().length < 3) {
        console.log('🤖 Skipping suggestion: text too short');
        return "";
    }

    // Don't suggest if cursor is in the middle of a word
    const lastChar = textBefore.slice(-1);
    const nextChar = textAfter.slice(0, 1);
    if (lastChar && /\w/.test(lastChar) && nextChar && /\w/.test(nextChar)) {
        return "";
    }

    try {
        const client = getAiClient();
        
        // Create context-aware prompt
        let prompt = `You are a writing assistant that provides text completion suggestions. Given the context, provide a natural continuation of the text.

Rules:
- Provide ONLY the suggested text continuation, no explanations
- Keep suggestions concise (1-3 sentences max)
- Match the writing style and tone of the existing text
- If the text seems to be ending naturally, don't suggest anything
- For markdown content, maintain proper formatting
- Don't repeat what's already written
- Return empty string if no good suggestion is possible

`;

        if (noteTitle) {
            prompt += `Note title: "${noteTitle}"\n`;
        }

        if (noteContext && noteContext !== textBefore) {
            prompt += `Full note context:\n${noteContext}\n\n`;
        }

        prompt += `Text before cursor:\n"${textBefore.slice(-200)}"`;  // Last 200 chars for context
        
        if (textAfter.trim()) {
            prompt += `\n\nText after cursor:\n"${textAfter.slice(0, 100)}"`;  // Next 100 chars for context
        }

        prompt += `\n\nSuggested continuation:`;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster response
                temperature: 0.7,
                maxOutputTokens: 100, // Keep suggestions short
            }
        });

        if (!response.text) {
            return "";
        }

        let suggestion = response.text.trim();
        
        // Clean up the suggestion
        suggestion = suggestion
            .replace(/^["']|["']$/g, '') // Remove quotes at start/end
            .replace(/^\s*[-*]\s*/, '') // Remove bullet points at start
            .trim();

        // Don't suggest if it's just repeating existing content
        if (textBefore.toLowerCase().includes(suggestion.toLowerCase())) {
            return "";
        }

        return suggestion;

    } catch (error) {
        console.error("Error generating text suggestion:", error);
        return "";
    }
};

// Cache to store recent suggestions to avoid repeated API calls
const suggestionCache = new Map<string, { suggestion: string; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export const getCachedSuggestion = (cacheKey: string): string | null => {
    const cached = suggestionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.suggestion;
    }
    if (cached) {
        suggestionCache.delete(cacheKey);
    }
    return null;
};

export const setCachedSuggestion = (cacheKey: string, suggestion: string): void => {
    suggestionCache.set(cacheKey, { suggestion, timestamp: Date.now() });
};

export const generateCacheKey = (textBefore: string, textAfter: string): string => {
    // Create a cache key based on the last 50 characters before cursor
    const beforeKey = textBefore.slice(-50);
    const afterKey = textAfter.slice(0, 20);
    return `${beforeKey}|${afterKey}`;
};
