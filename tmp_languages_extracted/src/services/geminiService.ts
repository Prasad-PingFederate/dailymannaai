import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateDailyMannaResponse(prompt: string, languageName: string): Promise<string> {
  const systemInstruction = `You are Daily Manna AI, a spiritually uplifting Christian AI assistant. 
Your purpose is to provide biblical wisdom, scripture references, and encouraging words.
You MUST respond entirely in the requested language: ${languageName}.
Keep your answers compassionate, concise, and rooted in the Bible as the word of God.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || 'Sorry, I could not generate a response. Please try again.';
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response. Please check your API key or network connection.');
  }
}
