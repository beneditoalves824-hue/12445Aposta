
import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI: GoogleGenAI;
  // IMPORTANT: Replace this placeholder with your actual Gemini API Key.
  private apiKey = 'YOUR_GEMINI_API_KEY';

  constructor() {
    if (this.apiKey === 'YOUR_GEMINI_API_KEY') {
      console.error("Gemini API Key is not set. Please replace the placeholder in src/services/gemini.service.ts");
      // We avoid throwing an error here to let the app load, but the AI feature won't work.
    }
    this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async generateText(prompt: string): Promise<string> {
    if (this.apiKey === 'YOUR_GEMINI_API_KEY') {
      return 'O Mentor IA está desativado. Por favor, configure a chave da API do Gemini no código-fonte para ativar esta funcionalidade.';
    }
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
