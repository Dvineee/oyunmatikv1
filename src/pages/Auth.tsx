import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AvatarPicker } from '../components/AvatarPicker';
import { Gamepad2, Lock, User, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { playSound } from '../lib/sounds';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('animal_1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { refreshProfile } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    playSound('click');

    // Arka planda kullanılacak benzersiz e-posta mappingi için kullanıcı adını temizle
    const sanitizedUsername = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
    const dummyEmail = `${sanitizedUsername}@oyunmatik.com`;

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email: dummyEmail, 
          password 
        });
        if (signInError) {
          if (signInError.message.includes('rate limit')) {
            throw new Error('Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin.');
          }
          throw new Error('Giriş başarısız. Kullanıcı adı veya şifre hatalı.');
        }
        playSound('success');
      } else {
        if (username.length < 3) throw new Error('Kullanıcı adı en az 3 karakter olmalıdır.');
        
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email: dummyEmail, 
          password,
          options: {
            data: { username, avatar_url: avatarUrl }
          }
        });
        
        if (signUpError) {
          if (signUpError.message.includes('rate limit')) {
            throw new Error('Kayıt limiti aşıldı. Lütfen daha sonra tekrar deneyin.');
          }
          throw signUpError;
        }
        if (!data.user) throw new Error('Kayıt işlemi başarısız oldu.');

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, username, avatar_url: avatarUrl }]);
        
        if (profileError) {
           if (profileError.code === '23505') throw new Error('Bu kullanıcı adı zaten alınmış.');
           if (profileError.message.includes('row-level security')) {
             throw new Error('Sunucu yapılandırma hatası (RLS). Lütfen yöneticiye bildirin.');
           }
           throw profileError;
        }

        playSound('success');
        await refreshProfile();
      }
    } catch (err: any) {
      setError(err.message);
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans text-zinc-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="p-4 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-3xl mb-6 shadow-lg shadow-indigo-500/20"
          >
            <Gamepad2 className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">OYUNMATİK</h1>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] uppercase tracking-[0.3em]">
            <Sparkles className="w-3 h-3" />
            <span>Dijital Oyun Arenası</span>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Kullanıcı Adı</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 focus:bg-white/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm"
                  placeholder="Kullanıcı adınızı girin"
                />
              </div>
            </div>

            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Karakter Seç</label>
                <AvatarPicker selectedId={avatarUrl} onSelect={setAvatarUrl} />
              </motion.div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Şifre</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 focus:bg-white/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-[1.25rem] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="tracking-widest uppercase text-sm">{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</span>
                <Gamepad2 className="w-5 h-5 opacity-50" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); playSound('click'); }}
            className="text-zinc-500 hover:text-indigo-400 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors"
          >
            {isLogin ? "Hesabınız yok mu? Hemen Kaydol" : "Zaten üye misiniz? Giriş Yap"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
