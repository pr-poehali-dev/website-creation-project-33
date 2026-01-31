import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
}

interface LoginResult {
  success: boolean;
  requires_2fa?: boolean;
  user_id?: number;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  verify2FA: (userId: number, code: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'https://functions.poehali.dev/d4f30ed2-6b6b-4e8a-a691-2c364dd41e43';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getSessionToken = () => localStorage.getItem('session_token');
  const setSessionToken = (token: string) => localStorage.setItem('session_token', token);
  const removeSessionToken = () => localStorage.removeItem('session_token');

  const checkAuth = async () => {
    const token = getSessionToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const lastOrgResetDate = localStorage.getItem('last_org_reset');
    const today = new Date().toDateString();
    
    if (lastOrgResetDate !== today) {
      localStorage.removeItem('selected_organization');
      localStorage.setItem('last_org_reset', today);
    }

    try {
      const response = await fetch(API_BASE, {
        method: 'GET',
        headers: {
          'X-Session-Token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        removeSessionToken();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      removeSessionToken();
    }
    
    setLoading(false);
  };



  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Проверяем, требуется ли 2FA
        if (data.requires_2fa) {
          return {
            success: false,
            requires_2fa: true,
            user_id: data.user_id,
          };
        }

        // Обычный вход без 2FA
        setSessionToken(data.session_token);
        setUser(data.user);
        return { success: true };
      }

      return { 
        success: false, 
        error: data.error || 'Ошибка входа'
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Ошибка подключения'
      };
    }
  };

  const verify2FA = async (userId: number, code: string): Promise<boolean> => {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify_2fa',
          user_id: userId,
          code,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSessionToken(data.session_token);
          setUser(data.user);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('2FA verification error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean | 'pending' | { error: string }> => {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register',
          email,
          password,
          name,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.pending_approval) {
          return 'pending';
        }
        setSessionToken(data.session_token);
        setUser(data.user);
        return true;
      }
      
      return { error: data.error || 'Ошибка регистрации' };
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'Ошибка подключения к серверу' };
    }
  };

  const logout = () => {
    removeSessionToken();
    localStorage.removeItem('selected_organization');
    localStorage.removeItem('last_org_reset');
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    login,
    verify2FA,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}