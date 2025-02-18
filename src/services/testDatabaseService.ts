import { supabase } from './supabaseClient';

export async function testDatabaseConnection() {
  try {
    // Hole aktuelle Session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session-Fehler:', sessionError);
      throw sessionError;
    }

    if (!session?.user) {
      throw new Error('Nicht eingeloggt');
    }

    // 1. Test: Basis-Verbindung
    const { data: connectionTest, error: connectionError } = await supabase
      .from('documents')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('Verbindungsfehler:', connectionError);
      throw connectionError;
    }

    console.log('✅ Verbindung erfolgreich');

    // 2. Test: Document erstellen
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        file_name: 'test-document.pdf',
        file_path: '/test/path',
        file_type: 'application/pdf',
        document_type: 'vertrag',
        status: 'eingereicht',
        metadata: { test: true },
        uploaded_by: session.user.id,
      })
      .select()
      .single();

    if (documentError) {
      console.error('Dokument-Fehler:', documentError);
      throw documentError;
    }

    console.log('✅ Document erstellt:', document.id);

    // 2. Accident Report erstellen
    const { data: accidentReport, error: accidentError } = await supabase
      .from('accident_reports')
      .insert({
        document_id: document.id,
        name: 'Max Mustermann',
        geburtsdatum: '1990-01-01',
        ahv_nummer: '756.1234.5678.90',
        unfall_datum: '2024-02-13',
        unfall_zeit: '14:30:00',
        unfall_ort: 'Musterstraße 123',
        unfall_beschreibung: 'Testeintrag für Unfallbericht',
        verletzung_art: 'Testbeschreibung der Verletzung',
        verletzung_koerperteil: 'Hand',
      })
      .select()
      .single();

    if (accidentError) {
      console.error('Unfall-Bericht-Fehler:', accidentError);
      throw accidentError;
    }

    console.log('✅ Unfall-Bericht erstellt:', accidentReport.id);

    // 3. Termin erstellen
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        termin_datum: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 Tage in der Zukunft
        name: 'Max Mustermann',
        email: session.user.email!,
        telefon: '+41 123 456 789',
        notizen: 'Testtermin für Beratungsgespräch',
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('Termin-Fehler:', appointmentError);
      throw appointmentError;
    }

    console.log('✅ Termin erstellt:', appointment.id);

    // 4. Contract Change erstellen
    const { data: contractChange, error: contractError } = await supabase
      .from('contract_changes')
      .insert({
        document_id: document.id,
        name: 'Max Mustermann',
        adresse: 'Neue Straße 123, 8000 Zürich',
        aenderung_typ: 'anpassung',
        aenderung_beschreibung: 'Umzug in neue Wohnung',
        zusammenfassung: 'Adressänderung aufgrund Umzug',
        status: 'eingereicht',
      })
      .select()
      .single();

    if (contractError) {
      console.error('Vertragsänderungs-Fehler:', JSON.stringify(contractError, null, 2));
      throw new Error(
        `Vertragsänderung fehlgeschlagen: ${contractError.message || JSON.stringify(contractError)}`
      );
    }

    console.log('✅ Vertragsänderung erstellt:', contractChange.id);

    // 5. Damage Report erstellen
    const { data: damageReport, error: damageError } = await supabase
      .from('damage_reports')
      .insert({
        document_id: document.id,
        versicherungsnummer: 'VS-2024-123456',
        name: 'Max Mustermann',
        adresse: 'Musterstraße 123, 8000 Zürich',
        schaden_datum: '2024-02-13',
        schaden_ort: 'Parkplatz Einkaufszentrum',
        schaden_beschreibung: 'Parkschaden am Fahrzeug',
        zusammenfassung: 'Beschädigung der Fahrertür durch fremdes Fahrzeug',
        status: 'eingereicht',
      })
      .select()
      .single();

    if (damageError) {
      console.error('Schadensmeldungs-Fehler:', JSON.stringify(damageError, null, 2));
      throw new Error(
        `Schadensmeldung fehlgeschlagen: ${damageError.message || JSON.stringify(damageError)}`
      );
    }

    console.log('✅ Schadensmeldung erstellt:', damageReport.id);

    return {
      success: true,
      results: {
        document,
        accidentReport,
        appointment,
        contractChange,
        damageReport,
      },
    };
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
