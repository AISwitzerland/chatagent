import { Resend } from 'resend';
import type { CreateEmailResponse } from 'resend';
import { isErrorWithMessage, ValidationError, isValidEmail } from '../types/utils';
import { API } from '../types/constants';
import { supabase } from './supabaseClient';

interface EmailMetadata {
  documentType: string;
  processId: string;
  timestamp: string;
  [key: string]: string | number | boolean;
}

interface EmailData {
  documentType: string;
  metadata: EmailMetadata;
  extractedText: string;
  processId: string;
  recipient?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendProcessingNotification(data: EmailData): Promise<EmailResult> {
  // Validiere E-Mail-Empfänger
  const recipient = data.recipient ?? 'processing@swiss-insurance.ch';
  if (!isValidEmail(recipient)) {
    throw new ValidationError('Ungültige E-Mail-Adresse', 'recipient');
  }

  try {
    const { documentType, metadata, extractedText, processId } = data;

    const response: CreateEmailResponse = await resend.emails.send({
      from: 'ocr@swiss-insurance.ch',
      to: recipient,
      subject: `Dokument verarbeitet: ${documentType} (${processId})`,
      text: `
        Neues Dokument verarbeitet:
        Typ: ${documentType}
        Prozess-ID: ${processId}
        
        Metadaten:
        ${Object.entries(metadata)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')}
        
        Extrahierter Text:
        ${extractedText}
      `.trim(),
    });

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    if (isErrorWithMessage(error)) {
      console.error('E-Mail-Versand fehlgeschlagen:', error);

      return {
        success: false,
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: error.message,
          details: error,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Ein unbekannter Fehler ist aufgetreten',
      },
    };
  }
}
