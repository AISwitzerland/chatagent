import { ImagePreprocessor } from '../imagePreprocessor';
import { ProcessingError } from '../../../utils';
import sharp from 'sharp';

describe('ImagePreprocessor', () => {
  let imagePreprocessor: ImagePreprocessor;

  beforeEach(() => {
    imagePreprocessor = new ImagePreprocessor();
  });

  describe('preprocessImage', () => {
    // PDF Tests
    it('should handle PDF documents correctly', async () => {
      // Mock PDF buffer
      const pdfBuffer = Buffer.from('fake pdf content');
      const mimeType = 'application/pdf';

      const result = await imagePreprocessor.preprocessImage(pdfBuffer, mimeType);

      expect(result).toEqual({
        processedImage: pdfBuffer,
        metadata: {
          format: 'pdf',
          quality: 1.0,
          enhancementApplied: false
        }
      });
    });

    // Image Tests
    it('should process JPEG images correctly', async () => {
      // Create a test image using sharp
      const imageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
      .jpeg()
      .toBuffer();

      const result = await imagePreprocessor.preprocessImage(imageBuffer, 'image/jpeg');

      expect(result.processedImage).toBeInstanceOf(Buffer);
      expect(result.metadata).toEqual(expect.objectContaining({
        format: expect.any(String),
        width: expect.any(Number),
        height: expect.any(Number),
        quality: expect.any(Number),
        enhancementApplied: true
      }));
    });

    it('should process PNG images correctly', async () => {
      // Create a test image using sharp
      const imageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .png()
      .toBuffer();

      const result = await imagePreprocessor.preprocessImage(imageBuffer, 'image/png');

      expect(result.processedImage).toBeInstanceOf(Buffer);
      expect(result.metadata).toEqual(expect.objectContaining({
        format: expect.any(String),
        width: expect.any(Number),
        height: expect.any(Number),
        quality: expect.any(Number),
        enhancementApplied: true
      }));
    });

    // Error Cases
    it('should throw error for missing document', async () => {
      await expect(imagePreprocessor.preprocessImage(null as any, 'image/jpeg'))
        .rejects
        .toThrow(ProcessingError);
    });

    it('should throw error for missing mime type', async () => {
      const imageBuffer = Buffer.from('test');
      await expect(imagePreprocessor.preprocessImage(imageBuffer, null as any))
        .rejects
        .toThrow(ProcessingError);
    });

    it('should throw error for unsupported image type', async () => {
      const imageBuffer = Buffer.from('test');
      await expect(imagePreprocessor.preprocessImage(imageBuffer, 'image/gif'))
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