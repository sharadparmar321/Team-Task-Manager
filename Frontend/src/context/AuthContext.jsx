import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (isMounted) {
          setUser(response.user);
        }
      } catch (error) {
        setStoredToken('');
        if (isMounted) {
          setToken('');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function login(credentials) {
    const response = await api.post('/auth/login', credentials, { token: false });
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }

  async function signup(credentials) {
    const response = await api.post('/auth/signup', credentials, { token: false });
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }

  function logout() {
    setStoredToken('');
    setToken('');
    setUser(null);
  }

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: Boolean(user && token),
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}