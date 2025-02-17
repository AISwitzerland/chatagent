import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailData {
  documentType: string;
  metadata: any;
  extractedText: string;
  processId: string;
}

export async function sendDocumentNotification(data: EmailData) {
  try {
    const subject = `Neues Dokument eingereicht: ${data.documentType}`;
    
    // Erstelle eine Zusammenfassung basierend auf dem Dokumenttyp
    let summary = '';
    if (data.documentType === 'accident_report') {
      const text = data.extractedText;
      summary = `
        Unfallbericht
        -------------
        Name: ${text.match(/Name[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || 'Nicht angegeben'}
        Datum: ${text.match(/(\d{1,2}\.\d{1,2}\.\d{4})/)?.[1] || 'Nicht angegeben'}
        Unfallort: ${text.match(/Ort[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || 'Nicht angegeben'}
        Beschreibung: ${text.match(/(?:Unfallhergang|Beschreibung)[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || 'Nicht angegeben'}
      `;
    } else if (data.documentType === 'contract_change') {
      const text = data.extractedText;
      summary = `
        Vertragsänderung
        ----------------
        Name: ${text.match(/Name[^:]*:\s*([^\n]+)/i)?.[1]?.trim() || 'Nicht angegeben'}
        Typ: ${text.toLowerCase().includes('kündigung') ? 'Kündigung' : 'Änderung'}
        Datum: ${text.match(/(\d{1,2}\.\d{1,2}\.\d{4})/)?.[1] || 'Nicht angegeben'}
      `;
    } else {
      summary = `
        Dokument: ${data.documentType}
        Prozess-ID: ${data.processId}
        Zeitpunkt: ${new Date().toLocaleString()}
      `;
    }

    const html = `
      <h2>Neues Dokument wurde eingereicht</h2>
      <p>Ein neues Dokument wurde erfolgreich verarbeitet und gespeichert.</p>
      <pre>${summary}</pre>
      <p>Prozess-ID: ${data.processId}</p>
      <p>Zeitpunkt: ${new Date().toLocaleString()}</p>
      <hr>
      <p><small>Dies ist eine automatisch generierte Nachricht.</small></p>
    `;

    console.log('Sende E-Mail mit folgenden Details:', {
      to: 'wehrlinatasha@gmail.com',
      subject,
      apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      hasApiKey: !!process.env.RESEND_API_KEY
    });

    const response = await resend.emails.send({
      from: 'Resend <onboarding@resend.dev>',
      to: 'wehrlinatasha@gmail.com',
      subject,
      html
    });

    console.log('Resend API Antwort:', response);
    return true;
  } catch (error: any) {
    console.error('Detaillierter E-Mail-Fehler:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      details: error.details || 'Keine weiteren Details verfügbar'
    });
    return false;
  }
} 