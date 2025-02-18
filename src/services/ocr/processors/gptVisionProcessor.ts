import OpenAI from 'openai';
import { OCRResult, ProcessingError } from '../types/ocrTypes.js';
import { OCR_CONFIG } from '../config/ocrConfig.js';

class GPTVisionProcessor {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY ist nicht konfiguriert');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processImage(imageBase64: string, fileName: string): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model: OCR_CONFIG.gptVision.model,
        messages: [
          {
            role: 'system',
            content: OCR_CONFIG.gptVision.systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analysiere dieses Dokument und extrahiere alle relevanten Informationen. Das Dokument ist: ${fileName}`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: OCR_CONFIG.gptVision.maxTokens,
        temperature: OCR_CONFIG.gptVision.temperature,
      });

      const result = response.choices[0]?.message?.content;

      if (!result) {
        throw new Error('Keine Antwort von GPT-Vision erhalten');
      }

      return {
        text: result,
        confidence: 0.95, // GPT gibt keine Konfidenz zurück, wir setzen einen hohen Standardwert
        processingTime: Date.now() - startTime,
        method: 'gpt-vision',
        language: 'de', // Standardmäßig Deutsch, könnte später durch Spracherkennung ergänzt werden
      };
    } catch (error: any) {
      const processingError: ProcessingError = new Error(
        `GPT-Vision Verarbeitungsfehler: ${error.message}`
      ) as ProcessingError;
      processingError.code = 'PROCESSING_ERROR';
      processingError.details = error;
      throw processingError;
    }
  }

  // Hilfsmethode zur Validierung des Bildformats
  private validateImage(base64Image: string): boolean {
    // Basis-Validierung des Base64-Strings
    const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
    return base64Regex.test(base64Image);
  }
}

export const gptVisionProcessor = new GPTVisionProcessor();
