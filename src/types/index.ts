export type SupportedLanguages = 'de' | 'fr' | 'it' | 'en';
export type Urgency = 'low' | 'medium' | 'high';
export type DocumentStatus = 'pending' | 'verified' | 'rejected';
export type ProcessingStatus = 'uploading' | 'processing' | 'completed' | 'error';
export type AppointmentType = 'initial_consultation' | 'followup' | 'claim_support';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface Message extends BaseEntity {
  content: string;
  role: 'user' | 'assistant';
  attachments?: string[];
  intent?: string;
  sentiment?: string;
  language?: SupportedLanguages;
}

export interface Attachment extends BaseEntity {
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface FAQ extends BaseEntity {
  question: string;
  answer: string;
  category: string;
  languages: Record<SupportedLanguages, {
    question: string;
    answer: string;
  }>;
  tags?: string[];
  lastUpdated: string;
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

export type EntityType = 
  | 'insurance_type'
  | 'document_type'
  | 'action'
  | 'location'
  | 'date'
  | 'amount'
  | 'person';

export interface Intent extends BaseEntity {
  category: IntentCategory;
  confidence: number;
  subCategory?: string;
  entities: IntentEntity[];
  urgency: Urgency;
}

export interface IntentEntity {
  type: EntityType;
  value: string;
  confidence: number;
  metadata?: Record<string, unknown>;
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

export interface IntentPattern extends BaseEntity {
  intent: string;
  patterns: string[];
  responses: Partial<Record<SupportedLanguages, string>>;
  priority?: number;
  isActive: boolean;
}

export interface CustomerProfile extends BaseEntity {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  preferred_language: SupportedLanguages;
  insurance_interests?: InsuranceType[];
  metadata?: Record<string, unknown>;
}

export type InsuranceType = 
  | 'life' 
  | 'health' 
  | 'property' 
  | 'liability' 
  | 'vehicle';

export interface Document extends BaseEntity {
  user_id: string;
  filename: string;
  file_type: string;
  size: number;
  document_type: 'identification' | 'insurance_policy' | 'claim' | 'other';
  status: DocumentStatus;
  upload_date: string;
  verification_date?: string;
  metadata: Record<string, unknown>;
  tags?: string[];
  version?: number;
}

export interface Appointment extends BaseEntity {
  user_id: string;
  advisor_id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  datetime: string;
  duration?: number; // in minutes
  notes?: string;
  location?: string;
  virtual?: boolean;
  reminder_sent?: boolean;
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
  preferred_contact?: 'email' | 'phone';
  contact_time?: 'morning' | 'afternoon' | 'evening';
}

export interface DataCollectionState {
  step: DataCollectionStep;
  data: Partial<UserContactData>;
  confirmed: boolean;
  retries: number;
  lastUpdated: string;
  validationErrors?: string[];
}

// Erweitern der bestehenden ChatSession Interface
export interface ChatSession extends BaseEntity {
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
  expires_at: string;
  gdpr_accepted: boolean;
  metadata?: Record<string, unknown>;
}

export interface TemporaryDocument extends BaseEntity {
  session_id: string;
  filename: string;
  file_type: string;
  size: number;
  purpose: 'claim' | 'identification' | 'other';
  upload_date: string;
  expires_at: string;
  processing_status: ProcessingStatus;
  error_message?: string;
  progress?: number;
}

export interface AppointmentRequest extends BaseEntity {
  session_id: string;
  preferred_date: string[];
  contact: Required<Pick<UserContactData, 'name' | 'email'>> & Partial<Pick<UserContactData, 'phone'>>;
  topic: string;
  insurance_type?: InsuranceType;
  preferred_language: SupportedLanguages;
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  priority?: Urgency;
} 