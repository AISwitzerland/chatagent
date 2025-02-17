'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Document {
  process_id: string;
  status: 'processing' | 'completed' | 'failed';
  message: string;
  progress: number;
  started_at: string;
  updated_at: string;
  completed_at?: string;
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    fetchDocuments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('document_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_status'
        },
        (payload) => {
          if (payload.new) {
            const updatedDoc = payload.new as Document;
            setDocuments(prev => {
              const index = prev.findIndex(doc => doc.process_id === updatedDoc.process_id);
              if (index === -1) {
                return [updatedDoc, ...prev];
              }
              const newDocs = [...prev];
              newDocs[index] = updatedDoc;
              return newDocs;
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('processing_status')
        .select('*')
        .order('started_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (fetchError) {
        throw fetchError;
      }

      setDocuments(prev => [...prev, ...(data || [])]);
      setHasMore((data || []).length === pageSize);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    fetchDocuments();
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return 'Abgeschlossen';
      case 'failed':
        return 'Fehlgeschlagen';
      case 'processing':
        return 'In Bearbeitung';
      default:
        return status;
    }
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Verarbeitete Dokumente</h2>
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Verarbeitete Dokumente</h2>
        <div className="p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Verarbeitete Dokumente
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({documents.length})
        </span>
      </h2>

      {documents.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          Keine Dokumente gefunden
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.process_id}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{doc.message}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      ID: {doc.process_id}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(doc.status)}`}>
                    {getStatusText(doc.status)}
                  </span>
                </div>

                {doc.status === 'processing' && (
                  <div className="mt-2">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-blue-600">
                            {doc.progress}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                        <div
                          style={{ width: `${doc.progress}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500 space-x-4">
                  <span>Gestartet: {new Date(doc.started_at).toLocaleString()}</span>
                  {doc.completed_at && (
                    <span>Abgeschlossen: {new Date(doc.completed_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg ${
                  isLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Lade...
                  </div>
                ) : (
                  'Mehr laden'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 