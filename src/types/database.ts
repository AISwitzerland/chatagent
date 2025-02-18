export type DocumentStatus = 'eingereicht' | 'in_bearbeitung' | 'abgeschlossen' | 'abgelehnt';

export type ContractChangeType =
  | 'kuendigung'
  | 'vertragswechsel'
  | 'vertragstrennung'
  | 'anpassung';

export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          title: string | null;
          language: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          title?: string | null;
          language?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          content: string;
          role: 'user' | 'assistant';
          created_at: string;
          attachments?: string[];
          intent?: string;
          sentiment?: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          content: string;
          role: 'user' | 'assistant';
          created_at?: string;
          attachments?: string[];
          intent?: string;
          sentiment?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          document_type: string;
          status: DocumentStatus;
          metadata: Record<string, any> | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
          date: string | null;
          from: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['documents']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      accident_reports: {
        Row: {
          id: string;
          document_id: string | null;
          schaden_nummer: string | null;
          status: DocumentStatus;
          name: string;
          geburtsdatum: string;
          ahv_nummer: string;
          kontakt_telefon: string | null;
          unfall_datum: string;
          unfall_zeit: string;
          unfall_ort: string;
          unfall_beschreibung: string;
          verletzung_art: string;
          verletzung_koerperteil: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['accident_reports']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['accident_reports']['Insert']>;
      };
      damage_reports: {
        Row: {
          id: string;
          document_id: string | null;
          versicherungsnummer: string | null;
          name: string;
          adresse: string;
          schaden_datum: string;
          schaden_ort: string;
          schaden_beschreibung: string;
          zusammenfassung: string;
          status: DocumentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['damage_reports']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['damage_reports']['Insert']>;
      };
      contract_changes: {
        Row: {
          id: string;
          document_id: string | null;
          name: string;
          adresse: string;
          aenderung_typ: ContractChangeType;
          aenderung_beschreibung: string;
          zusammenfassung: string;
          status: DocumentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['contract_changes']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['contract_changes']['Insert']>;
      };
      miscellaneous_documents: {
        Row: {
          id: string;
          document_id: string | null;
          title: string;
          document_date: string | null;
          summary: string;
          status: DocumentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['miscellaneous_documents']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['miscellaneous_documents']['Insert']>;
      };
      appointments: {
        Row: {
          id: string;
          termin_datum: string;
          name: string;
          email: string;
          telefon: string | null;
          notizen: string | null;
          status: DocumentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['appointments']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };
      document_details: {
        Row: {
          id: string;
          document_id: string;
          type: string;
          extracted_data: Record<string, any>;
          validation_status: 'pending' | 'valid' | 'invalid';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['document_details']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['document_details']['Insert']>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: string[];
    };
  };
}
