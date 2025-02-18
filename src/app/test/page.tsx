'use client';

import { useEffect, useState } from 'react';
import TestDatabase from '../../components/TestDatabase';
import Auth from '../../components/Auth';
import { supabase } from '../../services/supabaseClient';

export default function TestPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Datenbank-Test</h1>
      {session ? <TestDatabase /> : <Auth />}
    </div>
  );
}
