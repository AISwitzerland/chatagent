export type DocumentType = 'insurance_policy' | 'claim_report' | 'unknown';

export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
  processingTime: number;
  method: 'gpt-vision' | 'tesseract';
}

export interface ExtractedData {
  documentType: DocumentType;
  confidence: number;
  fields: {
    [key: string]: string | number | Date | null;
  };
  metadata: {
    processingTime: number;
    method: string;
    originalFileName: string;
    fileType: string;
    fileSize: number;
    pageCount?: number;
  };
  raw: {
    text: string;
    confidence: number;
  };
}

export interface ProcessingOptions {
  preferredMethod?: 'gpt-vision' | 'tesseract';
  language?: string[];
  timeout?: number;
  enhanceImage?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequiredFields: string[];
}

export interface ProcessingError extends Error {
  code: 'FILE_TYPE_ERROR' | 'PROCESSING_ERROR' | 'TIMEOUT_ERROR' | 'VALIDATION_ERROR';
  details?: any;
} 