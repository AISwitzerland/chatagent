import { OpenAI } from 'openai';
import { OcrProcessor, OcrResult, OcrOptions, ImagePreprocessorOptions } from '../types';
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

  getName(): string {
    return 'gpt4-vision';
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY;
  }

  async processImage(image: Buffer, options: OcrOptions): Promise<OcrResult> {
    const startTime = performance.now();

    try {
      if (!options.documentContext) {
        throw new ProcessingError(
          'Dokumentkontext ist erforderlich',
          'gpt4-vision-processing',
          null
        );
      }

      // Bild vorverarbeiten
      const preprocessOptions: ImagePreprocessorOptions = {
        mimeType: options.documentContext.mimeType
      };
      
      const { processedImage, metadata } = await imagePreprocessor.preprocessImage(
        image,
        preprocessOptions
      );
      
      // Base64 konvertieren
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
                text: `Extrahiere den Text aus diesem Dokument: ${options.documentContext.fileName}` 
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: OCR_CONFIG.gptVision.maxTokens,
        temperature: OCR_CONFIG.gptVision.temperature
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Confidence-Score basierend auf Bildqualität und Modell-Output berechnen
      const confidence = this.calculateConfidence(metadata.quality || 0.9, response);

      // Metadaten mit Dokumentkontext anreichern
      const enrichedMetadata = {
        ...metadata,
        documentType: options.documentContext.mimeType,
        fileName: options.documentContext.fileName,
        fileSize: options.documentContext.fileSize,
        ...options.documentContext.metadata
      };

      // Kontext erstellen
      const context: ProcessingContext = {
        processId: crypto.randomUUID(),
        fileName: options.documentContext.fileName,
        mimeType: options.documentContext.mimeType,
        fileSize: options.documentContext.fileSize,
        startedAt: new Date().toISOString(),
        metadata: {
          ...options.documentContext.metadata,
          ocrProcessor: this.getName(),
          ocrConfidence: confidence,
          processingTime
        }
      };

      return {
        text: response.choices[0]?.message?.content || '',
        confidence,
        metadata: enrichedMetadata,
        processingTime,
        processor: this.getName(),
        context
      };

    } catch (error) {
      throw new ProcessingError(
        'GPT-4 Vision Verarbeitungsfehler',
        'gpt4-vision-processing',
        error
      );
    }
  }

  private calculateConfidence(imageQuality: number, response: any): number {
    // Basis-Konfidenz basierend auf der Bildqualität
    let confidence = imageQuality;

    // Reduziere Konfidenz wenn die Antwort leer oder sehr kurz ist
    const text = response.choices[0]?.message?.content || '';
    if (!text) {
      confidence *= 0.5;
    } else if (text.length < 50) {
      confidence *= 0.8;
    }

    // Reduziere Konfidenz wenn die Antwort unvollständig erscheint
    if (text.endsWith('...') || text.includes('[unlesbar]') || text.includes('[unklar]')) {
      confidence *= 0.9;
    }

    return Math.min(Math.max(confidence, 0), 1); // Normalisiere auf 0-1
  }
} 