import { OcrResult, OcrOptions } from './types';
import { OcrProcessorFactory } from './processors/ocrProcessorFactory';
import { ProcessingError } from '../utils';
import { performance } from 'perf_hooks';
import { ProcessingContext } from '../types';

export class OcrService {
  private static instance: OcrService;
  private processorFactory: OcrProcessorFactory;

  private constructor() {
    this.processorFactory = OcrProcessorFactory.getInstance();
  }

  static getInstance(): OcrService {
    if (!OcrService.instance) {
      OcrService.instance = new OcrService();
    }
    return OcrService.instance;
  }

  async processImage(image: Buffer, options: OcrOptions): Promise<OcrResult> {
    const startTime = performance.now();

    try {
      if (!image) {
        throw new ProcessingError(
          'Kein Dokument zum Verarbeiten bereitgestellt',
          'ocr-service',
          null
        );
      }

      if (!options.documentContext) {
        throw new ProcessingError('Dokumentkontext ist erforderlich', 'ocr-service', null);
      }

      // Verfügbaren Processor abrufen
      const processor = await this.processorFactory.getProcessor(options);

      // OCR durchführen
      const result = await processor.processImage(image, options);

      // Gesamtverarbeitungszeit aktualisieren
      const endTime = performance.now();
      result.processingTime = endTime - startTime;

      // Kontext zum Ergebnis hinzufügen
      const context: ProcessingContext = {
        processId: crypto.randomUUID(),
        fileName: options.documentContext.fileName,
        mimeType: options.documentContext.mimeType,
        fileSize: options.documentContext.fileSize,
        startedAt: new Date().toISOString(),
        metadata: {
          ...options.documentContext.metadata,
          ocrProcessor: result.processor,
          ocrConfidence: result.confidence,
          processingTime: result.processingTime,
        },
      };

      return {
        ...result,
        context,
      };
    } catch (error) {
      if (error instanceof ProcessingError) {
        throw error;
      }
      throw new ProcessingError('OCR Verarbeitungsfehler', 'ocr-service', error);
    }
  }

  async getAvailableProcessors(): Promise<string[]> {
    const processors = await this.processorFactory.getAllAvailableProcessors();
    return processors.map(p => p.getName());
  }
}
