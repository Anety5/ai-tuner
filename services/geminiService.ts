import { GoogleGenAI } from "@google/genai";

// This is a global declaration for the experimental `window.ai` object.
declare global {
  interface Window {
    ai?: {
      canCreateTextSession: () => Promise<'readily' | 'after-download' | 'no'>;
      createTextSession: (options?: any) => Promise<AITextSession>;
    };
  }
  
  interface AITextSession {
    prompt: (input: string) => Promise<string>;
    destroy: () => void;
  }
}

export type AITask = 'Optimize' | 'Summarize' | 'Proofread';
export type AIModel = 'nano' | 'flash';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const cloudModel = 'gemini-2.5-flash';

// --- Text Generation (Optimize) ---
export const generateText = async (
  prompt: string,
  systemInstruction: string,
  model: AIModel
): Promise<string> => {
  if (model === 'nano' && window.ai) {
    try {
      const session = await window.ai.createTextSession({ systemPrompt: systemInstruction });
      const fullPrompt = `${systemInstruction}\n\nUser Prompt: "${prompt}"`;
      const result = await session.prompt(fullPrompt);
      session.destroy();
      return result;
    } catch (e) {
      console.error("On-device AI error, falling back to cloud.", e);
      return generateTextWithCloud(prompt, systemInstruction);
    }
  }
  return generateTextWithCloud(prompt, systemInstruction);
};

const generateTextWithCloud = async (prompt: string, systemInstruction: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: cloudModel,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(error instanceof Error ? error.message : String(error));
    }
};

// --- Summarization ---
export const summarizeText = async (
  text: string,
  systemInstruction: string,
  model: AIModel
): Promise<string> => {
  if (model === 'nano' && window.ai) {
     try {
      const session = await window.ai.createTextSession({ systemPrompt: systemInstruction });
      const fullPrompt = `${systemInstruction}\n\nText to summarize: "${text}"`;
      const result = await session.prompt(fullPrompt);
      session.destroy();
      return result;
    } catch (e) {
      console.error("On-device summarizer error, falling back to cloud.", e);
      return summarizeTextWithCloud(text, systemInstruction);
    }
  }
  return summarizeTextWithCloud(text, systemInstruction);
};

const summarizeTextWithCloud = async (text: string, systemInstruction: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: cloudModel,
            contents: `Please summarize the following text:\n\n---\n\n${text}`,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(error instanceof Error ? error.message : String(error));
    }
};


// --- Proofreading ---
export const proofreadText = async (
  text: string,
  systemInstruction: string,
  model: AIModel
): Promise<string> => {
  if (model === 'nano' && window.ai) {
     try {
      const session = await window.ai.createTextSession({ systemPrompt: systemInstruction });
      const fullPrompt = `${systemInstruction}\n\nText to proofread: "${text}"`;
      const result = await session.prompt(fullPrompt);
      session.destroy();
      return result;
    } catch (e) {
      console.error("On-device proofreader error, falling back to cloud.", e);
      return proofreadTextWithCloud(text, systemInstruction);
    }
  }
  return proofreadTextWithCloud(text, systemInstruction);
};

const proofreadTextWithCloud = async (text: string, systemInstruction: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: cloudModel,
            contents: `Please proofread the following text and return only the corrected version:\n\n---\n\n${text}`,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(error instanceof Error ? error.message : String(error));
    }
};
