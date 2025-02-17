import { FAQ } from '@/types';
import { mockFAQs } from '@/data/mockFAQs';

export async function getFAQs(language: string = 'de'): Promise<FAQ[]> {
  // Simuliere API-Verzögerung
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockFAQs.map(faq => ({
    ...faq,
    question: language === 'de' ? faq.question : faq.languages[language]?.question || faq.question,
    answer: language === 'de' ? faq.answer : faq.languages[language]?.answer || faq.answer,
  }));
}

export async function searchFAQs(query: string, language: string = 'de'): Promise<FAQ[]> {
  const faqs = await getFAQs(language);
  const searchTerm = query.toLowerCase();
  
  return faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm) ||
    faq.answer.toLowerCase().includes(searchTerm) ||
    faq.category.toLowerCase().includes(searchTerm)
  );
}

export async function getFAQsByCategory(category: string, language: string = 'de'): Promise<FAQ[]> {
  const faqs = await getFAQs(language);
  return faqs.filter(faq => faq.category === category);
} 