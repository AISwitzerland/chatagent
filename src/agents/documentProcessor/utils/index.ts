export function logStep(step: string, details?: any): void {
  console.log(`[DocumentProcessor] ${new Date().toISOString()} - ${step}`, details || '');
}

export class ProcessingError extends Error {
  constructor(
    message: string,
    public step: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProcessingError';

    // Wichtig für die korrekte Prototyp-Verkettung
    Object.setPrototypeOf(this, ProcessingError.prototype);

    // Stelle sicher, dass die message-Eigenschaft korrekt gesetzt ist
    Object.defineProperty(this, 'message', {
      get() {
        return message;
      },
    });
  }
}
