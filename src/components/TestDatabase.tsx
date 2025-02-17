'use client';

import { useState } from 'react';
import { testDatabaseConnection } from '@/services/testDatabaseService';

export default function TestDatabase() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    try {
      const result = await testDatabaseConnection();
      setResults(result);
    } catch (error) {
      console.error('Test fehlgeschlagen:', error);
      setResults({ success: false, error });
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <button
        onClick={handleTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Teste...' : 'Datenbank testen'}
      </button>

      {results && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
    </div>
  );
} 