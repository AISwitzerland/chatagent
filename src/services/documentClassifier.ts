import { Database } from '../types/database';
import OpenAI from 'openai';

export type DocumentType = 'accident_report' | 'damage_report' | 'contract_change' | 'miscellaneous';

export interface ClassificationResult {
  type: DocumentType;
  confidence: number;
  extractedData: Record<string, any>;
}

export class DocumentClassifier {
  private static instance: DocumentClassifier;
  private openai: OpenAI | null = null;
  private isTestMode: boolean = false;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && !process.env.TEST_MODE) {
      this.openai = new OpenAI({ apiKey });
    }
    this.isTestMode = process.env.TEST_MODE === 'true';
  }

  public static getInstance(): DocumentClassifier {
    if (!DocumentClassifier.instance) {
      DocumentClassifier.instance = new DocumentClassifier();
    }
    return DocumentClassifier.instance;
  }

  public async classifyDocument(text: string): Promise<ClassificationResult> {
    if (!text) {
      throw new Error('Empty or invalid input');
    }

    try {
      const initialClassification = this.performInitialClassification(text);
      
      // If in test mode or no OpenAI client, return initial classification
      if (this.isTestMode || !this.openai) {
        return initialClassification;
      }

      // Only use GPT for low confidence results
      if (initialClassification.confidence < 0.8) {
        const gptResult = await this.classifyWithGPT(text);
        return this.combineResults(initialClassification, gptResult);
      }

      return initialClassification;
    } catch (error) {
      console.error('Fehler bei der Dokumentenklassifizierung:', error);
      throw error;
    }
  }

  private performInitialClassification(text: string): ClassificationResult {
    const normalizedText = text.toLowerCase();
    
    // Keywords für verschiedene Dokumenttypen mit Gewichtung
    const keywords = {
      accident_report: {
        high: ['unfall', 'kollision', 'zusammenstoß'],
        medium: ['verletzung', 'schaden', 'unfallbericht']
      },
      damage_report: {
        high: ['schadensmeldung', 'wasserschaden', 'beschädigung'],
        medium: ['schaden', 'defekt', 'reparatur', 'mangel']
      },
      contract_change: {
        high: ['vertragsänderung', 'vertragskündigung', 'vertragsanpassung'],
        medium: ['vertrag', 'änderung', 'anpassung', 'kündigung']
      }
    };

    let maxScore = 0;
    let documentType: DocumentType = 'miscellaneous';

    // Berechne Score für jeden Dokumenttyp mit gewichteten Keywords
    for (const [type, typeKeywords] of Object.entries(keywords)) {
      let score = 0;
      
      // Hochgewichtete Keywords (2 Punkte)
      typeKeywords.high.forEach(keyword => {
        if (normalizedText.includes(keyword)) score += 2;
      });
      
      // Mittelgewichtete Keywords (1 Punkt)
      typeKeywords.medium.forEach(keyword => {
        if (normalizedText.includes(keyword)) score += 1;
      });

      // Normalisiere den Score auf einen Wert zwischen 0 und 1
      const normalizedScore = Math.min(score / 6, 1);

      if (normalizedScore > maxScore) {
        maxScore = normalizedScore;
        documentType = type as DocumentType;
      }
    }

    // Extrahiere relevante Daten basierend auf dem Dokumenttyp
    const extractedData = this.extractDataByRules(text, documentType);

    return {
      type: documentType,
      confidence: maxScore,
      extractedData
    };
  }

  private async classifyWithGPT(text: string): Promise<ClassificationResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = `Klassifiziere den folgenden Text als einen der Dokumenttypen: 
    'accident_report', 'damage_report', 'contract_change', oder 'miscellaneous'.
    Extrahiere auch relevante Informationen.
    
    Text: ${text}
    
    Antworte im JSON-Format:
    {
      "type": "document_type",
      "confidence": 0.0-1.0,
      "extractedData": {
        // relevante Felder
      }
    }`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as ClassificationResult;
  }

  private extractDataByRules(text: string, type: DocumentType): Record<string, any> {
    const data: Record<string, any> = {};
    
    // Datum-Extraktion (Format: DD.MM.YYYY)
    const dateRegex = /(\d{2})\.(\d{2})\.(\d{4})/g;
    const dates = text.match(dateRegex);
    if (dates) {
      data.dates = dates;
    }

    // Spezifische Extraktionen je nach Dokumenttyp
    switch (type) {
      case 'accident_report':
        const locationRegex = /Ort:\s*([^\n]+)/i;
        const locationMatch = text.match(locationRegex);
        if (locationMatch) {
          data.location = locationMatch[1].trim();
        }
        break;

      case 'damage_report':
        const damageTypeRegex = /Schadenart:\s*([^\n]+)/i;
        const damageMatch = text.match(damageTypeRegex);
        if (damageMatch) {
          data.damageType = damageMatch[1].trim();
        }
        break;

      case 'contract_change':
        const changeTypeRegex = /Änderungsart:\s*([^\n]+)/i;
        const changeMatch = text.match(changeTypeRegex);
        if (changeMatch) {
          data.changeType = changeMatch[1].trim();
        }
        break;
    }

    return data;
  }

  private combineResults(initial: ClassificationResult, gpt: ClassificationResult): ClassificationResult {
    // Wenn GPT sehr sicher ist (> 0.9), verwende GPT-Ergebnis
    if (gpt.confidence > 0.9) {
      return gpt;
    }

    // Wenn initial sehr sicher ist (> 0.8), verwende initiales Ergebnis
    if (initial.confidence > 0.8) {
      return initial;
    }

    // Ansonsten kombiniere die Ergebnisse
    return {
      type: gpt.confidence > initial.confidence ? gpt.type : initial.type,
      confidence: Math.max(initial.confidence, gpt.confidence),
      extractedData: {
        ...initial.extractedData,
        ...gpt.extractedData
      }
    };
  }
} 