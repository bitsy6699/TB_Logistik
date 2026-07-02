/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../lib/api';
import { readSession, writeSession, clearSession } from '../lib/auth';
import { getErrorMessage } from '../lib/errors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const socketRef = useRef(null);

  useEffect(() => {
    if (session?.token) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const s = io(API_URL, {
        auth: { token: session.token },
        transports: ['websocket', 'polling'],
      });
      socketRef.current = s;
      return () => { s.disconnect(); socketRef.current = null; };
    }
    socketRef.current = null;
  }, [session?.token]);

  const getSocket = useCallback(() => socketRef.current, []);

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
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      session,
      isAuthenticated: Boolean(session?.token),
      getSocket,
      login,
      logout,
    }),
    [getSocket, login, logout, session],
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
