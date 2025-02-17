import { createWorker, Worker } from 'tesseract.js';
import { OcrProcessor, OcrResult, OcrOptions, ImagePreprocessorOptions } from '../types';
import { imagePreprocessor } from '../utils/imagePreprocessor';
import { ProcessingError } from '../../utils';
import { performance } from 'perf_hooks';
import { ProcessingContext } from '../../types';

export class TesseractProcessor implements OcrProcessor {
  private worker: Worker | null = null;

  getName(): string {
    return 'tesseract';
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async processImage(image: Buffer, options: OcrOptions): Promise<OcrResult> {
    const startTime = performance.now();

    try {
      if (!options.documentContext) {
        throw new ProcessingError(
          'Dokumentkontext ist erforderlich',
          'tesseract-processing',
          null
        );
      }

      // Bild vorverarbeiten
      const preprocessOptions: ImagePreprocessorOptions = {
        mimeType: options.documentContext.mimeType,
        enhanceImage: options.enhanceImage
      };
      
      const { processedImage, metadata } = await imagePreprocessor.preprocessImage(
        image,
        preprocessOptions
      );

      // Worker initialisieren
      if (!this.worker) {
        this.worker = await createWorker();
        await this.worker.reinitialize(options.language || 'deu');
      }

      // OCR durchführen
      const { data: { text, confidence } } = await this.worker.recognize(processedImage);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Metadaten mit Dokumentkontext anreichern
      const enrichedMetadata = {
        ...metadata,
        documentType: options.documentContext.mimeType,
        fileName: options.documentContext.fileName,
        fileSize: options.documentContext.fileSize,
        ocrConfidence: confidence,
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
          ocrConfidence: confidence / 100, // Normalisieren auf 0-1
          processingTime
        }
      };

      return {
        text,
        confidence: confidence / 100, // Normalisieren auf 0-1
        metadata: enrichedMetadata,
        processingTime,
        processor: this.getName(),
        context
      };

    } catch (error) {
      throw new ProcessingError(
        'Tesseract Verarbeitungsfehler',
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