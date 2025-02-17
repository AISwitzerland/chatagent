import { DataCollectionStep, UserContactData, DataCollectionState } from '../types';

export function getNextPrompt(step: DataCollectionStep, data: Partial<UserContactData>): string {
  switch (step) {
    case 'collecting_name':
      return 'Bitte geben Sie mir Ihren vollständigen Namen.';
    
    case 'collecting_email':
      return `Danke ${data.name}. Nun bräuchte ich noch Ihre Email.`;
    
    case 'collecting_phone':
      return 'Danke, nun bräuchte ich noch Ihre Telefonnummer.';
    
    case 'confirming_data':
      return `Danke vielmals. Bitte bestätigen Sie, ob Ihre Daten korrekt sind:\n\nName: ${data.name}\nEmail: ${data.email}\nTelefon: ${data.phone}`;
    
    case 'ready_for_upload':
      return 'Perfekt. Nun können wir mit dem Hochladen Ihres Dokuments weitermachen.';
    
    default:
      return '';
  }
}

export function validateInput(step: DataCollectionStep, input: string): string | null {
  switch (step) {
    case 'collecting_name':
      if (input.length < 3) return 'Der Name muss mindestens 3 Zeichen lang sein.';
      if (!/^[a-zA-ZäöüÄÖÜß ]+$/.test(input)) return 'Der Name darf nur Buchstaben enthalten.';
      break;
    
    case 'collecting_email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) return 'Bitte geben Sie eine gültige Email-Adresse ein.';
      break;
    
    case 'collecting_phone':
      if (!/^[0-9+\s-]{8,}$/.test(input)) return 'Bitte geben Sie eine gültige Telefonnummer ein.';
      break;
  }
  return null;
}

export function getNextStep(currentStep: DataCollectionStep, input: string): DataCollectionStep {
  switch (currentStep) {
    case 'idle':
      return 'collecting_name';
    case 'collecting_name':
      return 'collecting_email';
    case 'collecting_email':
      return 'collecting_phone';
    case 'collecting_phone':
      return 'confirming_data';
    case 'confirming_data':
      return input.toLowerCase().includes('ja') ? 'ready_for_upload' : 'collecting_name';
    default:
      return currentStep;
  }
}

export function updateDataCollectionState(
  state: DataCollectionState,
  input: string
): DataCollectionState {
  const validationError = validateInput(state.step, input);
  if (validationError) {
    return {
      ...state,
      retries: state.retries + 1
    };
  }

  if (state.step === 'confirming_data') {
    if (input.toLowerCase().includes('ja')) {
      return {
        ...state,
        confirmed: true,
        step: 'ready_for_upload'
      };
    } else {
      return {
        step: 'collecting_name',
        data: {},
        confirmed: false,
        retries: 0
      };
    }
  }

  const updatedData = { ...state.data };
  switch (state.step) {
    case 'collecting_name':
      updatedData.name = input;
      break;
    case 'collecting_email':
      updatedData.email = input;
      break;
    case 'collecting_phone':
      updatedData.phone = input;
      break;
  }

  return {
    ...state,
    data: updatedData,
    step: getNextStep(state.step, input),
    retries: 0
  };
} 