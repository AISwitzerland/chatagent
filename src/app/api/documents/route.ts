import { NextResponse } from 'next/server';
import { DocumentAgent } from '../../../agents/documentProcessor';
import { supabase } from '../../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { sendProcessingNotification } from '../../../services/emailService';

type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export async function POST(req: Request) {
  try {
    const { file: base64File, fileName, fileType, metadata } = await req.json();

    if (!base64File || !fileName || !fileType) {
      throw new Error('Fehlende erforderliche Parameter');
    }

    // Decode base64 file
    const fileBuffer = Buffer.from(base64File, 'base64');
    const fileSize = fileBuffer.length;

    // Create document object for processing
    const document = {
      file: fileBuffer,
      fileName,
      mimeType: fileType,
      fileSize,
      metadata,
    };

    // Get DocumentAgent instance
    const documentAgent = DocumentAgent.getInstance();

    // Start processing
    const processId = uuidv4();
    const now = new Date().toISOString();

    // Insert initial processing status
    await supabase.from('processing_status').insert({
      process_id: processId,
      status: 'processing',
      message: 'Dokument wird verarbeitet...',
      progress: 0,
      started_at: now,
      updated_at: now,
    });

    // Process document asynchronously
    processDocument(processId, document, documentAgent);

    return NextResponse.json({
      success: true,
      processId,
      message: 'Dokument wird verarbeitet',
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Fehler beim Dokumenten-Upload',
      },
      { status: 500 }
    );
  }
}

async function processDocument(processId: string, document: any, agent: DocumentAgent) {
  try {
    const result = await agent.processDocument(document, processId);

    if (result.success) {
      // Hole die aktuelle User ID
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Speichere in documents Tabelle
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .insert({
          file_name: document.fileName,
          file_path: document.filePath || 'NULL',
          file_type: document.fileType,
          document_type: result.documentType,
          status: 'eingereicht' as DocumentStatus,
          metadata: result.data,
          uploaded_by: user?.id,
          user_id: user?.id,
          date: new Date().toISOString(),
          from: result.data?.from || null,
        })
        .select()
        .single();

      if (documentError) throw documentError;

      // Verarbeite je nach Dokumenttyp
      switch (result.documentType) {
        case 'accident_report':
          await processAccidentReport(documentData.id, result.data);
          break;
        case 'damage_report':
          await processDamageReport(documentData.id, result.data);
          break;
        case 'contract_change':
          await processContractChange(documentData.id, result.data);
          break;
        default:
          await processMiscellaneousDocument(documentData.id, result.data);
      }

      // Sende E-Mail-Benachrichtigung
      if (result.documentType && result.data?.extractedText) {
        await sendProcessingNotification({
          documentType: result.documentType,
          metadata: {
            documentType: result.documentType,
            processId,
            timestamp: new Date().toISOString(),
            ...result.data,
          },
          extractedText: result.data.extractedText,
          processId,
        });
      }

      await updateStatus(processId, 'completed', 'Verarbeitung abgeschlossen', 100);
      return { success: true };
    } else {
      throw new Error(result.message || 'Verarbeitung fehlgeschlagen');
    }
  } catch (error: any) {
    console.error('Document processing error:', error);
    await updateStatus(processId, 'failed', `Fehler bei der Verarbeitung: ${error.message}`, 0);
    throw error;
  }
}

