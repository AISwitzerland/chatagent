import { Document, ProcessingResult, DocumentType, DocumentContext, ProcessingContext } from './types';
import { ProcessingError, logStep } from './utils';
import { OcrService } from './ocr/ocrService';
import { OcrResult, OcrOptions } from './ocr/types';

export class DocumentAgent {
  private static instance: DocumentAgent;
  private readonly SUPPORTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  private ocrService: OcrService;

  private constructor() {
    this.ocrService = OcrService.getInstance();
  }

  public static getInstance(): DocumentAgent {
    if (!DocumentAgent.instance) {
      DocumentAgent.instance = new DocumentAgent();
    }
    return DocumentAgent.instance;
  }

  public async processDocument(document: Document, processId?: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    const context = this.createProcessingContext(document, processId);
    
    try {
      // 1. Log document receipt
      logStep('Dokument empfangen', {
        fileName: document.fileName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        processId: context.processId
      });

      // 2. Validate document
      await this.validateDocument(document);

      // 3. Perform OCR
      logStep('Starte OCR-Verarbeitung');
      const ocrResult = await this.performOcr(document, context);
      
      // 4. Classify document based on OCR results
      logStep('Klassifiziere Dokument');
      const documentType = await this.classifyDocument(ocrResult);

      // 5. Update context with document type
      context.documentType = documentType;

      // 6. Prepare processing result
      const processingTime = Date.now() - startTime;
      const result: ProcessingResult = {
        success: true,
        message: 'Verarbeitung erfolgreich',
        documentType,
        processingTime,
        confidence: ocrResult.confidence,
        data: {
          extractedText: ocrResult.text,
          metadata: {
            ...ocrResult.metadata,
            processor: ocrResult.processor
          }
        },
        context
      };

      logStep('Verarbeitung abgeschlossen', result);
      return result;

    } catch (error) {
      const processingError = error instanceof ProcessingError 
          ? error 
          : new ProcessingError('Unerwarteter Fehler', 'processDocument', error);

      const errorResult: ProcessingResult = {
        success: false,
        message: processingError.message,
        processingTime: Date.now() - startTime,
        confidence: 0,
        error: processingError,
        context
      };

      logStep('Fehler bei der Verarbeitung', {
        error: processingError.message,
        step: processingError.step,
        details: processingError.details,
        processId: context.processId
      });

      return errorResult;
    }
  }

  private createProcessingContext(document: Document, processId?: string): ProcessingContext {
    return {
      processId: processId || crypto.randomUUID(),
      fileName: document.fileName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      startedAt: new Date().toISOString(),
      metadata: {}
    };
  }

  private async validateDocument(document: Document): Promise<void> {
    if (!document.fileName || !document.mimeType || !document.fileSize) {
      throw new ProcessingError(
        'Ungültige Dokumentdaten',
        'validation',
        { fileName: document.fileName, mimeType: document.mimeType }
      );
    }

    if (!this.SUPPORTED_MIME_TYPES.includes(document.mimeType)) {
      throw new ProcessingError(
        'Nicht unterstütztes Dateiformat',
        'validation',
        { mimeType: document.mimeType }
      );
    }
  }

  private async performOcr(document: Document, context: ProcessingContext): Promise<OcrResult> {
    try {
      const options: OcrOptions = {
        language: 'de',
        enhanceImage: true,
        documentContext: {
          fileName: context.fileName,
          mimeType: context.mimeType,
          fileSize: context.fileSize,
          metadata: context.metadata
        }
      };

      return await this.ocrService.processImage(document.file, options);
    } catch (error) {
      throw new ProcessingError(
        'OCR-Verarbeitung fehlgeschlagen',
        'ocr',
        error
      );
    }
  }

  private async classifyDocument(ocrResult: OcrResult): Promise<DocumentType> {
    const text = ocrResult.text.toLowerCase();
    
    // Einfache regelbasierte Klassifizierung
    if (text.includes('unfall') || text.includes('kollision') || text.includes('crash')) {
      return 'accident_report';
    }
    if (text.includes('schaden') || text.includes('beschädigung') || text.includes('reparatur')) {
      return 'damage_report';
    }
    if (text.includes('vertrag') || text.includes('änderung') || text.includes('police')) {
      return 'contract_change';
    }
    
    return 'miscellaneous';
  }
} 