'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  averageTime?: number;
  successRate?: number;
}

export default function Statistics() {
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();

    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStatistics, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchStatistics = async () => {
    try {
      // Get counts for different statuses
      const { data: statusCounts, error: countError } = await supabase
        .from('processing_status')
        .select('status', { count: 'exact' })
        .in('status', ['completed', 'failed', 'processing']);

      if (countError) throw countError;

      // Calculate counts
      const total = statusCounts?.length || 0;
      const completed = statusCounts?.filter(row => row.status === 'completed').length || 0;
      const failed = statusCounts?.filter(row => row.status === 'failed').length || 0;
      const inProgress = statusCounts?.filter(row => row.status === 'processing').length || 0;

      // Calculate success rate
      const successRate = total > 0 ? (completed / total) * 100 : 0;

      // Get average processing time for completed documents
      const { data: completedDocs, error: timeError } = await supabase
        .from('processing_status')
        .select('started_at, completed_at')
        .eq('status', 'completed')
        .not('completed_at', 'is', null);

      if (timeError) throw timeError;

      // Calculate average processing time
      let averageTime = 0;
      if (completedDocs && completedDocs.length > 0) {
        const totalTime = completedDocs.reduce((sum, doc) => {
          const start = new Date(doc.started_at).getTime();
          const end = new Date(doc.completed_at!).getTime();
          return sum + (end - start);
        }, 0);
        averageTime = totalTime / completedDocs.length / 1000; // Convert to seconds
      }

      setStats({
        total,
        completed,
        failed,
        inProgress,
        averageTime,
        successRate,
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Statistiken</h2>
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Statistiken</h2>
        <div className="p-4 text-red-700 bg-red-100 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Statistiken</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">Gesamt</div>
          <div className="text-2xl font-semibold">{stats?.total || 0}</div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-green-600 mb-1">Abgeschlossen</div>
          <div className="text-2xl font-semibold">{stats?.completed || 0}</div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-sm text-yellow-600 mb-1">In Bearbeitung</div>
          <div className="text-2xl font-semibold">{stats?.inProgress || 0}</div>
        </div>

        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-sm text-red-600 mb-1">Fehlgeschlagen</div>
          <div className="text-2xl font-semibold">{stats?.failed || 0}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Erfolgsrate</div>
          <div className="text-2xl font-semibold">
            {stats?.successRate ? stats.successRate.toFixed(1) : 0}%
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Durchschnittliche Zeit</div>
          <div className="text-2xl font-semibold">
            {stats?.averageTime ? (stats.averageTime / 60).toFixed(1) : 0} min
          </div>
        </div>
      </div>
    </div>
  );
}
