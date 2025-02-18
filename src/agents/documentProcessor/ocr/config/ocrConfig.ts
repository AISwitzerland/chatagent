export const OCR_CONFIG = {
  // GPT-4-Vision Konfiguration
  gptVision: {
    model: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.1,
    systemPrompt: `Du bist ein Experte für die Analyse von Versicherungsdokumenten, insbesondere SUVA-Formulare.
    Deine Aufgabe ist es, den gesamten Text aus dem Dokument zu extrahieren und alle wichtigen Informationen zu identifizieren.
    
    Wichtige Anweisungen:
    1. Extrahiere IMMER den kompletten Text, auch wenn das Bild nicht optimal ist
    2. Versuche auch bei schlechter Bildqualität so viel wie möglich zu erkennen
    3. Markiere unsichere Erkennungen mit [unsicher]
    4. Gib NIEMALS eine Fehlermeldung zurück, sondern extrahiere so viel wie möglich
    
    Achte besonders auf:
    - Schaden-Nummer/Unfall-Nummer
    - Persönliche Daten (Name, Geburtsdatum, AHV-Nummer)
    - Unfalldatum und -zeit
    - Unfallort und Beschreibung
    - Arbeitgeber-Informationen
    
    Formatiere die Ausgabe in klar strukturierten Abschnitten mit Überschriften.`,
  },

  // Tesseract Konfiguration (Fallback)
  tesseract: {
    languages: ['deu', 'eng'],
    workerPath: 'https://unpkg.com/tesseract.js@v5.0.3/dist/worker.min.js',
    corePath: 'https://unpkg.com/tesseract.js-core@v5.0.3/tesseract-core.wasm.js',
    logger: (message: any) => console.log(message),
  },

  // Unterstützte Dateitypen
  supportedFormats: {
    image: ['image/jpeg', 'image/png'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },

  // Verarbeitungsoptionen
  processing: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    imageOptimization: {
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 90,
      format: 'png',
    },
    timeout: 30000, // 30 Sekunden
  },

  // Dokumenttypen und deren spezifische Extraktionsregeln
  documentTypes: {
    accident_report: {
      requiredFields: ['schaden_nummer', 'name', 'unfall_datum', 'unfall_beschreibung'],
      patterns: {
        schaden_nummer: /Schaden-Nummer\s*(\d+)/i,
        ahv_nummer: /AHV-Nummer\s*([\d.]+)/i,
        unfall_datum: /(\d{1,2}\.\d{1,2}\.\d{4})/i,
        unfall_zeit: /(\d{2}:\d{2})/i,
      },
    },
    damage_report: {
      requiredFields: ['versicherungsnummer', 'name', 'schaden_datum', 'schaden_beschreibung'],
      patterns: {
        versicherungsnummer: /Versicherungsnummer\s*:\s*(\d+)/i,
        schaden_datum: /Schadensdatum\s*:\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
      },
    },
  },
};
