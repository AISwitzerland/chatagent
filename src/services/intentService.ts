import { Intent, IntentCategory, IntentEntity, SupportedLanguages, IntentPattern } from '../types';
import { MULTILINGUAL_INTENT_PATTERNS, URGENCY_INDICATORS } from '@/data/intentPatterns';
import { intentPatterns } from '../data/intentPatterns';

// Definieren der Intent-Patterns
const INTENT_PATTERNS = {
  INFORMATION: {
    keywords: [
      'information',
      'info',
      'details',
      'erklären',
      'wie funktioniert',
      'was ist',
      'bedeutet',
      'verstehen',
      'wissen',
    ],
    insuranceTypes: [
      'krankenversicherung',
      'hausrat',
      'haftpflicht',
      'auto',
      'leben',
      'unfall',
      'rechtsschutz',
    ],
  },
  PRICE: {
    keywords: [
      'preis',
      'kosten',
      'prämie',
      'offerte',
      'angebot',
      'rabatt',
      'sparen',
      'günstiger',
      'teuer',
      'bezahlen',
    ],
    amounts: ['chf', 'franken', 'fr.', '%', 'prozent'],
  },
  CLAIM: {
    keywords: [
      'schaden',
      'unfall',
      'schadenfall',
      'melden',
      'beschädigt',
      'gestohlen',
      'verloren',
      'kaputt',
    ],
    urgencyIndicators: ['sofort', 'dringend', 'notfall', 'schnell', 'eilig'],
  },
  COVERAGE: {
    keywords: [
      'deckung',
      'versichert',
      'abgedeckt',
      'geltungsbereich',
      'leistung',
      'eingeschlossen',
      'ausgeschlossen',
    ],
  },
  DOCUMENT: {
    keywords: [
      'dokument',
      'police',
      'vertrag',
      'bescheinigung',
      'nachweis',
      'formular',
      'unterlagen',
    ],
    documentTypes: ['versicherungsschein', 'rechnung', 'quittung', 'antrag', 'kündigung'],
  },
  COMPLAINT: {
    keywords: ['beschwerde', 'unzufrieden', 'problem', 'ärger', 'fehler', 'falsch', 'reklamation'],
    sentimentIndicators: ['enttäuscht', 'verärgert', 'wütend', 'nicht okay', 'schlecht'],
  },
  CHANGE: {
    keywords: [
      'ändern',
      'anpassen',
      'wechseln',
      'aktualisieren',
      'umziehen',
      'umzug',
      'adressänderung',
    ],
    changeTypes: ['adresse', 'franchise', 'deckung', 'zahlungsweise', 'bank'],
  },
  CANCELLATION: {
    keywords: [
      'kündigen',
      'stornieren',
      'beenden',
      'auflösen',
      'widerruf',
      'rücktritt',
      'aussteigen',
    ],
  },
  EMERGENCY: {
    keywords: ['notfall', 'sofort', 'dringend', 'hilfe', 'gefahr', 'lebensbedrohlich', 'akut'],
  },
  TECHNICAL: {
    keywords: ['login', 'anmelden', 'passwort', 'zugang', 'app', 'website', 'portal', 'online'],
  },
};

export async function detectIntents(
  message: string,
  language: SupportedLanguages = 'de'
): Promise<Intent[]> {
  const normalizedMessage = message.toLowerCase();
  const patterns = MULTILINGUAL_INTENT_PATTERNS[language];
  const intents: Intent[] = [];

  // Durchsuche nach allen möglichen Intents in der entsprechenden Sprache
  for (const [category, categoryPatterns] of Object.entries(patterns)) {
    const confidence = calculateIntentConfidence(normalizedMessage, categoryPatterns, language);
    if (confidence > 0.3) {
      const entities = extractEntities(normalizedMessage, categoryPatterns, language);
      const urgency = determineUrgency(normalizedMessage, category as IntentCategory, language);

      intents.push({
        category: category as IntentCategory,
        confidence,
        entities,
        urgency,
        subCategory: determineSubCategory(category as IntentCategory, entities),
      });
    }
  }

  return intents.sort((a, b) => b.confidence - a.confidence);
}

