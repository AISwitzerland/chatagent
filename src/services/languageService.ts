import { SupportedLanguages } from '@/types';

const LANGUAGE_PATTERNS = {
  de: [
    'der',
    'die',
    'das',
    'und',
    'ist',
    'in',
    'ich',
    'zu',
    'den',
    'versicherung',
    'schaden',
    'unfall',
    'vertrag',
    'prämie',
    'kündigung',
  ],
  fr: [
    'le',
    'la',
    'les',
    'et',
    'est',
    'dans',
    'je',
    'à',
    'assurance',
    'dommage',
    'accident',
    'contrat',
    'prime',
    'résiliation',
  ],
  it: [
    'il',
    'la',
    'i',
    'e',
    'è',
    'in',
    'io',
    'a',
    'assicurazione',
    'danno',
    'incidente',
    'contratto',
    'premio',
    'disdetta',
  ],
  en: [
    'the',
    'and',
    'is',
    'in',
    'i',
    'to',
    'insurance',
    'damage',
    'accident',
    'contract',
    'premium',
    'cancellation',
  ],
};

export const SUPPORTED_LANGUAGES: Record<SupportedLanguages, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
};

export async function detectLanguage(text: string): Promise<SupportedLanguages> {
  const normalizedText = text.toLowerCase();
  const scores = new Map<SupportedLanguages, number>();

  // Initialisiere Scores
  Object.keys(LANGUAGE_PATTERNS).forEach(lang => {
    scores.set(lang as SupportedLanguages, 0);
  });

  // Berechne Scores für jede Sprache
  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalizedText.includes(pattern)) {
        scores.set(lang as SupportedLanguages, scores.get(lang as SupportedLanguages)! + 1);
      }
    }
  }

  // Finde Sprache mit höchstem Score
  let maxScore = 0;
  let detectedLanguage: SupportedLanguages = 'de';

  scores.forEach((score, lang) => {
    if (score > maxScore) {
      maxScore = score;
      detectedLanguage = lang;
    }
  });

  return detectedLanguage;
}

export function translateText(text: string, sourceLanguage: string): string {
  // Implementierung der Übersetzung für alle unterstützten Sprachen
  return text;
}
