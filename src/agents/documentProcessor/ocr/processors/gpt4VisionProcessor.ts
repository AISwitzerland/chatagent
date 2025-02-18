import { OpenAI } from 'openai';
import { OcrProcessor, OcrResult, OcrOptions, ImagePreprocessorOptions, OcrProcessorType } from '../types';
import { imagePreprocessor } from '../utils/imagePreprocessor';
import { ProcessingError } from '../../utils';
import { performance } from 'perf_hooks';
import { ProcessingContext } from '../../types';
import { OCR_CONFIG } from '../config/ocrConfig';

export class GPT4VisionProcessor implements OcrProcessor {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY ist nicht konfiguriert');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  getName(): OcrProcessorType {
    return 'gpt4-vision';
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY;
  }

  async processImage(image: Buffer, options: OcrOptions): Promise<OcrResult> {
    const startTime = performance.now();

    try {
      // Bild vorverarbeiten
      const preprocessOptions: ImagePreprocessorOptions = {
        mimeType: options.documentContext?.mimeType || 'image/jpeg',
        enhanceImage: options.enhanceImage,
        minQuality: options.minQuality
      };

      const { processedImage, metadata } = await imagePreprocessor.preprocessImage(image, preprocessOptions);
      const base64Image = await imagePreprocessor.convertToBase64(processedImage);

      // GPT-4 Vision API aufrufen
      const response = await this.openai.chat.completions.create({
        model: OCR_CONFIG.gptVision.model,
        messages: [
          {
            role: 'system',
            content: OCR_CONFIG.gptVision.systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analysiere dieses Dokument und extrahiere alle relevanten Informationen. Das Dokument ist: ${options.documentContext?.fileName || 'Unbekannt'}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${preprocessOptions.mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: OCR_CONFIG.gptVision.maxTokens,
        temperature: OCR_CONFIG.gptVision.temperature
      });

      const result = response.choices[0]?.message?.content;
      
      if (!result) {
        throw new Error('Keine Antwort von GPT-Vision erhalten');
      }

      const confidence = this.calculateConfidence(metadata.quality || 0.8, response);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      const context: ProcessingContext = {
        processId: crypto.randomUUID(),
        fileName: options.documentContext?.fileName || 'unknown',
        mimeType: options.documentContext?.mimeType || 'unknown',
        fileSize: options.documentContext?.fileSize || 0,
        startedAt: new Date().toISOString(),
        metadata: {
          ocrProcessor: this.getName(),
          ocrConfidence: confidence,
          processingTime
        }
      };

      return {
        text: result,
        confidence,
        metadata: {
          ...metadata,
          documentContext: options.documentContext
        },
        processingTime,
        processor: this.getName(),
        context
      };

    } catch (error: any) {
      const processingError = new ProcessingError(
        `GPT-Vision Verarbeitungsfehler: ${error.message}`,
        'gpt4-vision-processor',
        error
      );
      throw processingError;
    }
  }

  private calculateConfidence(imageQuality: number, response: any): number {
    // Basis-Konfidenz basierend auf der Bildqualität
    let confidence = imageQuality;

    // Zusätzliche Faktoren für die Konfidenzberechnung
    const hasContent = response.choices[0]?.message?.content?.length > 0;
    const contentLength = response.choices[0]?.message?.content?.length || 0;
    
    // Reduziere Konfidenz wenn kein Inhalt
    if (!hasContent) {
      confidence *= 0.5;
    }
    
    // Erhöhe Konfidenz bei längeren Antworten
    if (contentLength > 500) {
      confidence *= 1.2;
    }

    // Stelle sicher, dass die Konfidenz zwischen 0 und 1 liegt
    return Math.min(Math.max(confidence, 0), 1);
  }
} 