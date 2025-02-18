'use client';

import { useState } from 'react';
import { signInWithEmail, signUp } from '../services/supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      window.location.reload(); // Seite neu laden nach erfolgreicher Anmeldung
    } catch (error) {
      console.error('Login error:', error);
      // Fallback: Versuche Registrierung wenn Login fehlschlägt
      try {
        await signUp(email, password);
        window.location.reload();
      } catch (signUpError) {
        console.error('Signup error:', signUpError);
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Login / Register'}
      </button>
    </form>
  );
}
