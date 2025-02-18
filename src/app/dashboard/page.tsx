'use client';

import { useState } from 'react';
import ProcessingOverview from '../../components/Dashboard/ProcessingOverview';
import ErrorLog from '../../components/Dashboard/ErrorLog';
import Statistics from '../../components/Dashboard/Statistics';
import DocumentList from '../../components/Dashboard/DocumentList';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function DashboardPage() {
  const [isProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dokumentverarbeitung Dashboard</h1>
        {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      </div>

      {isProcessing && (
        <div className="flex justify-center items-center mb-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Dokumente werden verarbeitet...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ProcessingOverview />
        <Statistics />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ErrorLog />
        <DocumentList />
      </div>
    </div>
  );
}
