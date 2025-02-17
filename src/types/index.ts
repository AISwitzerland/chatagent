export type SupportedLanguages = 'de' | 'fr' | 'it' | 'en';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  attachments?: string[];
  intent?: string;
  sentiment?: string;
  language?: SupportedLanguages;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  languages: Record<SupportedLanguages, {
    question: string;
    answer: string;
  }>;
}

// Fügen wir neue Types für die Intent-Erkennung hinzu
export type IntentCategory = 
  | 'INFORMATION'    // Allgemeine Informationsanfragen
  | 'PRICE'         // Preisanfragen
  | 'CLAIM'         // Schadensmeldungen
  | 'COVERAGE'      // Deckungsanfragen
  | 'DOCUMENT'      // Dokumentenanfragen
  | 'COMPLAINT'     // Beschwerden
  | 'CHANGE'        // Änderungswünsche
  | 'CANCELLATION'  // Kündigungen
  | 'EMERGENCY'     // Notfälle
  | 'TECHNICAL';    // Technische Probleme

export interface Intent {
  category: IntentCategory;
  confidence: number;
  subCategory?: string;
  entities: IntentEntity[];
  urgency: 'low' | 'medium' | 'high';
}

export interface IntentEntity {
  type: 'insurance_type' | 'document_type' | 'action' | 'location' | 'date' | 'amount' | 'person';
  value: string;
  confidence: number;
}

// Erweiterte IntentPatterns für mehrsprachige Unterstützung
export interface MultilingualPatterns {
  de: IntentPatterns;
  en: IntentPatterns;
  fr: IntentPatterns;
  it: IntentPatterns;
}

export interface IntentPatterns {
  keywords: string[];
  insuranceTypes?: string[];
  documentTypes?: string[];
  urgencyIndicators?: string[];
  sentimentIndicators?: string[];
  amounts?: string[];
  // weitere Pattern-Typen...
}

export interface IntentPattern {
  intent: string;
  patterns: string[];
  responses?: Record<SupportedLanguages, string>;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  preferred_language: 'de' | 'en' | 'fr' | 'it';
  insurance_interests?: InsuranceType[];
  created_at: string;
  updated_at: string;
}

export type InsuranceType = 
  | 'life' 
  | 'health' 
  | 'property' 
  | 'liability' 
  | 'vehicle';

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  size: number;
  document_type: 'identification' | 'insurance_policy' | 'claim' | 'other';
  status: 'pending' | 'verified' | 'rejected';
  upload_date: string;
  verification_date?: string;
  metadata: Record<string, any>;
}

export interface Appointment {
  id: string;
  user_id: string;
  advisor_id: string;
  type: 'initial_consultation' | 'followup' | 'claim_support';
  status: 'scheduled' | 'completed' | 'cancelled';
  datetime: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Neue Typen für die Datenerfassung
export type DataCollectionStep = 
  | 'idle'
  | 'collecting_name'
  | 'collecting_email'
  | 'collecting_phone'
  | 'confirming_data'
  | 'ready_for_upload';

export interface UserContactData {
  name: string;
  email: string;
  phone: string;
}

export interface DataCollectionState {
  step: DataCollectionStep;
  data: Partial<UserContactData>;
  confirmed: boolean;
  retries: number;
}

// Erweitern der bestehenden ChatSession Interface
export interface ChatSession {
  session_id: string;
  messages: Message[];
  context: {
    current_topic?: string;
    insurance_types?: InsuranceType[];
    document_requests?: string[];
    appointment_requested?: boolean;
    contact_info?: UserContactData;
    data_collection?: DataCollectionState;
  };
  created_at: string;
  expires_at: string;
  gdpr_accepted: boolean;
}

export interface TemporaryDocument {
  id: string;
  session_id: string;
  filename: string;
  file_type: string;
  size: number;
  purpose: 'claim' | 'identification' | 'other';
  upload_date: string;
  expires_at: string;  // Automatisches Löschdatum
  processing_status: 'uploading' | 'processing' | 'completed' | 'error';
}

export interface AppointmentRequest {
  session_id: string;
  preferred_date: string[];
  contact: {
    name: string;
    email: string;
    phone?: string;
  };
  topic: string;
  insurance_type?: InsuranceType;
  preferred_language: SupportedLanguages;
  notes?: string;
  created_at: string;
} 