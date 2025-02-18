import {
  ProcessingStatus,
  ProcessingStep,
  ProcessingProgress,
  ProcessingError,
  ProcessingOptions,
  DEFAULT_PROCESSING_OPTIONS,
} from '../types/processing';
import { supabase } from './supabaseClient';
import { DocumentAgent } from '../agents/documentProcessor/DocumentAgent';
import { Document } from '../agents/documentProcessor/types';
import { ProcessingResult } from '@/types/processing';

export class ProcessingManager {
  private static instance: ProcessingManager | null = null;
  private processingQueue: Map<string, ProcessingProgress>;
  private documentAgent: DocumentAgent;

  private constructor() {
    this.processingQueue = new Map();
    this.documentAgent = DocumentAgent.getInstance();
  }

  public static getInstance(): ProcessingManager {
    if (!ProcessingManager.instance) {
      ProcessingManager.instance = new ProcessingManager();
    }
    return ProcessingManager.instance;
  }

  public async processDocument(
    document: Document,
    options: ProcessingOptions = DEFAULT_PROCESSING_OPTIONS
  ): Promise<string> {
    const processId = this.generateProcessId();

    const progress: ProcessingProgress = {
      processId,
      status: 'queued',
      currentStep: 'upload',
      progress: 0,
      message: 'Dokument wurde in die Warteschlange aufgenommen',
      startedAt: new Date().toISOString(),
    };

    this.processingQueue.set(processId, progress);

    // Starte die Verarbeitung asynchron
    void this.startProcessing(processId, document, options);

    return processId;
  }

  public getProgress(processId: string): ProcessingProgress | undefined {
    return this.processingQueue.get(processId);
  }

  private async startProcessing(
    processId: string,
    document: Document,
    options: ProcessingOptions
  ): Promise<void> {
    let retryCount = 0;

    try {
      while (retryCount <= (options.maxRetries || DEFAULT_PROCESSING_OPTIONS.maxRetries!)) {
        try {
          // OCR-Verarbeitung
          this.updateProgress(processId, {
            status: 'processing_ocr',
            currentStep: 'ocr',
            progress: 25,
            message: 'OCR-Verarbeitung läuft',
          });

          const result = await this.documentAgent.processDocument(document);

          if (!result.success) {
            throw new Error(result.message);
          }

          // Klassifizierung
          this.updateProgress(processId, {
            status: 'processing_classification',
            currentStep: 'classification',
            progress: 50,
            message: 'Dokument wird klassifiziert',
          });

          // Speicherung
          this.updateProgress(processId, {
            status: 'processing_storage',
            currentStep: 'storage',
            progress: 75,
            message: 'Dokument wird gespeichert',
          });

          // Erfolgreich abgeschlossen
          this.updateProgress(processId, {
            status: 'completed',
            currentStep: 'storage',
            progress: 100,
            message: 'Verarbeitung erfolgreich abgeschlossen',
            completedAt: new Date().toISOString(),
          });

          return;
        } catch (error: any) {
          retryCount++;

          if (retryCount > (options.maxRetries || DEFAULT_PROCESSING_OPTIONS.maxRetries!)) {
            throw error;
          }

          // Warte vor dem nächsten Versuch
          await new Promise(resolve =>
            setTimeout(resolve, options.retryDelay || DEFAULT_PROCESSING_OPTIONS.retryDelay)
          );

          this.updateProgress(processId, {
            message: `Wiederholungsversuch ${retryCount} von ${options.maxRetries}`,
            error: {
              code: 'RETRY',
              message: error.message,
              step: this.processingQueue.get(processId)?.currentStep || 'upload',
              retryCount,
              timestamp: new Date().toISOString(),
              details: error,
            },
          });
        }
      }
    } catch (error: any) {
      console.error('Fehler bei der Dokumentenverarbeitung:', error);
      const errorTimestamp = new Date().toISOString();
      this.updateProgress(processId, {
        status: 'failed',
        message: 'Verarbeitung fehlgeschlagen: ' + error.message,
        error: {
          code: 'PROCESSING_ERROR',
          message: error.message,
          step: this.processingQueue.get(processId)?.currentStep || 'upload',
          retryCount,
          timestamp: errorTimestamp,
          details: error,
        },
      });
    }
  }

  private updateProgress(processId: string, update: Partial<ProcessingProgress>): void {
    const currentProgress = this.processingQueue.get(processId);
    if (currentProgress) {
      this.processingQueue.set(processId, {
        ...currentProgress,
        ...update,
      });

      // Hier könnte eine Event-Emission für UI-Updates erfolgen
      this.emitProgressUpdate(processId);
    }
  }

  private async emitProgressUpdate(processId: string): Promise<void> {
    const progress = this.processingQueue.get(processId);
    if (progress) {
      try {
        // Speichere den Fortschritt in Supabase
        await supabase.from('processing_status').upsert({
          process_id: processId,
          status: progress.status,
          progress: progress.progress,
          message: progress.message,
          updated_at: new Date().toISOString(),
        });

        // Optional: Websocket-Event für Echtzeit-Updates
        await supabase.channel('processing_updates').send({
          type: 'broadcast',
          event: 'progress_update',
          payload: {
            processId,
            progress,
          },
        });
      } catch (error) {
        console.error('Fehler beim Aktualisieren des Verarbeitungsstatus:', error);
      }
    }
  }

  private generateProcessId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
