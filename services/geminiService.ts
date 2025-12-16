import { GoogleGenAI } from "@google/genai";
import { Block, AIRequestType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to strip HTML tags
const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>/g, '');
};

// Helper to get plain text context from blocks
const getDocumentContext = (blocks: Block[]): string => {
  return blocks.map(b => stripHtml(b.content)).join('\n');
};

export const generateAIContent = async (
  prompt: string, 
  currentContext: string,
  requestType: AIRequestType = 'continue'
): Promise<string> => {
  if (!apiKey) {
    console.error("API Key missing");
    return "Error: API Key is missing. Please check your environment configuration.";
  }

  try {
    let systemInstruction = "You are a helpful AI writing assistant embedded in a Notion-like text editor. Keep your responses concise, clean, and formatted purely as text or markdown.";
    
    let finalPrompt = prompt;

    switch (requestType) {
      case 'summarize':
        systemInstruction += " Summarize the provided text concisely.";
        finalPrompt = `Summarize this:\n${stripHtml(currentContext)}`;
        break;
      case 'fix-grammar':
        systemInstruction += " Fix grammar and spelling errors without changing the tone.";
        finalPrompt = `Fix this text:\n${stripHtml(currentContext)}`;
        break;
      case 'continue':
        systemInstruction += " Continue writing based on the context provided. Maintain the style and tone.";
        finalPrompt = `Context:\n${stripHtml(currentContext)}\n\nTask: ${prompt || "Continue writing..."}`;
        break;
      case 'brainstorm':
        systemInstruction += " Generate a list of ideas based on the prompt.";
        break;
      case 'format':
        systemInstruction += " You are an expert editor. Read the provided text and apply HTML formatting (<b> for bold, <i> for italics) to emphasize key points, names, terms, or important concepts. Return ONLY the HTML string. Do not change the text content itself, only add tags. Do not wrap in markdown code blocks.";
        finalPrompt = `Format this text:\n${stripHtml(currentContext)}`;
        break;
    }

    const model = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const response = await model;
    return response.text || "";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};

export const suggestTitle = async (content: string): Promise<string> => {
    if (!apiKey || !content) return "Untitled";
    try {
        const plainText = stripHtml(content);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a short, concise document title (max 5 words) for this text. Do not use quotes. Text: ${plainText.substring(0, 500)}...`,
        });
        return response.text?.trim() || "Untitled";
    } catch (e) {
        return "Untitled";
    }
}