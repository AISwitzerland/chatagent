import sharp from 'sharp';
import { OCR_CONFIG } from '../config/ocrConfig.js';
export class ImagePreprocessor {
    async preprocessImage(buffer, mimeType) {
        try {
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
            }
            else {
                image = image.png({ quality: config.quality });
            }
            // Verarbeitetes Bild als Buffer zurückgeben
            return await image.toBuffer();
        }
        catch (error) {
            const processingError = new Error(`Bildvorverarbeitung fehlgeschlagen: ${error.message}`);
            processingError.code = 'PROCESSING_ERROR';
            processingError.details = error;
            throw processingError;
        }
    }
    async convertToBase64(buffer) {
        return buffer.toString('base64');
    }
    // Hilfsmethode zur Qualitätsprüfung
    async checkImageQuality(buffer) {
        try {
            const metadata = await sharp(buffer).metadata();
            const warnings = [];
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
        }
        catch (error) {
            const processingError = new Error(`Qualitätsprüfung fehlgeschlagen: ${error.message}`);
            processingError.code = 'PROCESSING_ERROR';
            processingError.details = error;
            throw processingError;
        }
    }
}
export const imagePreprocessor = new ImagePreprocessor();
