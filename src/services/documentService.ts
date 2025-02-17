import { supabase } from './supabaseClient';
import { ProcessingError } from '../agents/documentProcessor/utils';
import { DocumentStatus } from '../types/database';
import { DocumentClassifier } from './documentClassifier';
import { OcrService } from '../agents/documentProcessor/ocr/ocrService';
import { ProcessingManager } from './processingManager';

export interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  path?: string;
  processId?: string;
  classification?: {
    type: string;
    confidence: number;
  };
}

export class DocumentService {
  private static instance: DocumentService;
  private classifier: DocumentClassifier;
  private ocrService: OcrService;
  private processingManager: ProcessingManager;

  private constructor() {
    this.classifier = DocumentClassifier.getInstance();
    this.ocrService = OcrService.getInstance();
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
      // Erstelle ein Document-Objekt für die Verarbeitung
      const document = {
        file: await file.arrayBuffer().then(buffer => Buffer.from(buffer)),
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size
      };

      // Starte die asynchrone Verarbeitung
      const processId = await this.processingManager.processDocument(document);

      return {
        success: true,
        processId
      };

    } catch (error: any) {
      console.error('Document upload error:', error);
      return {
        success: false,
        error: error.message || 'Fehler beim Hochladen des Dokuments'
      };
    }
  }

  async getDocument(documentId: string) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          accident_reports(*),
          damage_reports(*),
          contract_changes(*),
          miscellaneous_documents(*)
        `)
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching document:', error);
      return null;
    }
  }

  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    metadata?: any
  ) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          status,
          ...(metadata ? { metadata } : {})
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error updating document status:', error);
      return null;
    }
  }

  private normalizeChangeType(changeType: string): string {
    const typeMap: Record<string, string> = {
      'kündigung': 'kuendigung',
      'vertragswechsel': 'vertragswechsel',
      'trennung': 'vertragstrennung',
      'änderung': 'anpassung',
      'anpassung': 'anpassung'
    };

    const normalizedType = changeType?.toLowerCase().trim();
    return typeMap[normalizedType] || 'anpassung';
  }
} 