import sharp from 'sharp';
import { ImagePreprocessorResult, ImagePreprocessorOptions, ImageMetadata } from '../types';
import { ProcessingError } from '../../utils';
import { fromPath } from 'pdf2pic';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// OCR Processing Configuration
const PROCESSING_CONFIG = {
  imageOptimization: {
    maxWidth: 2000,
    maxHeight: 2000,
    quality: 90,
    format: 'png'
  },
  pdf: {
    density: 300,
    format: 'png'
  }
};

class ImagePreprocessor {
  private static instance: ImagePreprocessor;

  private constructor() {}

  public static getInstance(): ImagePreprocessor {
    if (!ImagePreprocessor.instance) {
      ImagePreprocessor.instance = new ImagePreprocessor();
    }
    return ImagePreprocessor.instance;
  }

  public async preprocessImage(image: Buffer, options: ImagePreprocessorOptions): Promise<ImagePreprocessorResult> {
    try {
      if (!image) {
        throw new ProcessingError(
          'Kein Bild zum Verarbeiten bereitgestellt',
          'image-preprocessing',
          null
        );
      }

      if (!options.mimeType) {
        throw new ProcessingError(
          'Kein MIME-Typ angegeben',
          'image-preprocessing',
          null
        );
      }

      // PDF-Verarbeitung
      if (options.mimeType === 'application/pdf') {
        const timestamp = Date.now();
        const tempDir = tmpdir();
        const tempPdfPath = join(tempDir, `temp-${timestamp}.pdf`);
        
        try {
          // PDF temporär speichern
          writeFileSync(tempPdfPath, image);

          const pdfOptions = {
            density: PROCESSING_CONFIG.pdf.density,
            saveFilename: `temp-${timestamp}`,
            savePath: tempDir,
            format: PROCESSING_CONFIG.pdf.format,
            width: PROCESSING_CONFIG.imageOptimization.maxWidth,
            height: PROCESSING_CONFIG.imageOptimization.maxHeight
          };

          // PDF zu PNG konvertieren
          const convert = fromPath(tempPdfPath, pdfOptions);
          const conversionResult = await convert(1);
          if (!conversionResult) {
            throw new ProcessingError(
              'PDF-Konvertierung fehlgeschlagen',
              'pdf-conversion',
              null
            );
          }

          // Log erfolgreiche Konvertierung
          console.log('PDF-Konvertierung erfolgreich:', {
            page: conversionResult.page,
            name: conversionResult.name,
            size: conversionResult.size
          });

          // Warte kurz, um sicherzustellen, dass die Datei geschrieben wurde
          await new Promise(resolve => setTimeout(resolve, 100));

          const outputPath = join(tempDir, `${pdfOptions.saveFilename}.1.png`);

          // Konvertiertes Bild einlesen und optimieren
          const processedImage = await sharp(outputPath)
            .png()
            .resize({
              width: PROCESSING_CONFIG.imageOptimization.maxWidth,
              height: PROCESSING_CONFIG.imageOptimization.maxHeight,
              fit: 'inside',
              withoutEnlargement: true
            })
            .toBuffer();

          // Metadaten zusammenstellen
          const imageMetadata: ImageMetadata = {
            format: 'png',
            width: PROCESSING_CONFIG.imageOptimization.maxWidth,
            height: PROCESSING_CONFIG.imageOptimization.maxHeight,
            quality: 1.0,
            enhancementApplied: true
          };

          return {
            processedImage,
            metadata: imageMetadata
          };

        } finally {
          // Temporäre Dateien aufräumen
          try {
            unlinkSync(tempPdfPath);
            const outputPath = join(tempDir, `temp-${timestamp}.1.png`);
            unlinkSync(outputPath);
          } catch (e) {
            console.error('Fehler beim Aufräumen temporärer Dateien:', e);
          }
        }
      }

      // Existierende Bildverarbeitung für nicht-PDF Dateien
      let sharpInstance = sharp(image);
      let metadata = await sharpInstance.metadata();
      let enhancementApplied = false;

      // Qualitätsverbesserungen anwenden, wenn gewünscht
      if (options.enhanceImage) {
        sharpInstance = sharpInstance
          .normalize()
          .sharpen()
          .gamma(1.2);
        enhancementApplied = true;
      }

      // Bild in PNG konvertieren für bessere OCR-Ergebnisse
      const processedImage = await sharpInstance
        .png({
          quality: 100,
          force: true
        })
        .toBuffer();

      // Metadaten zusammenstellen
      const imageMetadata: ImageMetadata = {
        format: metadata.format || 'unknown',
        width: metadata.width,
        height: metadata.height,
        quality: this.estimateImageQuality(metadata),
        enhancementApplied
      };

      return {
        processedImage,
        metadata: imageMetadata
      };

    } catch (error) {
      if (error instanceof ProcessingError) {
        throw error;
      }
      throw new ProcessingError(
        'Fehler bei der Bildvorverarbeitung',
        'image-preprocessing',
        error
      );
    }
  }

  public async convertToBase64(image: Buffer): Promise<string> {
    return image.toString('base64');
  }

  private estimateImageQuality(metadata: sharp.Metadata): number {
    let quality = 1.0;

    // Qualität basierend auf der Auflösung
    if (metadata.width && metadata.height) {
      const resolution = metadata.width * metadata.height;
      if (resolution < 100000) { // Weniger als 0.1 Megapixel
        quality *= 0.6;
      } else if (resolution < 1000000) { // Weniger als 1 Megapixel
        quality *= 0.8;
      }
    }

    // Qualität basierend auf dem Format
    if (metadata.format) {
      switch (metadata.format.toLowerCase()) {
        case 'jpeg':
        case 'png':
          break; // Keine Qualitätsreduktion
        case 'webp':
          quality *= 0.9;
          break;
        default:
          quality *= 0.7;
      }
    }

    // Qualität basierend auf der Farbtiefe
    const depth = typeof metadata.depth === 'number' ? metadata.depth : 8;
    if (depth < 8) {
      quality *= 0.8;
    }

    return Math.min(Math.max(quality, 0), 1); // Normalisieren auf 0-1
  }
}

export const imagePreprocessor = ImagePreprocessor.getInstance(); 