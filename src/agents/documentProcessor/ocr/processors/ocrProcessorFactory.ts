import { OcrProcessor, OcrOptions } from '../types';
import { GPT4VisionProcessor } from './gpt4VisionProcessor';
import { TesseractProcessor } from './tesseractProcessor';

export class OcrProcessorFactory {
  private static instance: OcrProcessorFactory;
  private processors: Map<string, OcrProcessor>;

  private constructor() {
    this.processors = new Map();
    this.processors.set('gpt4-vision', new GPT4VisionProcessor());
    this.processors.set('tesseract', new TesseractProcessor());
  }

  static getInstance(): OcrProcessorFactory {
    if (!OcrProcessorFactory.instance) {
      OcrProcessorFactory.instance = new OcrProcessorFactory();
    }
    return OcrProcessorFactory.instance;
  }

  async getProcessor(options?: OcrOptions): Promise<OcrProcessor> {
    const preferredProcessor = options?.preferredProcessor;
    
    if (preferredProcessor) {
      const processor = this.processors.get(preferredProcessor);
      if (processor && await processor.isAvailable()) {
        return processor;
      }
    }

    // Versuche zuerst GPT-4 Vision
    const gpt4Processor = this.processors.get('gpt4-vision');
    if (gpt4Processor && await gpt4Processor.isAvailable()) {
      return gpt4Processor;
    }

    // Fallback zu Tesseract
    const tesseractProcessor = this.processors.get('tesseract');
    if (tesseractProcessor && await tesseractProcessor.isAvailable()) {
      return tesseractProcessor;
    }

    throw new Error('Kein OCR Processor verfügbar');
  }

  async getAllAvailableProcessors(): Promise<OcrProcessor[]> {
    const availableProcessors: OcrProcessor[] = [];
    const processors = Array.from(this.processors.values());

    for (const processor of processors) {
      if (await processor.isAvailable()) {
        availableProcessors.push(processor);
      }
    }

    return availableProcessors;
  }
} 