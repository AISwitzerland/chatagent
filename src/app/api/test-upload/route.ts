import { NextResponse } from 'next/server';
import { supabase } from '../../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    const processId = uuidv4();
    const now = new Date().toISOString();

    // Insert initial processing status
    const { error: insertError } = await supabase.from('processing_status').insert({
      process_id: processId,
      status: 'processing',
      message: 'Dokument wird verarbeitet...',
      progress: 0,
      started_at: now,
      updated_at: now,
    });

    if (insertError) {
      throw new Error(`Fehler beim Erstellen des Verarbeitungsstatus: ${insertError.message}`);
    }

    // Simulate processing steps
    simulateProcessing(processId);

    return NextResponse.json({ success: true, processId });
  } catch (error: any) {
    console.error('Test upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function simulateProcessing(processId: string) {
  const steps = [
    { progress: 25, message: 'OCR-Verarbeitung läuft...' },
    { progress: 50, message: 'Extrahiere Metadaten...' },
    { progress: 75, message: 'Klassifiziere Dokument...' },
    { progress: 100, message: 'Verarbeitung abgeschlossen' },
  ];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // Add random delay between steps (1-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Update processing status
    const { error: updateError } = await supabase
      .from('processing_status')
      .update({
        status: i === steps.length - 1 ? 'completed' : 'processing',
        message: step.message,
        progress: step.progress,
        updated_at: new Date().toISOString(),
        ...(i === steps.length - 1 ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq('process_id', processId);

    if (updateError) {
      console.error(`Error updating processing status: ${updateError.message}`);

      // Update status to failed
      await supabase
        .from('processing_status')
        .update({
          status: 'failed',
          message: `Fehler bei der Verarbeitung: ${updateError.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq('process_id', processId);

      break;
    }
  }
}
