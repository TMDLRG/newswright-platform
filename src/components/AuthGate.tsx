'use client';

import { useState, useEffect, createContext, useContext } from 'react';

interface AuthState {
  authenticated: boolean;
  token: string;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  authenticated: false,
  token: '',
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [token, setToken] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check for saved token on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('nw-edit-token');
    if (saved) {
      validateToken(saved);
    } else {
      setChecking(false);
    }
  }, []);

  async function validateToken(t: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
      });
      const data = await res.json();
      if (data.valid) {
        setToken(t);
        setAuthenticated(true);
        sessionStorage.setItem('nw-edit-token', t);
      } else {
        setError('Invalid token');
        sessionStorage.removeItem('nw-edit-token');
      }
    } catch {
      setError('Failed to validate token');
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  function logout() {
    setToken('');
    setAuthenticated(false);
    sessionStorage.removeItem('nw-edit-token');
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm">Checking authentication...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-xl font-bold text-nw-primary mb-2">Partner Edit Mode</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter the partner access token to unlock editing capabilities.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              validateToken(inputToken);
            }}
          >
            <input
              type="password"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="Enter partner token"
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !inputToken}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Validating...' : 'Unlock Edit Mode'}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Read-only investor view is always accessible without authentication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authenticated, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
