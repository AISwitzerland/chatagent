export const OCR_CONFIG = {
    // GPT-4-Vision Konfiguration
    gptVision: {
        model: 'gpt-4o',
        maxTokens: 4096,
        temperature: 0.3,
        systemPrompt: `Du bist ein Experte für Dokumentenanalyse. 
    Extrahiere wichtige Informationen aus dem Dokument und 
    strukturiere sie in einem JSON-Format.`
    },
    // Tesseract Konfiguration (Fallback)
    tesseract: {
        languages: ['deu', 'eng'],
        workerPath: 'https://unpkg.com/tesseract.js@v5.0.3/dist/worker.min.js',
        corePath: 'https://unpkg.com/tesseract.js-core@v5.0.3/tesseract-core.wasm.js',
        logger: (message) => console.log(message)
    },
    // Unterstützte Dateitypen
    supportedFormats: {
        image: ['image/jpeg', 'image/png'],
        document: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
    },
    // Verarbeitungsoptionen
    processing: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        imageOptimization: {
            maxWidth: 2000,
            maxHeight: 2000,
            quality: 90,
            format: 'png'
        },
        timeout: 30000 // 30 Sekunden
    },
    // Dokumenttypen und deren spezifische Extraktionsregeln
    documentTypes: {
        insurance_policy: {
            requiredFields: ['policy_number', 'insured_person', 'coverage_amount'],
            patterns: {
                policy_number: /Policen(?:-|\s)?(?:Nr|Nummer)\.?\s*[:.]?\s*(\w+)/i,
                coverage_amount: /(?:Versicherungssumme|Deckung)\s*[:.]?\s*(?:CHF|EUR|USD)?\s*([\d.,]+)/i
            }
        },
        claim_report: {
            requiredFields: ['claim_number', 'incident_date', 'damage_description'],
            patterns: {
                claim_number: /Schaden(?:-|\s)?(?:Nr|Nummer)\.?\s*[:.]?\s*(\w+)/i,
                incident_date: /(?:Unfall|Schadens)datum\s*[:.]?\s*(\d{1,2}\.?\s*\d{1,2}\.?\s*\d{2,4})/i
            }
        }
    }
};
