import 'openai/shims/node';
import OpenAI from 'openai';
import { isNonEmptyString, ValidationError, isErrorWithMessage } from '../types/utils';
import { DocumentClassifier } from '../documentClassifier';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  type: 'accident_report',
                  confidence: 0.9,
                  extractedData: {
                    dates: ['15.03.2024'],
                    location: 'Bahnhofstrasse 10, Zürich'
                  }
                })
              }
            }
          ]
        })
      }
    }
  }));
});

describe('DocumentClassifier', () => {
  let classifier: DocumentClassifier;

  beforeEach(() => {
    classifier = DocumentClassifier.getInstance();
  });

  describe('classifyDocument', () => {
    it('should classify accident reports correctly', async () => {
      const text = `
        Unfallbericht
        Datum: 15.03.2024
        Ort: Bahnhofstrasse 10, Zürich
        
        Am 15.03.2024 ereignete sich ein Verkehrsunfall zwischen zwei Fahrzeugen.
        Der Unfallhergang war wie folgt: Kollision beim Einparken.
        Es entstand ein Sachschaden am vorderen Kotflügel.
      `;

      const result = await classifier.classifyDocument(text);

      expect(result.type).toBe('accident_report');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.extractedData).toHaveProperty('dates');
      expect(result.extractedData).toHaveProperty('location');
      expect(result.extractedData.dates).toContain('15.03.2024');
      expect(result.extractedData.location).toContain('Bahnhofstrasse 10, Zürich');
    });

    it('should classify damage reports correctly', async () => {
      const text = `
        Schadensmeldung
        Datum: 20.03.2024
        Schadenart: Wasserschaden
        
        In der Küche wurde ein Wasserschaden festgestellt.
        Die Spülmaschine ist defekt und hat einen Wasserschaden verursacht.
      `;

      const result = await classifier.classifyDocument(text);

      expect(result.type).toBe('damage_report');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.extractedData).toHaveProperty('dates');
      expect(result.extractedData).toHaveProperty('damageType');
      expect(result.extractedData.dates).toContain('20.03.2024');
      expect(result.extractedData.damageType).toBe('Wasserschaden');
    });

    it('should classify contract changes correctly', async () => {
      const text = `
        Vertragsänderung
        Datum: 25.03.2024
        Änderungsart: Adressänderung
        
        Hiermit beantrage ich die Änderung meiner Adresse im Versicherungsvertrag.
      `;

      const result = await classifier.classifyDocument(text);

      expect(result.type).toBe('contract_change');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.extractedData).toHaveProperty('dates');
      expect(result.extractedData).toHaveProperty('changeType');
      expect(result.extractedData.dates).toContain('25.03.2024');
      expect(result.extractedData.changeType).toBe('Adressänderung');
    });

    it('should classify miscellaneous documents when no clear type is detected', async () => {
      const text = `
        Allgemeine Information
        Datum: 30.03.2024
        
        Dies ist ein allgemeines Dokument ohne spezifische Klassifizierung.
      `;

      const result = await classifier.classifyDocument(text);

      expect(result.type).toBe('miscellaneous');
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.extractedData).toHaveProperty('dates');
      expect(result.extractedData.dates).toContain('30.03.2024');
    });

    it('should handle empty or invalid input', async () => {
      await expect(classifier.classifyDocument('')).rejects.toThrow('Leerer oder ungültiger Text');
    });

    it('should extract dates in correct format', async () => {
      const text = `
        Dokument mit verschiedenen Datumsformaten
        Erstellt am: 01.04.2024
        Gültig bis: 30.04.2024
      `;

      const result = await classifier.classifyDocument(text);

      expect(result.extractedData).toHaveProperty('dates');
      expect(result.extractedData.dates).toContain('01.04.2024');
      expect(result.extractedData.dates).toContain('30.04.2024');
    });
  });
});
