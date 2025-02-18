import { IntentPattern, SupportedLanguages } from '../types';

// Basis Intent-Patterns
export const intentPatterns: IntentPattern[] = [
  {
    intent: 'information_request',
    patterns: [
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
    responses: {
      de: 'Ich helfe Ihnen gerne mit Informationen.',
      en: "I'll help you with information.",
      fr: 'Je vous aide volontiers avec des informations.',
      it: 'Vi aiuto volentieri con le informazioni.',
    },
  },
  {
    intent: 'price_inquiry',
    patterns: [
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
  },
  {
    intent: 'claim_report',
    patterns: [
      'schaden',
      'unfall',
      'schadenfall',
      'melden',
      'beschädigt',
      'gestohlen',
      'verloren',
      'kaputt',
    ],
  },
];

// Mehrsprachige Intent-Patterns
export const MULTILINGUAL_INTENT_PATTERNS: Record<SupportedLanguages, any> = {
  de: {
    INFORMATION: {
      keywords: ['information', 'erklären', 'verstehen'],
    },
    CLAIM: {
      keywords: ['schaden', 'unfall', 'melden'],
    },
  },
  en: {
    INFORMATION: {
      keywords: ['information', 'explain', 'understand'],
    },
    CLAIM: {
      keywords: ['damage', 'accident', 'report'],
    },
  },
  fr: {
    INFORMATION: {
      keywords: ['information', 'expliquer', 'comprendre'],
    },
    CLAIM: {
      keywords: ['dommage', 'accident', 'signaler'],
    },
  },
  it: {
    INFORMATION: {
      keywords: ['informazione', 'spiegare', 'capire'],
    },
    CLAIM: {
      keywords: ['danno', 'incidente', 'segnalare'],
    },
  },
};

// Dringlichkeits-Indikatoren
export const URGENCY_INDICATORS = {
  high: {
    de: ['sofort', 'dringend', 'notfall'],
    en: ['immediately', 'urgent', 'emergency'],
    fr: ['immédiatement', 'urgent', 'urgence'],
    it: ['immediatamente', 'urgente', 'emergenza'],
  },
  medium: {
    de: ['bald', 'zeitnah', 'wichtig'],
    en: ['soon', 'important', 'timely'],
    fr: ['bientôt', 'important', 'rapidement'],
    it: ['presto', 'importante', 'tempestivo'],
  },
};
