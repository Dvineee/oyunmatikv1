import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, socket } from '../lib/api';

interface User {
  id: string;
  username: string;
  avatar_id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
  signIn: (data: any) => Promise<void>;
  signUp: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await api.get('/api/me');
          setUser(userData);
          socket.connect();
          socket.emit('auth', token);
        } catch (err) {
          console.error("Auth init error:", err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();

    // Güvenlik amaçlı: 5 saniye sonra yükleme ekranını her türlü kapat
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const signIn = async (credentials: any) => {
    const { token, user: userData } = await api.post('/api/auth/signin', credentials);
    localStorage.setItem('token', token);
    setUser(userData);
    socket.connect();
    socket.emit('auth', token);
  };

  const signUp = async (credentials: any) => {
    const { token, user: userData } = await api.post('/api/auth/signup', credentials);
    localStorage.setItem('token', token);
    setUser(userData);
    socket.connect();
    socket.emit('auth', token);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
