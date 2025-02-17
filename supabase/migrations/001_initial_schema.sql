-- Erstelle Tabellen für das Chat-System
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  title TEXT,
  language TEXT DEFAULT 'de',
  
  CONSTRAINT chats_language_check 
    CHECK (language IN ('de', 'en', 'fr', 'it'))
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  attachments TEXT[],
  intent JSONB,
  sentiment TEXT,
  
  CONSTRAINT messages_sentiment_check 
    CHECK (sentiment IN ('positive', 'neutral', 'negative'))
);

-- Documents Tabelle aktualisieren (die alte Definition ersetzen)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'eingereicht',
  metadata JSONB,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date TEXT,
  "from" TEXT,
  
  CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) 
    REFERENCES auth.users(id)
);

-- Index für uploaded_by
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- RLS für documents aktualisieren
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Indices für bessere Performance
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);

-- RLS (Row Level Security) Policies
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies für Chats
CREATE POLICY "Users can view their own chats"
  ON chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies für Messages
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  USING (
    chat_id IN (
      SELECT id FROM chats WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their chats"
  ON messages FOR INSERT
  WITH CHECK (
    chat_id IN (
      SELECT id FROM chats WHERE user_id = auth.uid()
    )
  );

-- Vor den Tabellen-Definitionen
CREATE TYPE public.document_status AS ENUM (
  'eingereicht',
  'in_bearbeitung',
  'abgeschlossen',
  'abgelehnt'
);

-- Bestehende accident_reports Tabelle hinzufügen
CREATE TABLE public.accident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id),
  schaden_nummer VARCHAR(20),
  status document_status NOT NULL DEFAULT 'eingereicht',
  name VARCHAR(255) NOT NULL,
  geburtsdatum DATE NOT NULL,
  ahv_nummer VARCHAR(16) NOT NULL,
  kontakt_telefon VARCHAR(20),
  unfall_datum DATE NOT NULL,
  unfall_zeit TIME NOT NULL,
  unfall_ort TEXT NOT NULL,
  unfall_beschreibung TEXT NOT NULL,
  verletzung_art VARCHAR(255) NOT NULL,
  verletzung_koerperteil VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für document_id
CREATE INDEX idx_accident_reports_document_id ON accident_reports(document_id);

-- RLS für accident_reports
ALTER TABLE accident_reports ENABLE ROW LEVEL SECURITY;

-- Policies für accident_reports
CREATE POLICY "Users can view their own accident reports"
  ON accident_reports FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own accident reports"
  ON accident_reports FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

-- Nach den accident_reports Definitionen
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  termin_datum TIMESTAMPTZ NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefon VARCHAR(20),
  notizen TEXT,
  status document_status NOT NULL DEFAULT 'eingereicht',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS für appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policies für appointments
CREATE POLICY "Users can view appointments with their email"
  ON appointments FOR SELECT
  USING (email = auth.email());

CREATE POLICY "Users can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (email = auth.email());

-- Nach den appointments Definitionen
-- Neuer ENUM-Typ für Vertragsänderungen
CREATE TYPE public.contract_change_type AS ENUM (
  'adressaenderung',
  'deckungsaenderung',
  'zahlungsaenderung',
  'kuendigung',
  'sonstiges'
);

-- Contract Changes Tabelle
CREATE TABLE public.contract_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id),
  name VARCHAR(255) NOT NULL,
  adresse TEXT NOT NULL,
  aenderung_typ contract_change_type NOT NULL,
  aenderung_beschreibung TEXT NOT NULL,
  zusammenfassung TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'eingereicht',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für document_id
CREATE INDEX idx_contract_changes_document_id ON contract_changes(document_id);

-- RLS für contract_changes
ALTER TABLE contract_changes ENABLE ROW LEVEL SECURITY;

-- Policies für contract_changes
CREATE POLICY "Users can view their own contract changes"
  ON contract_changes FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own contract changes"
  ON contract_changes FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

-- Nach den contract_changes Definitionen
CREATE TABLE public.damage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id),
  versicherungsnummer VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  adresse TEXT NOT NULL,
  schaden_datum DATE NOT NULL,
  schaden_ort TEXT NOT NULL,
  schaden_beschreibung TEXT NOT NULL,
  zusammenfassung TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'eingereicht',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für document_id
CREATE INDEX idx_damage_reports_document_id ON damage_reports(document_id);

-- RLS für damage_reports
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;

-- Policies für damage_reports
CREATE POLICY "Users can view their own damage reports"
  ON damage_reports FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own damage reports"
  ON damage_reports FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  ); 