import { z } from 'zod';

// API Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  status: number;
}

// Image Processing Response Schema
export const ImageProcessingResultSchema = z.object({
  processedImage: z.string(),
  metadata: z.object({
    width: z.number(),
    height: z.number(),
    format: z.string(),
    quality: z.number(),
    processingTime: z.number(),
    originalSize: z.number(),
    processedSize: z.number(),
    enhancementApplied: z.boolean().optional(),
    ocrConfidence: z.number().optional(),
  }).partial(),
});

export type ImageProcessingResult = z.infer<typeof ImageProcessingResultSchema>;

// Document Upload Response Schema
export const DocumentUploadResultSchema = z.object({
  success: z.boolean(),
  documentId: z.string().optional(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type DocumentUploadResult = z.infer<typeof DocumentUploadResultSchema>;

// OpenAI Response Schema
export const OpenAIResponseSchema = z.object({
  content: z.string(),
  role: z.literal('assistant'),
  metadata: z.object({
    model: z.string(),
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
});

export type OpenAIResponse = z.infer<typeof OpenAIResponseSchema>;

// Type Guards
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'status' in error
  );
}

export function isImageProcessingResult(data: unknown): data is ImageProcessingResult {
  try {
    ImageProcessingResultSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isDocumentUploadResult(data: unknown): data is DocumentUploadResult {
  try {
    DocumentUploadResultSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isOpenAIResponse(data: unknown): data is OpenAIResponse {
  try {
    OpenAIResponseSchema.parse(data);
    return true;
  } catch {
    return false;
  }
} 