import type { DocumentType, ProcessingContext } from '../agents/documentProcessor/types';

// Re-export types from document processor
export type { DocumentType, ProcessingContext };

// Processing Status Types
export type ProcessingStatus =
  | 'queued'
  | 'processing_ocr'
  | 'processing_classification'
  | 'processing_storage'
  | 'completed'
  | 'failed';

export type ProcessingStep = 'upload' | 'ocr' | 'classification' | 'storage';

// Core Processing Types
export interface ProcessingProgress {
  processId: string;
  status: ProcessingStatus;
  currentStep: ProcessingStep;
  progressPercentage: number;
  message?: string;
  error?: ProcessingError;
  startedAt: string;
  completedAt?: string;
  context?: ProcessingContext;
}

export interface ProcessingError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ProcessingOptions {
  maxRetries: number;
  timeout: number;
  priority?: 'high' | 'normal' | 'low';
  [key: string]: unknown;
}

export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  maxRetries: 3,
  timeout: 300000, // 5 minutes
  priority: 'normal'
};

// Consolidated ProcessingResult type
export interface ProcessingResult {
  success: boolean;
  message: string;
  documentType?: DocumentType;
  processingTime: number;
  confidence: number;
  error?: ProcessingError;
  data?: {
    extractedText?: string;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
  };
  context?: ProcessingContext;
}
