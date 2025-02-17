import { DocumentContext, ProcessingContext } from '../types';

export interface ImageMetadata {
  format: string;
  width?: number;
  height?: number;
  quality?: number;
  enhancementApplied?: boolean;
  ocrConfidence?: number;
  documentContext?: DocumentContext;
}

export interface ImagePreprocessorOptions {
  mimeType: string;
  enhanceImage?: boolean;
  minQuality?: number;
}

export interface ImagePreprocessorResult {
  processedImage: Buffer;
  metadata: ImageMetadata;
}

export interface OcrOptions {
  language?: string;
  enhanceImage?: boolean;
  minQuality?: number;
  preferredProcessor?: string;
  documentContext: DocumentContext;
}

export interface OcrResult {
  text: string;
  confidence: number;
  metadata: ImageMetadata;
  processingTime: number;
  processor: string;
  context: ProcessingContext;
}

export interface OcrProcessor {
  getName(): string;
  isAvailable(): Promise<boolean>;
  processImage(image: Buffer, options: OcrOptions): Promise<OcrResult>;
  cleanup?(): Promise<void>;
} 