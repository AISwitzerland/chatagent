export interface ImageMetadata {
  format: string;
  width: number;
  height: number;
  quality: number;
  enhancementApplied: boolean;
}

export interface ImagePreprocessorResult {
  processedImage: Buffer;
  metadata: ImageMetadata;
}

export interface OcrResult {
  text: string;
  confidence: number;
  metadata: ImageMetadata;
  processingTime: number;
  processor: string;
}

export interface OcrOptions {
  preferredProcessor?: 'gpt4-vision' | 'tesseract';
  language?: string;
  timeout?: number;
  enhanceImage?: boolean;
}

export interface OcrProcessor {
  processImage(image: Buffer, options?: OcrOptions): Promise<OcrResult>;
  getName(): string;
  isAvailable(): Promise<boolean>;
} 