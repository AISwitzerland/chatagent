import { supabase } from './supabaseClient';
import { DocumentStatus, Document } from '../types/index';
import { ProcessingManager } from './processingManager';
import { isErrorWithMessage, ValidationError, isDefined } from '../types/utils';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../types/constants';

export interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  path?: string;
  processId?: string;
  classification?: {
    type: string;
    confidence: number;
  };
}

export interface DocumentMetadata {
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy: {
    name: string;
    email: string;
  };
  uploadedAt: string;
  [key: string]: unknown;
}

export class DocumentService {
  private static instance: DocumentService;
  private processingManager: ProcessingManager;

  private constructor() {
    this.processingManager = ProcessingManager.getInstance();
  }

  public static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  async uploadDocument(
    file: File,
    userData: { name: string; email: string }
  ): Promise<UploadResult> {
    try {
      // Validiere Dateityp
      if (!ALLOWED_FILE_TYPES.all.includes(file.type)) {
        throw new ValidationError('Nicht unterstützter Dateityp', 'file', 'INVALID_FILE_TYPE');
      }

      // Validiere Dateigröße
      if (file.size > MAX_FILE_SIZE) {
        throw new ValidationError('Datei ist zu groß', 'file', 'FILE_TOO_LARGE');
      }

      // Erstelle Metadata
      const metadata: DocumentMetadata = {
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedBy: userData,
        uploadedAt: new Date().toISOString(),
      };

      // Erstelle ein Document-Objekt für die Verarbeitung
      const document = {
        file: await file.arrayBuffer().then(buffer => Buffer.from(buffer)),
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        metadata,
      };

      // Starte die asynchrone Verarbeitung
      const processId = await this.processingManager.processDocument(document);

      return {
        success: true,
        processId,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: { field: error.field },
          },
        };
      }

      if (isErrorWithMessage(error)) {
        console.error('Document upload error:', error);
        return {
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: error.message,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Ein unbekannter Fehler ist aufgetreten',
        },
      };
    }
  }

  async getDocument(documentId: string): Promise<Document | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(
          `
          *,
          accident_reports(*),
          damage_reports(*),
          contract_changes(*),
          miscellaneous_documents(*)
        `
        )
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (isErrorWithMessage(error)) {
        console.error('Error fetching document:', error);
      }
      return null;
    }
  }

  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    metadata?: Record<string, unknown>
  ): Promise<Document | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          status,
          ...(isDefined(metadata) ? { metadata } : {}),
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (isErrorWithMessage(error)) {
        console.error('Error updating document status:', error);
      }
      return null;
    }
  }
}
