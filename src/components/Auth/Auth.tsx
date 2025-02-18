'use client';

import { useState, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';

interface AuthError extends Error {
  status?: number;
  code?: string;
}

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (loading) return;

      setLoading(true);
      setError(null);

      try {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) throw loginError;

        // Erfolgreicher Login
        window.location.href = '/dashboard';
      } catch (error) {
        const authError = error as AuthError;
        setError(authError.message || 'Anmeldung fehlgeschlagen');
        console.error('Login-Fehler:', {
          message: authError.message,
          code: authError.code,
          status: authError.status,
        });
      } finally {
        setLoading(false);
      }
    },
    [email, password, loading]
  );

  const handleSignUp = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (loading) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        // Erfolgreiche Registrierung
        alert('Bitte überprüfen Sie Ihre E-Mail für den Bestätigungslink!');
      } catch (error) {
        const authError = error as AuthError;
        setError(authError.message || 'Registrierung fehlgeschlagen');
        console.error('Registrierungs-Fehler:', {
          message: authError.message,
          code: authError.code,
          status: authError.status,
        });
      } finally {
        setLoading(false);
      }
    },
    [email, password, loading]
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Swiss Insurance Login
          </h2>
        </div>

        <form className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="E-Mail-Adresse"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Passwort"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Wird geladen...' : 'Anmelden'}
            </button>

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {loading ? 'Wird geladen...' : 'Registrieren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