function calculateIntentConfidence(
  message: string,
  patterns: any,
  language: SupportedLanguages
): number {
  let matchCount = 0;
  let totalPatterns = 0;

  // Prüfe Keywords
  for (const keyword of patterns.keywords) {
    if (message.includes(keyword)) matchCount++;
    totalPatterns++;
  }

  // Prüfe zusätzliche Pattern-Kategorien
  for (const [key, values] of Object.entries(patterns)) {
    if (key === 'keywords') continue;
    for (const value of values as string[]) {
      if (message.includes(value)) matchCount++;
      totalPatterns++;
    }
  }

  return matchCount / totalPatterns;
}

function extractEntities(
  message: string,
  patterns: any,
  language: SupportedLanguages
): IntentEntity[] {
  const entities: IntentEntity[] = [];

  // Versicherungstypen erkennen
  if (patterns.insuranceTypes) {
    for (const type of patterns.insuranceTypes) {
      if (message.includes(type)) {
        entities.push({
          type: 'insurance_type',
          value: type,
          confidence: 0.9,
        });
      }
    }
  }

  // Dokumenttypen erkennen
  if (patterns.documentTypes) {
    for (const type of patterns.documentTypes) {
      if (message.includes(type)) {
        entities.push({
          type: 'document_type',
          value: type,
          confidence: 0.9,
        });
      }
    }
  }

  // Beträge erkennen
  const amountRegex = /(\d+(?:['']?\d{3})*(?:\.\d{2})?)\s*(?:CHF|Fr\.|Franken|%)/gi;
  const amounts = message.match(amountRegex);
  if (amounts) {
    amounts.forEach(amount => {
      entities.push({
        type: 'amount',
        value: amount,
        confidence: 0.95,
      });
    });
  }

  // Datumsangaben erkennen
  const dateRegex = /\d{1,2}\.\d{1,2}\.\d{2,4}|\d{4}-\d{2}-\d{2}/g;
  const dates = message.match(dateRegex);
  if (dates) {
    dates.forEach(date => {
      entities.push({
        type: 'date',
        value: date,
        confidence: 0.95,
      });
    });
  }

  return entities;
}

function determineUrgency(
  message: string,
  category: IntentCategory,
  language: SupportedLanguages
): 'low' | 'medium' | 'high' {
  const highUrgencyKeywords = URGENCY_INDICATORS.high[language];
  const mediumUrgencyKeywords = URGENCY_INDICATORS.medium[language];

  if (category === 'EMERGENCY' || highUrgencyKeywords.some(keyword => message.includes(keyword))) {
    return 'high';
  }
  if (category === 'CLAIM' || mediumUrgencyKeywords.some(keyword => message.includes(keyword))) {
    return 'medium';
  }
  return 'low';
}

function determineSubCategory(
  category: IntentCategory,
  entities: IntentEntity[]
): string | undefined {
  const insuranceType = entities.find(e => e.type === 'insurance_type')?.value;
  const documentType = entities.find(e => e.type === 'document_type')?.value;

  switch (category) {
    case 'INFORMATION':
    case 'PRICE':
    case 'COVERAGE':
      return insuranceType;
    case 'DOCUMENT':
      return documentType;
    default:
      return undefined;
  }
}

export async function processIntent(message: string): Promise<string | null> {
  try {
    const normalizedMessage = message.toLowerCase();

    // Einfache Pattern-Matching für Intents
    for (const pattern of intentPatterns) {
      if (pattern.patterns.some(p => normalizedMessage.includes(p))) {
        return pattern.intent;
      }
    }

    // Wenn kein spezifischer Intent erkannt wurde
    return 'general_query';
  } catch (error) {
    console.error('Fehler bei der Intent-Erkennung:', error);
    return null;
  }
}

export function getResponseForIntent(intent: string, language: string = 'de'): string {
  // TODO: Implementiere Intent-basierte Antworten
  return 'Ich verstehe Ihr Anliegen. Wie kann ich Ihnen weiterhelfen?';
}
