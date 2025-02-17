import { FAQ } from '@/types';

export const mockFAQs: FAQ[] = [
  {
    id: '1',
    category: 'Krankenversicherung',
    question: 'Was kostet die Grundversicherung?',
    answer: 'Die monatliche Prämie für die Grundversicherung variiert je nach Kanton, Franchise und Versicherungsmodell. Bei einer Franchise von CHF 300 liegt die Prämie zwischen CHF 250 und CHF 400 pro Monat für Erwachsene. Wählen Sie eine höhere Franchise (max. CHF 2500), können Sie bis zu 40% der Prämie sparen. Für Kinder und junge Erwachsene gelten reduzierte Tarife.',
    languages: {
      en: {
        question: 'How much does basic health insurance cost?',
        answer: 'The monthly premium for basic health insurance varies by canton, deductible, and insurance model. With a deductible of CHF 300, the premium ranges between CHF 250 and CHF 400 per month for adults. By choosing a higher deductible (max. CHF 2500), you can save up to 40% on premiums. Reduced rates apply for children and young adults.'
      },
      fr: {
        question: "Combien coûte l'assurance de base?",
        answer: "La prime mensuelle de l'assurance de base varie selon le canton, la franchise et le modèle d'assurance. Avec une franchise de CHF 300, la prime se situe entre CHF 250 et CHF 400 par mois pour les adultes. En choisissant une franchise plus élevée (max. CHF 2500), vous pouvez économiser jusqu'à 40% sur les primes."
      },
      it: {
        question: "Quanto costa l'assicurazione di base?",
        answer: "Il premio mensile dell'assicurazione di base varia secondo il cantone, la franchigia e il modello assicurativo. Con una franchigia di CHF 300, il premio è compreso tra CHF 250 e CHF 400 al mese per gli adulti. Scegliendo una franchigia più alta (max. CHF 2500), è possibile risparmiare fino al 40% sui premi."
      }
    }
  },
  {
    id: '2',
    category: 'Hausratversicherung',
    question: 'Wie berechnet sich die Prämie für die Hausratversicherung?',
    answer: 'Die Prämie basiert auf der Versicherungssumme und der Wohnfläche. Für eine 3-Zimmer-Wohnung (75m²) mit einer Versicherungssumme von CHF 100\'000 beträgt die Jahresprämie etwa CHF 200-300. Zusätzliche Deckungen wie Wertsachen oder Elementarschäden erhöhen die Prämie. Ein Selbstbehalt von CHF 200 ist Standard. Bei Einbruchsicherungen gibt es Prämienrabatte von bis zu 15%.',
    languages: {
      en: {
        question: 'How is the household contents insurance premium calculated?',
        answer: 'The premium is based on the sum insured and living space. For a 3-room apartment (75m²) with an insurance sum of CHF 100,000, the annual premium is approximately CHF 200-300. Additional coverage like valuables or natural hazards increases the premium. A deductible of CHF 200 is standard. Burglary protection measures can lead to premium discounts of up to 15%.'
      },
      fr: {
        question: "Comment la prime d'assurance ménage est-elle calculée?",
        answer: "La prime est basée sur la somme assurée et la surface habitable. Pour un appartement de 3 pièces (75m²) avec une somme d'assurance de CHF 100'000, la prime annuelle est d'environ CHF 200-300. Les couvertures supplémentaires augmentent la prime. Une franchise de CHF 200 est standard."
      },
      it: {
        question: "Come si calcola il premio dell'assicurazione economia domestica?",
        answer: "Il premio si basa sulla somma assicurata e sulla superficie abitativa. Per un appartamento di 3 locali (75m²) con una somma assicurata di CHF 100'000, il premio annuale è di circa CHF 200-300. Le coperture supplementari aumentano il premio. Una franchigia di CHF 200 è standard."
      }
    }
  },
  {
    id: '3',
    category: 'Motorfahrzeugversicherung',
    question: 'Welche Faktoren beeinflussen die Autoversicherungsprämie?',
    answer: 'Die Prämie wird durch mehrere Faktoren bestimmt: Fahrzeugtyp, Alter des Fahrzeugs, PS-Zahl, Schadenfreiheitsrabatt (Bonus bis 70%), Alter des Fahrers und Wohnort. Beispiel: Ein VW Golf (130 PS, Neuwert CHF 35\'000) kostet mit Vollkasko für einen 35-jährigen Fahrer mit 5 Jahren unfallfreiem Fahren ca. CHF 800-1\'200 pro Jahr. Die Teilkasko liegt etwa 40% darunter. Der Selbstbehalt beträgt bei Vollkasko CHF 1\'000, bei Teilkasko CHF 500.',
    languages: {
      en: {
        question: 'What factors influence the car insurance premium?',
        answer: 'The premium is determined by several factors: vehicle type, age of vehicle, horsepower, no-claims discount (bonus up to 70%), driver age, and residence. Example: A VW Golf (130 HP, new value CHF 35,000) with comprehensive coverage costs approx. CHF 800-1,200 per year for a 35-year-old driver with 5 years of accident-free driving.'
      },
      fr: {
        question: "Quels facteurs influencent la prime d'assurance auto?",
        answer: "La prime est déterminée par plusieurs facteurs: type de véhicule, âge du véhicule, puissance, bonus (jusqu'à 70%), âge du conducteur et lieu de résidence. Exemple: Une VW Golf (130 CV, valeur neuve CHF 35'000) avec casco complète coûte env. CHF 800-1'200 par an pour un conducteur de 35 ans avec 5 ans sans accident."
      },
      it: {
        question: "Quali fattori influenzano il premio assicurativo auto?",
        answer: "Il premio è determinato da diversi fattori: tipo di veicolo, età del veicolo, potenza, bonus (fino al 70%), età del conducente e luogo di residenza. Esempio: Una VW Golf (130 CV, valore nuovo CHF 35'000) con copertura completa costa circa CHF 800-1'200 all'anno per un conducente di 35 anni con 5 anni di guida senza incidenti."
      }
    }
  },
  {
    id: '4',
    category: 'Haftpflichtversicherung',
    question: 'Was kostet eine Privathaftpflichtversicherung und welche Deckung ist empfohlen?',
    answer: 'Eine Privathaftpflichtversicherung mit einer empfohlenen Deckungssumme von CHF 5 Millionen kostet für einen Einzelhaushalt ca. CHF 100-150 pro Jahr, für Familien CHF 150-200. Die Deckung umfasst Personen-, Sach- und Vermögensschäden. Zusätzliche Optionen wie Schlüsselverlust oder Mietkaution erhöhen die Prämie um ca. CHF 20-50. Der übliche Selbstbehalt beträgt CHF 200. Mieter sollten unbedingt Mieterschäden einschließen.',
    languages: {
      en: {
        question: 'How much does personal liability insurance cost and what coverage is recommended?',
        answer: 'Personal liability insurance with a recommended coverage of CHF 5 million costs approx. CHF 100-150 per year for individuals, CHF 150-200 for families. Coverage includes personal injury, property damage, and financial losses. Additional options like key loss or rental deposit increase the premium by CHF 20-50.'
      },
      fr: {
        question: "Combien coûte une assurance responsabilité civile privée et quelle couverture est recommandée?",
        answer: "Une assurance RC privée avec une couverture recommandée de CHF 5 millions coûte env. CHF 100-150 par an pour une personne seule, CHF 150-200 pour les familles. La couverture comprend les dommages corporels, matériels et financiers."
      },
      it: {
        question: "Quanto costa un'assicurazione responsabilità civile privata e quale copertura è consigliata?",
        answer: "Un'assicurazione RC privata con una copertura consigliata di CHF 5 milioni costa circa CHF 100-150 all'anno per una persona sola, CHF 150-200 per le famiglie. La copertura include danni fisici, materiali e finanziari."
      }
    }
  },
  {
    id: '5',
    category: 'Zusatzversicherung',
    question: 'Welche Zusatzversicherungen sind sinnvoll und was kosten sie?',
    answer: 'Die beliebtesten Zusatzversicherungen sind:\n\n1. Spital-Zusatzversicherung (Halbprivat): CHF 50-150/Monat\n- Freie Arztwahl\n- Zweibettzimmer\n- Schweizweit alle Spitäler\n\n2. Zahnversicherung: CHF 20-40/Monat\n-Deckt bis zu 75% der Behandlungskosten\n- Maximale Jahresleistung CHF 5\'000\n\n3. Alternative Medizin: CHF 20-30/Monat\n- Homöopathie, Akupunktur, etc.\n- Bis CHF 3\'000 pro Jahr\n\nPreise variieren nach Alter und Gesundheitszustand. Eine Gesundheitsprüfung ist erforderlich.',
    languages: {
      en: {
        question: 'Which supplementary insurances are recommended and what do they cost?',
        answer: 'The most popular supplementary insurances are:\n\n1. Hospital supplementary insurance (semi-private): CHF 50-150/month\n- Free choice of doctor\n- Two-bed room\n- All hospitals in Switzerland\n\n2. Dental insurance: CHF 20-40/month\n- Covers up to 75% of treatment costs\n- Maximum annual benefit CHF 5,000\n\n3. Alternative medicine: CHF 20-30/month'
      },
      fr: {
        question: "Quelles assurances complémentaires sont recommandées et combien coûtent-elles?",
        answer: "Les assurances complémentaires les plus populaires sont:\n\n1. Assurance hospitalisation (semi-privée): CHF 50-150/mois\n- Libre choix du médecin\n- Chambre à deux lits\n\n2. Assurance dentaire: CHF 20-40/mois\n- Couvre jusqu'à 75% des frais\n\n3. Médecine alternative: CHF 20-30/mois"
      },
      it: {
        question: "Quali sono le assicurazioni complementari consigliate e quanto costano?",
        answer: "Le assicurazioni complementari più popolari sono:\n\n1. Assicurazione ospedaliera (semi-privata): CHF 50-150/mese\n- Libero scelta del medico\n- Camera a due letti\n\n2. Assicurazione dentale: CHF 20-40/mese\n- Copre fino al 75% dei costi\n\n3. Medicina alternativa: CHF 20-30/mese"
      }
    }
  }
]; 