async function processAccidentReport(documentId: string, data: any) {
  try {
    // Extrahiere Geburtsdatum
    const geburtsdatumMatch = data.text.match(
      /Geburtsdatum[^:]*:\s*(\d{1,2}[.\s/-]\d{1,2}[.\s/-]\d{4})/i
    );
    const unfallDatumMatch = data.text.match(
      /(?:Unfall|Schaden)[^:]*datum[^:]*:\s*(\d{1,2}[.\s/-]\d{1,2}[.\s/-]\d{4})/i
    );

    // Formatiere und validiere Daten
    let formattedGeburtsdatum = geburtsdatumMatch ? formatDate(geburtsdatumMatch[1].trim()) : null;
    let formattedUnfallDatum = unfallDatumMatch
      ? formatDate(unfallDatumMatch[1].trim())
      : formatDate(new Date().toLocaleDateString('de-CH'));

    // Überprüfe ob die Daten gültig sind
    if (!formattedGeburtsdatum || !formattedUnfallDatum) {
      console.error('Ungültige Daten gefunden:', {
        original: {
          geburtsdatum: geburtsdatumMatch?.[1],
          unfallDatum: unfallDatumMatch?.[1],
        },
        formatted: {
          geburtsdatum: formattedGeburtsdatum,
          unfallDatum: formattedUnfallDatum,
        },
      });

      // Setze Standardwerte wenn nötig
      const today = new Date();
      const defaultDate = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;

      if (!formattedGeburtsdatum) {
        console.warn('Verwende Standarddatum für Geburtsdatum');
        formattedGeburtsdatum = '01.01.1990'; // Standardwert
      }

      if (!formattedUnfallDatum) {
        console.warn('Verwende heutiges Datum für Unfalldatum');
        formattedUnfallDatum = defaultDate;
      }
    }

    const extractedText = data.extractedText;

    // Verbesserte Extraktion mit flexibleren Patterns
    const schadenNummer = extractedText.match(/Schaden-?(?:Nr|Nummer)[.:]*\s*(\d+)/i)?.[1] || null;
    const name = extractedText.match(/Name[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';
    const ahvNummer = extractedText.match(/AHV-?Nummer[^:]*:\s*([\d.]+)/i)?.[1] || '';
    const telefon = extractedText.match(/(?:Tel|Telefon)[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || null;

    // Verbesserte Extraktion des Unfalldatums - suche in der Schaden-Sektion
    const schadenSection =
      extractedText.match(/##\s*4\.\s*Schaden\n([\s\S]*?)(?=##|$)/i)?.[1] || '';
    const datumMatch =
      schadenSection.match(/Datum[^:]*:\s*\*?\*?(\d{1,2}[.\s]\d{1,2}[.\s]\d{4})\*?\*?/i) ||
      extractedText.match(
        /(?:Tag\/Monat\/Jahr|Datum|Schaden-?\s*datum)[^:]*:\s*(\d{1,2}[.\s]\d{1,2}[.\s]\d{4})/i
      );
    const unfallDatum = datumMatch ? datumMatch[1].replace(/\s+/g, '.').replace(/\*/g, '') : '';

    console.log('Extrahierte Daten:', {
      geburtsdatum: formattedGeburtsdatum,
      unfallDatum,
      schadenSection,
    });

    const unfallZeit = extractedText.match(/Zeit[^:]*:\s*(\d{2}:\d{2})/i)?.[1] || '';
    const unfallOrt = extractedText.match(/Ort[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';
    const unfallBeschreibung =
      extractedText.match(/(?:Unfallhergang|Beschreibung)[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';
    const verletzungArt =
      extractedText.match(/Art\sder\sVerletzung[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';
    const verletzungKoerperteil =
      extractedText.match(/Verletzter\sKörperteil[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';

    const { error: accidentError } = await supabase.from('accident_reports').insert({
      document_id: documentId,
      schaden_nummer: schadenNummer,
      status: 'eingereicht' as DocumentStatus,
      name,
      geburtsdatum: formattedGeburtsdatum,
      ahv_nummer: ahvNummer,
      kontakt_telefon: telefon,
      unfall_datum: formattedUnfallDatum,
      unfall_zeit: unfallZeit,
      unfall_ort: unfallOrt,
      unfall_beschreibung: unfallBeschreibung,
      verletzung_art: verletzungArt,
      verletzung_koerperteil: verletzungKoerperteil,
    });

    if (accidentError) throw accidentError;
  } catch (error: any) {
    console.error('Document processing error:', error);
    await updateDocumentStatus(
      documentId,
      'failed',
      `Fehler bei der Verarbeitung: ${error.message}`
    );
    throw error;
  }
}

async function processDamageReport(documentId: string, data: any) {
  const extractedText = data.extractedText;

  const versicherungsnummer =
    extractedText.match(/Versicherungsnummer[^:]*:\s*(\d+)/i)?.[1] || null;
  const name = extractedText.match(/Name[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';
  const adresse = extractedText.match(/Adresse[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';
  const schadenDatum =
    extractedText
      .match(/Schadensdatum[^:]*:\s*(\d{1,2}[.\s]\d{1,2}[.\s]\d{4})/i)?.[1]
      ?.replace(/\s+/g, '.') || '';
  const schadenOrt = extractedText.match(/Schadenort[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';
  const schadenBeschreibung =
    extractedText.match(/Schadenbeschreibung[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';

  const formattedSchadenDatum = formatDate(schadenDatum);
  if (!formattedSchadenDatum) {
    throw new Error('Ungültiges Schadensdatum');
  }

  const { error: damageError } = await supabase.from('damage_reports').insert({
    document_id: documentId,
    versicherungsnummer,
    name,
    adresse,
    schaden_datum: formattedSchadenDatum,
    schaden_ort: schadenOrt,
    schaden_beschreibung: schadenBeschreibung,
    zusammenfassung: data.summary || '',
    status: 'eingereicht' as DocumentStatus,
  });

  if (damageError) throw damageError;
}

async function processContractChange(documentId: string, data: any) {
  const extractedText = data.extractedText;

  const name = extractedText.match(/Name[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';
  const adresse = extractedText.match(/Adresse[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';
  let aenderungTyp = 'anpassung'; // Default Wert

  // Prüfe auf Kündigung im Text
  if (extractedText.toLowerCase().includes('kündigung')) {
    aenderungTyp = 'kuendigung';
  }

  const aenderungBeschreibung =
    extractedText.match(/Beschreibung[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || '';

  const { error: contractError } = await supabase.from('contract_changes').insert({
    document_id: documentId,
    name,
    adresse,
    aenderung_typ: aenderungTyp,
    aenderung_beschreibung: aenderungBeschreibung,
    zusammenfassung: data.summary || '',
    status: 'eingereicht' as DocumentStatus,
  });

  if (contractError) throw contractError;
}

async function processMiscellaneousDocument(documentId: string, data: any) {
  const { error: miscError } = await supabase.from('miscellaneous_documents').insert({
    document_id: documentId,
    title: data.title || 'Sonstiges Dokument',
    document_date: data.date ? formatDate(data.date) : null,
    summary: data.summary || '',
    status: 'eingereicht' as DocumentStatus,
  });

  if (miscError) throw miscError;
}

function formatDate(dateStr: string): string | null {
  try {
    // Verschiedene Datumsformate unterstützen
    const formats = [
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/, // DD/MM/YYYY oder DD-MM-YYYY
      /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/, // YYYY/MM/DD oder YYYY-MM-YYYY
    ];

    let day: string, month: string, year: string;

    // Versuche alle unterstützten Formate
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format.toString().startsWith('/^(\\d{4})')) {
          // YYYY/MM/DD Format
          [, year, month, day] = match;
        } else {
          // DD.MM.YYYY Format
          [, day, month, year] = match;
        }

        // Führende Nullen hinzufügen
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');

        // Validiere Datum
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (
          date.getFullYear() === parseInt(year) &&
          date.getMonth() === parseInt(month) - 1 &&
          date.getDate() === parseInt(day)
        ) {
          // Gültiges Datum im ISO-Format (YYYY-MM-DD) für Supabase zurückgeben
          return `${year}-${month}-${day}`;
        }
      }
    }

    // Wenn kein Format passt, versuche das aktuelle Datum zu verwenden
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (error) {
    console.error('Datums-Parsing Fehler:', error);
    return null;
  }
}

async function updateStatus(
  processId: string,
  status: 'processing' | 'completed' | 'failed',
  message: string,
  progress: number
) {
  const now = new Date().toISOString();
  await supabase
    .from('processing_status')
    .update({
      status,
      message,
      progress,
      updated_at: now,
      ...(status === 'completed' ? { completed_at: now } : {}),
    })
    .eq('process_id', processId);
}

async function updateDocumentStatus(documentId: string, status: DocumentStatus, message: string) {
  const now = new Date().toISOString();
  await supabase
    .from('documents')
    .update({
      status,
      message,
      updated_at: now,
    })
    .eq('id', documentId);
}
