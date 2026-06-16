/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { clearSession, readSession, writeSession } from '../lib/auth';
import { getErrorMessage } from '../lib/errors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());

  useEffect(() => {
    if (session?.token) {
      api.defaults.headers.common.Authorization = `Bearer ${session.token}`;
      writeSession(session);
      return;
    }

    delete api.defaults.headers.common.Authorization;
    clearSession();
  }, [session]);

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

      setSession(nextSession);
      return nextSession;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Login gagal. Periksa username dan password.'));
    }
  }, []);

  const logout = useCallback(() => {
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
