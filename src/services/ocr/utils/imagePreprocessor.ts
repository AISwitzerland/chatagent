import sharp from 'sharp';
import { OCR_CONFIG } from '../config/ocrConfig.js';
import { ProcessingError } from '../types/ocrTypes.js';
import { fromPath } from 'pdf2pic';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export class ImagePreprocessor {
  async preprocessImage(
    buffer: Buffer,
    mimeType: string
  ): Promise<Buffer> {
    try {
      // Wenn es sich um ein PDF handelt, konvertieren wir es zu einem Bild
      if (mimeType === 'application/pdf') {
        const timestamp = Date.now();
        const tempDir = tmpdir();
        const tempPdfPath = join(tempDir, `temp-${timestamp}.pdf`);
        const tempPngPath = join(tempDir, `temp-${timestamp}.png`);
        
        try {
          // PDF temporär speichern
          writeFileSync(tempPdfPath, buffer);
          console.log('PDF gespeichert unter:', tempPdfPath);

          const options = {
            density: 300,
            saveFilename: `temp-${timestamp}`,
            savePath: tempDir,
            format: "png",
            width: OCR_CONFIG.processing.imageOptimization.maxWidth,
            height: OCR_CONFIG.processing.imageOptimization.maxHeight
          };

          console.log('Konvertiere PDF mit Optionen:', options);

          // PDF zu PNG konvertieren
          const convert = fromPath(tempPdfPath, options);
          const result = await convert(1);
          
          console.log('Konvertierungsergebnis:', result);

          // Warte kurz, um sicherzustellen, dass die Datei geschrieben wurde
          await new Promise(resolve => setTimeout(resolve, 100));

          const outputPath = join(tempDir, `${options.saveFilename}.1.png`);
          console.log('Erwarteter Ausgabepfad:', outputPath);

          // Konvertiertes Bild einlesen und optimieren
          const sharpBuffer = await sharp(outputPath)
            .png()
            .resize({
              width: OCR_CONFIG.processing.imageOptimization.maxWidth,
              height: OCR_CONFIG.processing.imageOptimization.maxHeight,
              fit: 'inside',
              withoutEnlargement: true
            })
            .toBuffer();

          return sharpBuffer;
        } finally {
          // Temporäre Dateien aufräumen
          try {
            if (tempPdfPath) unlinkSync(tempPdfPath);
            const outputPath = join(tempDir, `temp-${timestamp}.1.png`);
            if (outputPath) unlinkSync(outputPath);
          } catch (e) {
            console.error('Fehler beim Aufräumen temporärer Dateien:', e);
          }
        }
      }

      const config = OCR_CONFIG.processing.imageOptimization;
      
      // Sharp-Instance erstellen
      let image = sharp(buffer);

      // Metadata abrufen
      const metadata = await image.metadata();

      // Bildoptimierung durchführen
      image = image
        .resize({
          width: config.maxWidth,
          height: config.maxHeight,
          fit: 'inside',
          withoutEnlargement: true
        })
        .normalize() // Kontrast automatisch optimieren
        .sharpen() // Schärfe verbessern
        .gamma(1.1); // Leichte Gamma-Korrektur für bessere Texterkennung

      // Format basierend auf Eingabetyp wählen
      if (mimeType === 'image/jpeg') {
        image = image.jpeg({ quality: config.quality });
      } else {
        image = image.png({ quality: config.quality });
      }

      // Verarbeitetes Bild als Buffer zurückgeben
      return await image.toBuffer();

    } catch (error: any) {
      const processingError: ProcessingError = new Error(
        `Bildvorverarbeitung fehlgeschlagen: ${error.message}`
      ) as ProcessingError;
      processingError.code = 'PROCESSING_ERROR';
      processingError.details = error;
      throw processingError;
    }
  }

  async convertToBase64(buffer: Buffer): Promise<string> {
    return buffer.toString('base64');
  }

  // Hilfsmethode zur Qualitätsprüfung
  async checkImageQuality(buffer: Buffer, mimeType: string): Promise<{
    quality: number;
    warnings: string[];
  }> {
    try {
      // Für PDFs geben wir einen Standard-Qualitätswert zurück
      if (mimeType === 'application/pdf') {
        return {
          quality: 1.0,
          warnings: []
        };
      }

      const metadata = await sharp(buffer).metadata();
      const warnings: string[] = [];
      let qualityScore = 1.0;

      // Größenprüfung
      if (metadata.width && metadata.width < 800) {
        warnings.push('Bildbreite könnte zu klein sein für optimale OCR-Ergebnisse');
        qualityScore *= 0.8;
      }

      if (metadata.height && metadata.height < 800) {
        warnings.push('Bildhöhe könnte zu klein sein für optimale OCR-Ergebnisse');
        qualityScore *= 0.8;
      }

      // Format- und Qualitätsprüfung für JPEG
      if (metadata.format === 'jpeg' && metadata.width && metadata.height) {
        // Schätzen der JPEG-Qualität basierend auf der Dateigröße
        const estimatedQuality = Math.min(100, Math.floor((buffer.length / (metadata.width * metadata.height)) * 100));
        if (estimatedQuality < 70) {
          warnings.push('JPEG-Qualität könnte zu niedrig sein');
          qualityScore *= 0.9;
        }
      }

      return {
        quality: qualityScore,
        warnings
      };

    } catch (error: any) {
      const processingError: ProcessingError = new Error(
        `Qualitätsprüfung fehlgeschlagen: ${error.message}`
      ) as ProcessingError;
      processingError.code = 'PROCESSING_ERROR';
      processingError.details = error;
      throw processingError;
    }
  }
}

export const imagePreprocessor = new ImagePreprocessor();