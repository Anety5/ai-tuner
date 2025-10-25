import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type TaskType = 'generate' | 'proofread' | 'translate';
interface GenerateTextOptions {
        creativity: number;
        factuality: number;
        parentalControls: boolean;
        plagiarismCheck: boolean;
        langOptions?: {
                langCode: string;
                langName: string;
        };
}

// Helper function to convert file to base64
const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(file);
        });
        return {
                inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
        };
};

export const generateText = async (
        text: string,
        taskType: TaskType,
        options: GenerateTextOptions
): Promise<GenerateContentResponse> => {
        if (!text.trim()) {
                throw new Error("Input text cannot be empty.");
        }
  
        let systemInstruction = "You are an expert writing assistant. Return only the final text without any preamble or explanation.";
        if (options.parentalControls) {
                systemInstruction += " Ensure the output is family-friendly and suitable for all ages.";
        }

        let contents = text;

        switch (taskType) {
                case 'proofread':
                        systemInstruction = `Proofread the following text for grammar, spelling, and clarity. ${systemInstruction}`;
                        break;
                case 'translate':
                        if (options.langOptions) {
                                systemInstruction = `Translate the following text to ${options.langOptions.langName}. ${systemInstruction}`;
                        } else {
                                throw new Error("Translation task requires a target language.");
                        }
                        break;
                case 'generate':
                        // The general system instruction is sufficient for a direct prompt.
                        break;
        }

        const model = 'gemini-2.5-flash';
        const temperature = options.creativity / 100; // 0.0 - 1.0
        const topP = 1 - (options.factuality / 100); // 1.0 - 0.0
  
        try {
                const response = await ai.models.generateContent({
                                model: model,
                                contents: contents,
                                config: {
                                                systemInstruction: systemInstruction,
                                                temperature: temperature,
                                                topP: Math.max(0.1, topP), // Ensure topP is not too low
                                                tools: options.plagiarismCheck ? [{ googleSearch: {} }] : undefined,
                                }
                });
                return response;
        } catch (error: any) {
                console.error("Error generating text:", error);
                throw new Error(error.message || "Failed to generate text due to an API error.");
        }
};

export const textToSpeech = async (text: string): Promise<Uint8Array> => {
                try {
                                const response = await ai.models.generateContent({
                                                model: "gemini-2.5-flash-preview-tts",
                                                contents: [{ parts: [{ text: text }] }],
                                                config: {
                                                                responseModalities: [Modality.AUDIO],
                                                                speechConfig: {
                                                                                voiceConfig: {
                                                                                                // The model automatically infers the language from the text for pronunciation.
                                                                                                prebuiltVoiceConfig: { 
                                                                                                                voiceName: 'Fenrir',
                                                                                                },
                                                                                },
                                                                },
                                                },
                                });
        
                                const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                                if (!base64Audio) {
                                                throw new Error("Audio generation failed or was blocked by safety filters.");
                                }

                                const binaryString = atob(base64Audio);
                                const len = binaryString.length;
                                const bytes = new Uint8Array(len);
                                for (let i = 0; i < len; i++) {
                                                bytes[i] = binaryString.charCodeAt(i);
                                }
                                return bytes;
                } catch (error: any) {
                                console.error("Error generating speech:", error);
                                throw new Error(error.message || "Failed to generate audio.");
                }
};

export const generateImage = async (prompt: string): Promise<string> => {
                try {
                                const translateResponse = await ai.models.generateContent({
                                        model: 'gemini-2.5-flash',
                                        contents: `Translate the following user prompt for an image generator into English. Return only the translated text, without any additional comments or explanations. The prompt is: "${prompt}"`
                                });
                                const englishPrompt = translateResponse.text.trim();

                                const response = await ai.models.generateImages({
                                                model: 'imagen-4.0-generate-001',
                                                prompt: englishPrompt,
                                                config: {
                                                                numberOfImages: 1,
                                                                outputMimeType: 'image/png',
                                                },
                                });
        
                                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                                return `data:image/png;base64,${base64ImageBytes}`;
                } catch (error: any) {
                                console.error("Error generating image:", error);
                                throw new Error(error.message || "Failed to generate image due to an API error.");
                }
};

export const analyzeImage = async (prompt: string, imageFile: File): Promise<string> => {
                try {
                                const imagePart = await fileToGenerativePart(imageFile);
                                const textPart = { text: prompt };
        
                                const response = await ai.models.generateContent({
                                                model: 'gemini-2.5-flash',
                                                contents: { parts: [imagePart, textPart] }
                                });

                                return response.text;
                } catch (error: any) {
                                console.error("Error analyzing image:", error);
                                throw new Error(error.message || "Failed to analyze image due to an API error.");
                }
};