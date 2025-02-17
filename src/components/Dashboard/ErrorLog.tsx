'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ErrorEntry {
  process_id: string;
  status: string;
  message: string;
  started_at: string;
  updated_at: string;
}

export default function ErrorLog() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchErrors();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('error_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'processing_status',
          filter: 'status=eq.failed'
        },
        (payload) => {
          if (payload.new) {
            const newError = payload.new as ErrorEntry;
            setErrors(prev => [newError, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchErrors = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('processing_status')
        .select('*')
        .eq('status', 'failed')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setErrors(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching error log:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Fehlerprotokoll</h2>
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Fehlerprotokoll</h2>
        <div className="p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Fehlerprotokoll
        {errors.length > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({errors.length})
          </span>
        )}
      </h2>

      {errors.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          Keine Fehler gefunden
        </div>
      ) : (
        <div className="space-y-4">
          {errors.map((entry) => (
            <div
              key={`${entry.process_id}-${entry.updated_at}`}
              className="border-l-4 border-red-500 pl-4 py-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-red-600">
                    Fehler bei der Verarbeitung
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {entry.message}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(entry.updated_at).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Prozess-ID: {entry.process_id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 