
import { GoogleGenAI, Type } from "@google/genai";
import { AITextAction } from '../types';

let ai: GoogleGenAI | null = null;

// Lazy-initialize the AI client to avoid crashing on load
const getAiClient = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            // This error will now only be thrown if the user tries to use an AI feature
            // without a configured API key, instead of on app startup.
            throw new Error("API_KEY environment variable not set. Please configure it to use AI features.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

export const summarizeText = async (text: string): Promise<string> => {
    if (!text || text.trim().length < 20) {
        return "Please provide more content to generate a meaningful summary.";
    }

    try {
        const client = getAiClient();
        const prompt = `Please provide a concise, one-paragraph summary of the following text:\n\n---\n\n${text}`;
        
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                // Disable thinking for faster summary response
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        return response.text || "Failed to generate summary - empty response from AI";
    } catch (error) {
        console.error("Error summarizing text with Gemini:", error);
        if (error instanceof Error) {
            return `An error occurred while generating the summary: ${error.message}`;
        }
        return "An unknown error occurred while generating the summary.";
    }
};

export const suggestTagsForText = async (text: string): Promise<string[]> => {
    if (!text || text.trim().length < 10) {
        return [];
    }
    
    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following note content, suggest 3-5 relevant, single-word or two-word tags in lowercase. Note content:\n\n---\n\n${text}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tags: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: 'A relevant tag for the note.'
                            }
                        }
                    }
                }
            }
        });
        
        if (!response.text) return [];
        try {
            const jsonResponse = JSON.parse(response.text);
            return jsonResponse.tags || [];
        } catch {
            return [];
        }
    } catch (error) {
        console.error("Error suggesting tags with Gemini:", error);
        // Don't bother the user with an error, just return an empty array.
        return [];
    }
}

export const generateNoteContent = async (
    topic: string,
    language: string,
    contentStyle?: string | null,
    contentLength?: string | null
): Promise<string> => {
    if (!topic || topic.trim().length === 0) {
        return "Please provide a topic to generate a note.";
    }

    try {
        const client = getAiClient();
        let prompt = `Generate a well-structured and comprehensive note about "${topic}". The note should be written in ${language}. It must be in Markdown format. Include a main title (as a H1, e.g., # Title), several sections with headings (as H2s, e.g., ## Section), use bullet points or numbered lists for details, and emphasize key terms using bold text.`;

        if (contentStyle) {
            prompt += ` The content style should be ${contentStyle}.`;
        }
        if (contentLength) {
            prompt += ` The content should be ${contentLength} in length.`;
        }

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        if (!response.text) {
            throw new Error("Failed to generate note - empty response from AI");
        }
        return response.text;
    } catch (error) {
        console.error("Error generating note content with Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`An error occurred while generating the note: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the note.");
    }
};

export const performTextAction = async (text: string, action: AITextAction, language: string = 'Spanish'): Promise<string> => {
    if (!text || !text.trim()) {
        throw new Error("No text selected to perform action on.");
    }

    try {
        const client = getAiClient();
        let prompt = '';

        switch (action) {
            case 'improve':
                prompt = `Rewrite the following text to improve its clarity, flow, and engagement. Keep the original meaning intact. Only output the improved text.\n\nText: "${text}"`;
                break;
            case 'fix-grammar':
                prompt = `Correct any spelling and grammatical errors in the following text. Only output the corrected text.\n\nText: "${text}"`;
                break;
            case 'shorten':
                prompt = `Make the following text more concise. Remove any filler words or redundant phrases without losing the core message. Only output the shortened text.\n\nText: "${text}"`;
                break;
            case 'translate':
                prompt = `Translate the following text into ${language}. Only output the translated text.\n\nText: "${text}"`;
                break;
            case 'beautify':
                prompt = `Reformat and enhance the following text to be clean, well-structured, and visually appealing. Use proper Markdown formatting, including appropriate headings (H1, H2, H3), bullet points or numbered lists, bold text, and code blocks for any code snippets. Ensure clarity, flow, and conciseness. Only output the reformatted text.\n\nText: "${text}"`;
                break;
            case 'modify-expand':
                // Here, 'language' parameter is repurposed to carry the user's instructions
                prompt = `Given the following text: "${text}", please modify or expand it according to these instructions: "${language}". Only output the modified/expanded text.`;
                break;
            default:
                throw new Error("Invalid AI text action.");
        }

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        if (!response.text) {
            throw new Error("Failed to perform action - empty response from AI");
        }
        return response.text.trim();
    } catch (error) {
        console.error(`Error performing AI text action "${action}":`, error);
        if (error instanceof Error) {
            throw new Error(`AI action failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred while performing the AI action.");
    }
};

/**
 * Generate a concise title (5 words or less) for given note content.
 * Returns 'Untitled Note' if the content is too short or on error.
 */
export const generateTitle = async (text: string): Promise<string> => {
    if (!text || text.trim().length < 20) {
        // too little context → fallback
        return "Untitled Note";
    }
    
    try {
        const client = getAiClient();
        const prompt = `Generate a very short, concise, and to-the-point title (ideally 3-5 words) for the following note. The title should directly reflect the main subject of the content. Output only the title itself.\n\nNote Content:\n"""\n${text}\n"""`;
        
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        const title = response.text?.trim();
        return title && title.length > 0 ? title : "Untitled Note";
    } catch (error) {
        console.error("Error generating title with Gemini:", error);
        return "Untitled Note";
    }
};
