import { createWorker, WorkerOptions } from 'tesseract.js';
import { OcrProcessor, OcrResult, OcrOptions, OcrProcessorType } from '../types';
import { ProcessingError } from '../../utils';
import { performance } from 'perf_hooks';
import { imagePreprocessor } from '../utils/imagePreprocessor';

export class TesseractProcessor implements OcrProcessor {
  private worker: Awaited<ReturnType<typeof createWorker>> | null = null;

  getName(): OcrProcessorType {
    return 'tesseract';
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.worker) {
        this.worker = await createWorker();
        
        // Initialisiere die deutsche Sprache
        await this.worker.reinitialize('deu');
      }
      return true;
    } catch (error) {
      console.error('Tesseract nicht verfügbar:', error);
      return false;
    }
  }

  async processImage(image: Buffer, options: OcrOptions): Promise<OcrResult> {
    const startTime = performance.now();

    try {
      if (!this.worker) {
        throw new ProcessingError(
          'Tesseract Worker nicht initialisiert',
          'tesseract-processing',
          null
        );
      }

      const { processedImage, metadata } = await imagePreprocessor.preprocessImage(
        image,
        {
          mimeType: options.documentContext?.mimeType || 'image/jpeg',
          enhanceImage: options.enhanceImage,
          minQuality: options.minQuality
        }
      );

      const result = await this.worker.recognize(processedImage);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      return {
        text: result.data.text,
        confidence: result.data.confidence / 100,
        metadata: {
          ...metadata,
          documentContext: options.documentContext
        },
        processingTime,
        processor: this.getName(),
        context: {
          processId: crypto.randomUUID(),
          fileName: options.documentContext?.fileName || 'unknown',
          mimeType: options.documentContext?.mimeType || 'unknown',
          fileSize: options.documentContext?.fileSize || 0,
          startedAt: new Date().toISOString(),
          metadata: {
            ocrProcessor: this.getName(),
            ocrConfidence: result.data.confidence / 100,
            processingTime
          }
        }
      };
    } catch (error: any) {
      throw new ProcessingError(
        `Tesseract Verarbeitungsfehler: ${error.message}`,
        'tesseract-processing',
        error
      );
    }
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
} 