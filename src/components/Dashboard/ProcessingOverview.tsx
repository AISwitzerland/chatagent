'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProcessingEntry {
  process_id: string;
  status: 'processing' | 'completed' | 'failed';
  message: string;
  progress: number;
  started_at: string;
  updated_at: string;
  completed_at?: string;
}

export default function ProcessingOverview() {
  const [activeProcesses, setActiveProcesses] = useState<ProcessingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveProcesses();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('processing_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_status'
        },
        (payload) => {
          if (payload.new) {
            const updatedProcess = payload.new as ProcessingEntry;
            
            if (updatedProcess.status === 'processing') {
              setActiveProcesses(prev => {
                const exists = prev.some(p => p.process_id === updatedProcess.process_id);
                if (!exists) {
                  return [...prev, updatedProcess];
                }
                return prev.map(p => 
                  p.process_id === updatedProcess.process_id ? updatedProcess : p
                );
              });
            } else {
              setActiveProcesses(prev => 
                prev.filter(p => p.process_id !== updatedProcess.process_id)
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchActiveProcesses = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('processing_status')
        .select('*')
        .eq('status', 'processing')
        .order('started_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setActiveProcesses(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching active processes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Aktive Verarbeitungen</h2>
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Aktive Verarbeitungen</h2>
        <div className="p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Aktive Verarbeitungen
        {activeProcesses.length > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({activeProcesses.length})
          </span>
        )}
      </h2>

      {activeProcesses.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          Keine aktiven Verarbeitungen
        </div>
      ) : (
        <div className="space-y-4">
          {activeProcesses.map((process) => (
            <div
              key={process.process_id}
              className="border rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">{process.message}</div>
                <div className="text-sm text-gray-500">
                  {new Date(process.started_at).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {process.progress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${process.progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 