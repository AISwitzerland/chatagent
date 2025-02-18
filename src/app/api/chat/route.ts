import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { Message } from '../../../types';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Am Anfang der Datei
console.log('Environment Debug:', {
  NODE_ENV: process.env.NODE_ENV,
  envFiles: require('fs')
    .readdirSync('.')
    .filter(function (f: string) {
      return f.startsWith('.env');
    }),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length,
  OPENAI_API_KEY_START: process.env.OPENAI_API_KEY?.substring(0, 10),
  OPENAI_API_KEY_END: process.env.OPENAI_API_KEY?.substring(-10),
});

// Validate environment on module load
const validateEnvironment = () => {
  console.log('Validating environment...');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    throw new Error('OPENAI_API_KEY is not set');
  }
  console.log('API Key starts with:', apiKey.substring(0, 10));
  if (!apiKey.startsWith('sk-')) {
    console.error('OPENAI_API_KEY appears to be invalid (should start with sk-)');
    throw new Error('OPENAI_API_KEY appears to be invalid (should start with sk-)');
  }
  return apiKey;
};

const apiKey = validateEnvironment();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
});

// Validiere oder erstelle eine neue Session
function getOrCreateSession(sessionId?: string): string {
  if (sessionId) {
    // TODO: Validiere existierende Session
    return sessionId;
  }
  return uuidv4();
}

const SYSTEM_PROMPT = `Du bist ein Versicherungsberater der Swiss Insurance AG.
- Antworte immer höflich und professionell
- Fokussiere dich auf Versicherungsthemen
- Gib präzise und relevante Informationen
- Bei komplexen Fällen verweise auf persönliche Beratung
- Beachte Schweizer Datenschutzrichtlinien

Dokumentenverarbeitung:
- Wenn ein Kunde einen Dokumenten-Upload erwähnt, aktiviere SOFORT den Upload-Dialog
- Führe den Kunden aktiv durch den Upload-Prozess mit klaren Anweisungen
- Erkläre parallel zum Upload-Dialog den weiteren Verarbeitungsprozess
- Nach erfolgreichem Upload bestätige den Erhalt und erkläre die nächsten Schritte
- Bei Fehlern biete sofort konkrete Lösungsvorschläge an

Aktive Führung:
- Reagiere UNMITTELBAR auf Schlüsselwörter wie "hochladen", "Upload", "Dokument", "Unterlagen"
- Aktiviere den Upload-Dialog mit der Nachricht: "Ich aktiviere jetzt den Upload-Bereich für Sie. Sie können Ihr Dokument direkt hier hochladen:"
- Erkläre während des Uploads: "Das Dokument wird automatisch verarbeitet und klassifiziert. Sie erhalten eine Bestätigung, sobald die Verarbeitung abgeschlossen ist."

Unterstützte Dokumenttypen:
- Unfallberichte
- Schadensmeldungen
- Vertragsänderungen
- Kündigungen
- Allgemeine Dokumente

Spezifische Anweisungen:
- Bei Erwähnung von Dokumenten-Upload IMMER mit "Ich aktiviere jetzt den Upload-Bereich für Sie..." antworten
- Keine passiven Formulierungen wie "können Sie hochladen" verwenden
- Proaktiv den nächsten Schritt einleiten
- Bei Unklarheiten nach dem Dokumenttyp fragen`;

interface ChatRequest {
  messages: Message[];
  language: string;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('chat_session')?.value;

    // Erstelle oder validiere Session
    sessionId = getOrCreateSession(sessionId);

    const { messages, language }: ChatRequest = await req.json();

    // Setze Session-Cookie
    const response = NextResponse.next();
    response.cookies.set('chat_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 Stunde
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `${SYSTEM_PROMPT}\n\nBitte antworte auf ${language || 'Deutsch'}.`,
        },
        ...messages,
      ],
    });

    // Speichere Message in temporärem Session-Storage
    // TODO: Implementiere Session-Storage

    return NextResponse.json({
      content: completion.choices[0].message.content,
      session_id: sessionId,
    });
  } catch (error: any) {
    console.error('Chat API Error:', {
      message: error.message,
      type: error.type,
      status: error.status,
      timestamp: new Date().toISOString(),
      details: error.response?.data,
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate response',
        details: error.message,
      },
      { status: error.status || 500 }
    );
  }
}
