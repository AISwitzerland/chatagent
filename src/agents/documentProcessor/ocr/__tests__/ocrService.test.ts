import { OcrService } from '../ocrService';
import { OcrOptions } from '../types';
import { imagePreprocessor } from '../utils/imagePreprocessor';

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content:
                  'SUVA Schadensmeldung\nUnfalldatum: 15.02.2024\nVersicherungsnummer: 123456',
              },
            },
          ],
        }),
      },
    },
  })),
}));

// Mock imagePreprocessor
jest.mock('../utils/imagePreprocessor', () => ({
  imagePreprocessor: {
    preprocessImage: jest.fn().mockResolvedValue({
      processedImage: Buffer.from('mocked-processed-image'),
      metadata: {
        format: 'jpeg',
        width: 800,
        height: 600,
        quality: 0.9,
        enhancementApplied: true,
      },
    }),
    convertToBase64: jest.fn().mockReturnValue('mocked-base64-image'),
  },
}));

// Mock Tesseract.js
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockResolvedValue({
    reinitialize: jest.fn().mockResolvedValue(undefined),
    recognize: jest.fn().mockResolvedValue({
      data: {
        text: 'Tesseract OCR Ergebnis',
        confidence: 85.5,
      },
    }),
    terminate: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('OcrService', () => {
  let ocrService: OcrService;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalApiKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'test-api-key';
    ocrService = OcrService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
    jest.clearAllMocks();
  });

  it('should be a singleton', () => {
    const instance1 = OcrService.getInstance();
    const instance2 = OcrService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should list available processors', async () => {
    const processors = await ocrService.getAvailableProcessors();
    expect(processors).toBeInstanceOf(Array);
    expect(processors.length).toBeGreaterThan(0);
  });

  it('should process image with GPT-4 Vision when available', async () => {
    // Erstelle ein Test-Bild (1x1 schwarzer Pixel)
    const testImage = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
      0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0x60,
      0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const options: OcrOptions = {
      language: 'de',
      enhanceImage: true,
      documentContext: {
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: testImage.length,
      },
    };

    const result = await ocrService.processImage(testImage, options);
    expect(result.text).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.processor).toBe('gpt4-vision');
  });

  it('should fall back to Tesseract when GPT-4 Vision is not available', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = '';

    const testImage = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
      0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0x60,
      0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const options: OcrOptions = {
      language: 'de',
      enhanceImage: true,
      documentContext: {
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: testImage.length,
      },
    };

    const result = await ocrService.processImage(testImage, options);
    expect(result.text).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.processor).toBe('tesseract');

    process.env.OPENAI_API_KEY = originalKey;
  });

  it('should handle processing errors gracefully', async () => {
    // Mock imagePreprocessor to throw an error
    (imagePreprocessor.preprocessImage as jest.Mock).mockRejectedValueOnce(
      new Error('Fehler bei der Bildvorverarbeitung')
    );

    const invalidImage = Buffer.from([0x00]); // Ungültiges Bild
    const options: OcrOptions = {
      language: 'de',
      enhanceImage: true,
      documentContext: {
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1,
      },
    };

    await expect(ocrService.processImage(invalidImage, options)).rejects.toThrow(
      /Verarbeitungsfehler/
    );
  });

  it('should work without optional fields', async () => {
    const testImage = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
      0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0x60,
      0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const options: OcrOptions = {
      documentContext: {
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: testImage.length,
      },
    };

    const result = await ocrService.processImage(testImage, options);
    expect(result.text).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });
});
