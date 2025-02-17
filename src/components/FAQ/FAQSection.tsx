import { useState, useEffect } from 'react';
import { FAQ } from '@/types';
import { getFAQs, searchFAQs } from '@/services/faqService';
import { SUPPORTED_LANGUAGES } from '@/services/languageService';

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('de');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFAQs();
  }, [language]);

  const loadFAQs = async () => {
    setLoading(true);
    try {
      const data = await getFAQs(language);
      setFaqs(data);
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchFAQs(query, language);
      setFaqs(results);
    } else {
      loadFAQs();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <input
          type="text"
          placeholder="FAQ durchsuchen..."
          className="w-full p-2 border rounded-lg"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mt-2 p-2 border rounded-lg"
        >
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center">Laden...</div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">{faq.question}</h3>
              <p className="text-gray-700">{faq.answer}</p>
              <div className="mt-2 text-sm text-gray-500">{faq.category}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 