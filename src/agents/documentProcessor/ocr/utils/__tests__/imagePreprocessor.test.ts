import { imagePreprocessor } from '../imagePreprocessor';
import { ProcessingError } from '../../../utils';
import sharp from 'sharp';
import { fromPath } from 'pdf2pic';

// Mock sharp
jest.mock('sharp', () => {
  const mockSharp = {
    metadata: jest.fn().mockResolvedValue({
      format: 'png',
      width: 100,
      height: 100,
      depth: 8
    }),
    normalize: jest.fn().mockReturnThis(),
    sharpen: jest.fn().mockReturnThis(),
    gamma: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image'))
  };
  return jest.fn(() => mockSharp);
});

// Mock fs functions
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn(() => Buffer.from('test-file-content'))
}));

// Mock pdf2pic
jest.mock('pdf2pic', () => ({
  fromPath: jest.fn(() => jest.fn().mockResolvedValue({
    page: 1,
    name: 'test',
    size: 1024,
    path: '/tmp/test.png'
  }))
}));

// Mock os
jest.mock('os', () => ({
  tmpdir: jest.fn(() => '/tmp')
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/'))
}));

describe('ImagePreprocessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('preprocessImage', () => {
    it('should throw an error when no image is provided', async () => {
      await expect(imagePreprocessor.preprocessImage(null as any, { mimeType: 'image/jpeg' }))
        .rejects
        .toThrow('Kein Bild zum Verarbeiten bereitgestellt');
    });

    it('should throw an error when no MIME type is provided', async () => {
      const buffer = Buffer.from('test');
      await expect(imagePreprocessor.preprocessImage(buffer, { mimeType: '' }))
        .rejects
        .toThrow('Kein MIME-Typ angegeben');
    });

    it('should process a valid image', async () => {
      const testImage = Buffer.from('test-image');
      const result = await imagePreprocessor.preprocessImage(testImage, {
        mimeType: 'image/png',
        enhanceImage: true
      });

      expect(result).toHaveProperty('processedImage');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('format', 'png');
      expect(result.metadata).toHaveProperty('enhancementApplied', true);
      expect(sharp).toHaveBeenCalledWith(testImage);
    });

    it('should handle PDF documents correctly', async () => {
      const pdfBuffer = Buffer.from('test-pdf');
      const result = await imagePreprocessor.preprocessImage(pdfBuffer, {
        mimeType: 'application/pdf',
        enhanceImage: true
      });

      expect(result).toHaveProperty('processedImage');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('format', 'png');
      expect(result.metadata).toHaveProperty('enhancementApplied', true);
      expect(fromPath).toHaveBeenCalled();
    });

    it('should process JPEG images correctly', async () => {
      const imageBuffer = Buffer.from('test');
      const result = await imagePreprocessor.preprocessImage(imageBuffer, {
        mimeType: 'image/jpeg',
        enhanceImage: true
      });

      expect(result).toHaveProperty('processedImage');
      expect(result).toHaveProperty('metadata');
    });

    it('should process PNG images correctly', async () => {
      const imageBuffer = Buffer.from('test');
      const result = await imagePreprocessor.preprocessImage(imageBuffer, {
        mimeType: 'image/png',
        enhanceImage: true
      });

      expect(result).toHaveProperty('processedImage');
      expect(result).toHaveProperty('metadata');
    });

    it('should throw error for unsupported image type', async () => {
      const imageBuffer = Buffer.from('test');
      await expect(imagePreprocessor.preprocessImage(imageBuffer, {
        mimeType: 'image/unsupported'
      }))
      .rejects
      .toThrow(ProcessingError);
    });
  });

  describe('convertToBase64', () => {
    it('should convert buffer to base64 string', async () => {
      const buffer = Buffer.from('test');
      const base64 = await imagePreprocessor.convertToBase64(buffer);
      expect(base64).toBe('dGVzdA==');
    });
  });
});
