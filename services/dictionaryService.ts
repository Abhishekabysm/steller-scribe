// Using Google Gemini for dictionary/translation functionality
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

// Lazy-initialize the AI client to avoid crashing on load
const getAiClient = () => {
  if (!ai) {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      // Match the rest of the app's AI features env var handling
      throw new Error(
        "VITE_GEMINI_API_KEY environment variable not set. Please configure it to use AI features."
      );
    }
    ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  }
  return ai;
};

export const getWordMeaning = async (word: string, targetLanguage: string): Promise<string> => {
  const languageNames: { [key: string]: string } = {
    'en': 'English',
    'english': 'English',
    'hi': 'Hindi',
    'hindi': 'Hindi',
    'es': 'Spanish',
    'spanish': 'Spanish',
    'fr': 'French',
    'french': 'French',
    'de': 'German',
    'german': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese (Simplified)',
  };

  const languageName = languageNames[targetLanguage.toLowerCase()] || 'English';
  
  const prompt = `Provide a simple, concise meaning of the word or phrase "${word}" in ${languageName}.

Rules:
- Give only the most common meaning
- Keep it to 1-2 simple words or a very short phrase
- No formatting, just the meaning
- If it's a different language, provide the translation first, then meaning

Examples:
- "universe" → "everything that exists"
- "beautiful" → "attractive, pretty"
- "run" → "move quickly"

Word: "${word}"`;

  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    if (!response.text) {
      throw new Error("Failed to get word meaning - empty response from AI");
    }
    return response.text;
  } catch (error) {
    console.error("Error getting word meaning with Gemini:", error);
    throw new Error(`Failed to get meaning for "${word}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
