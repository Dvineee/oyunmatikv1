import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  is_online: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    // Güvenlik zaman aşımı: 10 saniye içinde yanıt gelmezse yükleme ekranını kapat
    const safetyTimeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn('Kimlik doğrulama zaman aşımına uğradı, uygulama başlatılıyor...');
          return false;
        }
        return prev;
      });
    }, 10000);

    try {
      // İlk oturumu al
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => {
            setLoading(false);
            clearTimeout(safetyTimeout);
          });
        } else {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }).catch(err => {
        console.error('Oturum getirme hatası:', err);
        setLoading(false);
        clearTimeout(safetyTimeout);
      });

      // Değişiklikleri dinle
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
        clearTimeout(safetyTimeout);
      });

      return () => {
        subscription?.unsubscribe();
        clearTimeout(safetyTimeout);
      };
    } catch (err) {
      console.error('Kimlik doğrulama başlatma hatası:', err);
      setLoading(false);
      clearTimeout(safetyTimeout);
    }
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
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
