import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.js';
import { setAccessToken } from '../api/http.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: try to restore session via refresh then /me
  useEffect(() => {
    (async () => {
      try {
        const { data: refreshData } = await authApi.refresh();
        setAccessToken(refreshData.data.accessToken);
        const { data: meData } = await authApi.me();
        const storedRole = localStorage.getItem('staffsync_role');
        setUser({ ...meData.data, ...(storedRole ? { role: storedRole } : {}) });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    setAccessToken(data.data.accessToken);
    const storedRole = localStorage.getItem('staffsync_role');
    const u = { ...data.data.user, ...(storedRole ? { role: storedRole } : {}) };
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('staffsync_role');
    setAccessToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    if (updates.role) {
      localStorage.setItem('staffsync_role', updates.role);
    }
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
