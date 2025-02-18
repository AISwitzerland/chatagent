import { DocumentAgent } from '../DocumentAgent';
import { Document } from '../types';
import { ProcessingError } from '../utils';
import { OcrService } from '../ocr/ocrService';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock OcrService
jest.mock('../ocr/ocrService', () => ({
  OcrService: {
    getInstance: jest.fn().mockReturnValue({
      isAvailable: jest.fn().mockResolvedValue(true),
      processImage: jest.fn().mockImplementation(async () => ({
        text: 'Mocked OCR text',
        confidence: 0.95,
        metadata: {
          format: 'pdf',
          width: 800,
          height: 600,
          quality: 0.9,
          enhancementApplied: true
        },
        processingTime: 100,
        processor: 'test',
        context: {
          processId: '123e4567-e89b-12d3-a456-426614174000',
          fileName: 'test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          startedAt: new Date().toISOString(),
          metadata: {}
        }
      }))
    })
  }
}));

describe('DocumentAgent', () => {
  let agent: DocumentAgent;
  let mockDocument: Document;

  beforeEach(() => {
    agent = DocumentAgent.getInstance();
    mockDocument = {
      file: Buffer.from('test content'),
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
    };
    // Reset mock implementations before each test
    jest.clearAllMocks();
  });

  // Test 1: Singleton Pattern
  test('getInstance returns the same instance', () => {
    const instance1 = DocumentAgent.getInstance();
    const instance2 = DocumentAgent.getInstance();
    expect(instance1).toBe(instance2);
  });

  // Test 2: Erfolgreiche Dokumentverarbeitung mit OCR
  test('processDocument processes valid document with OCR successfully', async () => {
    const result = await agent.processDocument(mockDocument);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Verarbeitung erfolgreich');
    expect(result.processingTime).toBeGreaterThan(0);
    expect(result.confidence).toBe(0.95);

    // Überprüfe, ob result.data existiert
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data).toHaveProperty('extractedText');
      expect(result.data).toHaveProperty('metadata');
      expect(result.data.metadata).toHaveProperty('processor', 'test');
    }
  });

  // Test 3: Dokumentklassifizierung
  test('classifies documents correctly based on content', async () => {
    // Test für Unfallbericht
    const mockOcrService = OcrService.getInstance();
    (mockOcrService.processImage as jest.Mock).mockImplementationOnce(async () => ({
      text: 'Unfallbericht: Kollision am 01.01.2024',
      confidence: 0.95,
      metadata: { format: 'pdf' },
      processingTime: 1000,
      processor: 'test',
    }));

    let result = await agent.processDocument(mockDocument);
    expect(result.documentType).toBe('accident_report');

    // Test für Schadensmeldung
    (mockOcrService.processImage as jest.Mock).mockImplementationOnce(async () => ({
      text: 'Schadensmeldung: Beschädigung am Fahrzeug',
      confidence: 0.95,
      metadata: { format: 'pdf' },
      processingTime: 1000,
      processor: 'test',
    }));

    result = await agent.processDocument(mockDocument);
    expect(result.documentType).toBe('damage_report');

    // Test für Vertragsänderung
    (mockOcrService.processImage as jest.Mock).mockImplementationOnce(async () => ({
      text: 'Änderung der Versicherungspolice',
      confidence: 0.95,
      metadata: { format: 'pdf' },
      processingTime: 1000,
      processor: 'test',
    }));

    result = await agent.processDocument(mockDocument);
    expect(result.documentType).toBe('contract_change');
  });

  // Test 4: Ungültiges Dateiformat
  test('processDocument rejects invalid mime type', async () => {
    const invalidDoc = {
      ...mockDocument,
      mimeType: 'application/msword',
    };

    const result = await agent.processDocument(invalidDoc);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Nicht unterstütztes Dateiformat');
    expect(result.error).toBeInstanceOf(ProcessingError);
  });

  // Test 5: OCR-Fehlerbehandlung
  test('handles OCR processing errors gracefully', async () => {
    const mockOcrService = OcrService.getInstance();
    (mockOcrService.processImage as jest.Mock).mockRejectedValueOnce(
      new Error('OCR processing failed')
    );

    const result = await agent.processDocument(mockDocument);

    expect(result.success).toBe(false);
    expect(result.message).toContain('OCR-Verarbeitung fehlgeschlagen');
    expect(result.error).toBeInstanceOf(ProcessingError);
  });

  // Test 6: Fehlende Pflichtfelder
  test('processDocument rejects document with missing required fields', async () => {
    const invalidDoc = {
      file: Buffer.from('test content'),
      fileName: 'test.pdf',
      // mimeType fehlt absichtlich
      fileSize: 1024,
    } as Document;

    const result = await agent.processDocument(invalidDoc);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Ungültige Dokumentdaten');
    expect(result.error).toBeInstanceOf(ProcessingError);
  });

  // Test 7: Verarbeitungszeit
  test('measures processing time correctly', async () => {
    const startTime = Date.now();
    const result = await agent.processDocument(mockDocument);
    const endTime = Date.now();

    expect(result.processingTime).toBeGreaterThanOrEqual(0);
    expect(result.processingTime).toBeLessThanOrEqual(endTime - startTime);
  });
});
