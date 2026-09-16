import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/apiClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ruby_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('ruby_token'))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthed: Boolean(user),
      login: async (payload) => {
        const res = await api.post('/auth/login', payload);
        localStorage.setItem('ruby_token', res.data.token);
        setUser(res.data.user);
      },
      register: async (payload) => {
        const res = await api.post('/auth/register', payload);
        localStorage.setItem('ruby_token', res.data.token);
        setUser(res.data.user);
      },
      logout: () => {
        localStorage.removeItem('ruby_token');
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
