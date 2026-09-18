import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('tribuneo_token'));
  const [loading, setLoading] = useState(true);

  // Vérifie le token au démarrage (ou récupère depuis URL après Google OAuth)
  useEffect(() => {
    // Récupère le token depuis l'URL si retour depuis Google
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const authError = params.get('auth_error');

    if (urlToken) {
      localStorage.setItem('tribuneo_token', urlToken);
      setToken(urlToken);
      // Nettoie l'URL
      window.history.replaceState({}, '', '/');
    }

    if (authError) {
      window.history.replaceState({}, '', '/');
      setLoading(false);
      return;
    }

    const activeToken = urlToken || token;

    if (activeToken) {
      axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      })
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('tribuneo_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('tribuneo_token', newToken);
    setToken(newToken);
    setUser(newUser);
    // Injecter le token dans tous les appels axios futurs
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('tribuneo_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (newUser, newToken) => {
    setUser(newUser);
    if (newToken) {
      localStorage.setItem('tribuneo_token', newToken);
      setToken(newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }
  };

  // Injecter le token dans axios si déjà présent
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
