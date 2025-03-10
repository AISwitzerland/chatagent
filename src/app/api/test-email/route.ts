import { NextResponse } from 'next/server';
import { sendProcessingNotification } from '../../../services/emailService';

export async function GET() {
  try {
    const testData = {
      documentType: 'accident_report',
      metadata: {
        documentType: 'accident_report',
        processId: 'test-123',
        timestamp: new Date().toISOString(),
      },
      extractedText: `
        Name: Max Mustermann
        Geburtsdatum: 15.03.1980
        Unfallort: Bahnhofstrasse 1, Zürich
        Unfallhergang: Ausgerutscht auf nassem Boden
        Datum: 27.03.2024
      `,
      processId: 'test-123',
    };

    const result = await sendProcessingNotification(testData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test-E-Mail wurde erfolgreich gesendet',
      });
    } else {
      throw new Error('E-Mail konnte nicht gesendet werden');
    }
  } catch (error: any) {
    console.error('Test-E-Mail Fehler:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
