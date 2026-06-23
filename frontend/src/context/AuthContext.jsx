/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import api from '../lib/api';
import { readSession, writeSession, clearSession } from '../lib/auth';
import { getErrorMessage } from '../lib/errors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());

  const login = useCallback(async ({ username, password }) => {
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
      });

      const nextSession = {
        token: response.data.token,
        user: response.data.user,
      };

      writeSession(nextSession);
      setSession(nextSession);
      return nextSession;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Login gagal. Periksa username dan password.'));
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      session,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
