
import { GoogleGenAI, Type } from "@google/genai";

// Strictly adhering to naming and initialization rules
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async getAiRecommendations(userSkills: string[], currentRole: string) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on skills: ${userSkills.join(', ')} and current role: ${currentRole}, suggest 3 exciting career paths or roles I should search for. Return as a clean JSON array.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                roleName: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                matchPercentage: { type: Type.NUMBER }
              },
              required: ["roleName", "reasoning", "matchPercentage"]
            }
          }
        }
      });
      
      // Property access .text (not a method) as per guidelines
      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error("Gemini recommendation error:", error);
      return [];
    }
  }
};
