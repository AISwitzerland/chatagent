export type ProcessingStatus =
  | 'queued'
  | 'processing_ocr'
  | 'processing_classification'
  | 'processing_storage'
  | 'completed'
  | 'failed';

export type ProcessingStep =
  | 'upload'
  | 'ocr'
  | 'classification'
  | 'storage'
  | 'validation';

export interface ProcessingProgress {
  processId: string;
  status: ProcessingStatus;
  progress: number;
  message: string;
  error?: ProcessingError;
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface ProcessingError {
  code: string;
  message: string;
  step: string;
  details?: any;
  retryCount?: number;
}

export interface ProcessingOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
}

export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 300000, // 5 minutes
  priority: 'normal'
}; 