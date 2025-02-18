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
  currentStep: ProcessingStep;
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
  timestamp: string;
}

export interface ProcessingOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
}

export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  maxRetries: 2,
  retryDelay: 2000,
  timeout: 120000,
  priority: 'normal'
}; 