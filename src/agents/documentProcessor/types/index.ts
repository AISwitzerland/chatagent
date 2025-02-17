export type DocumentType = 'accident_report' | 'damage_report' | 'contract_change' | 'miscellaneous';

export interface Document {
  file: Buffer;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface DocumentContext {
  fileName: string;
  mimeType: string;
  fileSize: number;
  metadata?: Record<string, any>;
}

export interface ProcessingContext extends DocumentContext {
  processId: string;
  startedAt: string;
  documentType?: DocumentType;
}

export interface ProcessingResult {
  success: boolean;
  message: string;
  documentType?: DocumentType;
  processingTime: number;
  confidence?: number;
  data?: Record<string, any>;
  error?: Error;
  context?: ProcessingContext;
} 