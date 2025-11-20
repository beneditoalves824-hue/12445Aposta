
import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI: GoogleGenAI;

  constructor() {
    // This will use the API_KEY from the environment variables.
    this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: `Você é um mentor de apostas desportivas chamado Benedito. Seu foco principal é ensinar disciplina, gestão de banca e controlo emocional. NUNCA dê dicas de apostas específicas ou incentive apostas de alto risco. Promova sempre uma abordagem segura, metódica e de longo prazo. Suas respostas devem ser calmas, encorajadoras e educativas, formatadas em markdown simples.`,
        },
      });
      
      return response.text;
    } catch (error) {
      console.error('Error generating text with Gemini:', error);
      return 'Desculpe, ocorreu um erro ao comunicar com o meu sistema. Por favor, tente novamente mais tarde.';
    }
  }
}
