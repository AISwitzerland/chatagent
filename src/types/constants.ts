import { SupportedLanguages, InsuranceType, DocumentStatus, ProcessingStatus } from './index';

// Language Constants
export const SUPPORTED_LANGUAGES: readonly SupportedLanguages[] = ['de', 'fr', 'it', 'en'] as const;
export const DEFAULT_LANGUAGE: SupportedLanguages = 'de';

// File Upload Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = {
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  images: ['image/jpeg', 'image/png'],
  all: [] as string[],
};

// Initialize ALLOWED_FILE_TYPES.all
ALLOWED_FILE_TYPES.all = [...ALLOWED_FILE_TYPES.documents, ...ALLOWED_FILE_TYPES.images];

// Insurance Types Configuration
export const INSURANCE_TYPES: Record<
  InsuranceType,
  {
    code: string;
    nameByLang: Record<SupportedLanguages, string>;
    description: Record<SupportedLanguages, string>;
  }
> = {
  life: {
    code: 'LIFE',
    nameByLang: {
      de: 'Lebensversicherung',
      fr: 'Assurance vie',
      it: 'Assicurazione vita',
      en: 'Life Insurance',
    },
    description: {
      de: 'Finanzielle Absicherung für Sie und Ihre Angehörigen',
      fr: 'Protection financière pour vous et vos proches',
      it: 'Protezione finanziaria per voi e i vostri cari',
      en: 'Financial protection for you and your loved ones',
    },
  },
  health: {
    code: 'HEALTH',
    nameByLang: {
      de: 'Krankenversicherung',
      fr: 'Assurance maladie',
      it: 'Assicurazione malattia',
      en: 'Health Insurance',
    },
    description: {
      de: 'Umfassende Gesundheitsvorsorge',
      fr: 'Couverture santé complète',
      it: 'Copertura sanitaria completa',
      en: 'Comprehensive health coverage',
    },
  },
  property: {
    code: 'PROPERTY',
    nameByLang: {
      de: 'Sachversicherung',
      fr: 'Assurance des biens',
      it: 'Assicurazione proprietà',
      en: 'Property Insurance',
    },
    description: {
      de: 'Schutz für Ihr Eigentum',
      fr: 'Protection de vos biens',
      it: 'Protezione per i vostri beni',
      en: 'Protection for your property',
    },
  },
  liability: {
    code: 'LIABILITY',
    nameByLang: {
      de: 'Haftpflichtversicherung',
      fr: 'Assurance responsabilité civile',
      it: 'Assicurazione responsabilità civile',
      en: 'Liability Insurance',
    },
    description: {
      de: 'Absicherung gegen Schadenersatzansprüche',
      fr: 'Protection contre les réclamations',
      it: 'Protezione contro richieste di risarcimento',
      en: 'Protection against liability claims',
    },
  },
  vehicle: {
    code: 'VEHICLE',
    nameByLang: {
      de: 'Fahrzeugversicherung',
      fr: 'Assurance véhicule',
      it: 'Assicurazione veicolo',
      en: 'Vehicle Insurance',
    },
    description: {
      de: 'Umfassender Schutz für Ihr Fahrzeug',
      fr: 'Protection complète pour votre véhicule',
      it: 'Protezione completa per il vostro veicolo',
      en: 'Comprehensive coverage for your vehicle',
    },
  },
};

// Status Mappings
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, Record<SupportedLanguages, string>> = {
  pending: {
    de: 'In Bearbeitung',
    fr: 'En cours',
    it: 'In elaborazione',
    en: 'Pending',
  },
  verified: {
    de: 'Verifiziert',
    fr: 'Vérifié',
    it: 'Verificato',
    en: 'Verified',
  },
  rejected: {
    de: 'Abgelehnt',
    fr: 'Rejeté',
    it: 'Respinto',
    en: 'Rejected',
  },
};

export const PROCESSING_STATUS_LABELS: Record<
  ProcessingStatus,
  Record<SupportedLanguages, string>
> = {
  uploading: {
    de: 'Wird hochgeladen',
    fr: 'Téléchargement',
    it: 'Caricamento',
    en: 'Uploading',
  },
  processing: {
    de: 'Wird verarbeitet',
    fr: 'Traitement',
    it: 'Elaborazione',
    en: 'Processing',
  },
  completed: {
    de: 'Abgeschlossen',
    fr: 'Terminé',
    it: 'Completato',
    en: 'Completed',
  },
  error: {
    de: 'Fehler',
    fr: 'Erreur',
    it: 'Errore',
    en: 'Error',
  },
};

// Validation Constants
export const VALIDATION = {
  password: {
    minLength: 8,
    maxLength: 100,
    requireNumbers: true,
    requireSpecialChars: true,
    requireUppercase: true,
    requireLowercase: true,
  },
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },
  phone: {
    pattern: /^(\+41|0041|0)([1-9]\d{8})$/,
    example: '+41791234567',
  },
  email: {
    maxLength: 255,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
} as const;

// API Constants
export const API = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

// Cache Constants
export const CACHE = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Maximum number of items in cache
} as const;
