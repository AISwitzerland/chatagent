import { DocumentContext, ProcessingContext } from '../types';

/**
 * Unterstützte OCR-Prozessoren
 * @description Definiert die verfügbaren OCR-Verarbeitungsmethoden
 */
export type OcrProcessorType = 'gpt4-vision' | 'tesseract';

/**
 * Unterstützte Sprachen für die OCR-Verarbeitung
 * @description ISO 639-1 Sprachcodes der unterstützten Sprachen
 */
export type SupportedOcrLanguages = 'de' | 'en' | 'fr' | 'it';

/**
 * Metadaten für verarbeitete Bilder
 * @description Enthält technische Details und Qualitätsmetriken des verarbeiteten Bildes
 */
export interface ImageMetadata {
  /** Bildformat (z.B. 'jpeg', 'png') */
  format: string;
  /** Bildbreite in Pixeln */
  width?: number;
  /** Bildhöhe in Pixeln */
  height?: number;
  /** Bildqualität (0-1) */
  quality?: number;
  /** Gibt an, ob Bildverbesserungen angewendet wurden */
  enhancementApplied?: boolean;
  /** Konfidenz der OCR-Erkennung (0-1) */
  ocrConfidence?: number;
  /** Zusätzlicher Dokumentkontext */
  documentContext?: DocumentContext;
}

/**
 * Optionen für die Bildvorverarbeitung
 * @description Konfigurationsoptionen für die Vorverarbeitung von Bildern vor der OCR
 */
export interface ImagePreprocessorOptions {
  /** MIME-Typ des Eingabebildes */
  mimeType: string;
  /** Aktiviert zusätzliche Bildverbesserungen */
  enhanceImage?: boolean;
  /** Minimale Qualitätsschwelle (0-1) */
  minQuality?: number;
}

/**
 * Ergebnis der Bildvorverarbeitung
 * @description Enthält das verarbeitete Bild und zugehörige Metadaten
 */
export interface ImagePreprocessorResult {
  /** Verarbeitetes Bild als Buffer */
  processedImage: Buffer;
  /** Metadaten der Bildverarbeitung */
  metadata: ImageMetadata;
}

/**
 * Konfigurationsoptionen für die OCR-Verarbeitung
 * @description Definiert die Parameter für die Texterkennung und Dokumentenverarbeitung
 */
export interface OcrOptions {
  /** Sprache des zu erkennenden Texts */
  language?: SupportedOcrLanguages;
  /** Aktiviert zusätzliche Bildverbesserungen vor der OCR */
  enhanceImage?: boolean;
  /** Minimale Qualitätsschwelle für die Erkennung (0-1) */
  minQuality?: number;
  /** Bevorzugter OCR-Processor */
  preferredProcessor?: OcrProcessorType;
  /** Kontext des zu verarbeitenden Dokuments */
  documentContext?: DocumentContext;
}

/**
 * Ergebnis der OCR-Verarbeitung
 * @description Enthält den erkannten Text und zugehörige Verarbeitungsinformationen
 */
export interface OcrResult {
  /** Erkannter Text */
  text: string;
  /** Konfidenz der Texterkennung (0-1) */
  confidence: number;
  /** Metadaten der Bildverarbeitung */
  metadata: ImageMetadata;
  /** Verarbeitungszeit in Millisekunden */
  processingTime: number;
  /** Verwendeter OCR-Processor */
  processor: OcrProcessorType;
  /** Verarbeitungskontext */
  context: ProcessingContext;
}

/**
 * Interface für OCR-Prozessoren
 * @description Definiert die Schnittstelle, die alle OCR-Prozessoren implementieren müssen
 */
export interface OcrProcessor {
  /** Gibt den Namen des Processors zurück */
  getName(): string;
  /** Prüft, ob der Processor verfügbar ist */
  isAvailable(): Promise<boolean>;
  /** Verarbeitet ein Bild und extrahiert Text */
  processImage(image: Buffer, options: OcrOptions): Promise<OcrResult>;
  /** Optional: Räumt Ressourcen auf */
  cleanup?(): Promise<void>;
} 