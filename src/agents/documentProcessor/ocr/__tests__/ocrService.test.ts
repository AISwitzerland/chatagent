import { OcrService } from '../ocrService';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'SUVA Schadensmeldung\nUnfalldatum: 15.02.2024\nVersicherungsnummer: 123456'
            }
          }]
        })
      }
    }
  }))
}));

describe('OcrService', () => {
  let ocrService: OcrService;
  
  beforeEach(() => {
    // Setup environment for tests
    process.env.OPENAI_API_KEY = 'test-api-key';
    ocrService = OcrService.getInstance();
  });

  afterEach(() => {
    // Cleanup environment after tests
    delete process.env.OPENAI_API_KEY;
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
    // Test-Bild laden
    const imagePath = join(__dirname, 'testData', 'sample.png');
    const imageBuffer = readFileSync(imagePath);

    const result = await ocrService.processImage(imageBuffer, {
      preferredProcessor: 'gpt4-vision',
      language: 'de'
    });

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('metadata');
    expect(result).toHaveProperty('processingTime');
    expect(result.processor).toBe('gpt4-vision');
  });

  it('should fall back to Tesseract when GPT-4 Vision is not available', async () => {
    // Temporär OPENAI_API_KEY entfernen
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    // Test-Bild laden
    const imagePath = join(__dirname, 'testData', 'sample.png');
    const imageBuffer = readFileSync(imagePath);

    try {
      const result = await ocrService.processImage(imageBuffer, {
        language: 'de'
      });

      expect(result.processor).toBe('tesseract');
    } finally {
      // OPENAI_API_KEY wiederherstellen
      process.env.OPENAI_API_KEY = originalKey;
    }
  }, 15000); // Erhöhe Timeout auf 15 Sekunden

  it('should handle processing errors gracefully', async () => {
    // Ungültiges Bild
    const invalidImage = Buffer.from('invalid image data');

    await expect(ocrService.processImage(invalidImage))
      .rejects
      .toThrow('OCR Verarbeitungsfehler');
  });
}); 