import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
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

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/lobby" replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    playSound('click');

    try {
      if (isLogin) {
        await signIn({ username, password });
        playSound('success');
        navigate('/lobby');
      } else {
        if (username.length < 3) throw new Error('Kullanıcı adı en az 3 karakter olmalıdır.');
        await signUp({ username, password, avatar_id: avatarUrl });
        playSound('success');
        navigate('/lobby');
      }
    } catch (err: any) {
      setError(err.message);
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans text-zinc-100 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1A1A1A,transparent_70%)]" />
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-pink-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-[#0F0F0F] border border-white/5 p-10 sm:p-16 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] relative z-10 overflow-hidden"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="p-5 bg-white/[0.03] rounded-2xl mb-8 border border-white/5">
            <Gamepad2 className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>

          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white mb-4">
              OYUNMATİK
            </h1>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em]">Dijital Oyun Arenası</p>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-8">
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2 ml-1">Kullanıcı Adı</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:bg-white/[0.04] focus:border-white/10 outline-none transition-all placeholder:text-zinc-800 text-sm font-medium text-white"
                  placeholder="Seçin..."
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1">Profil Karakteri</label>
                <AvatarPicker selectedId={avatarUrl} onSelect={setAvatarUrl} />
              </div>
            )}

            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2 ml-1">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 focus:bg-white/[0.04] focus:border-white/10 outline-none transition-all placeholder:text-zinc-800 text-sm font-medium text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500/80 text-[10px] font-black text-center uppercase tracking-widest"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-20 shadow-xl hover:bg-zinc-200"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="tracking-[0.2em] uppercase text-xs">{isLogin ? 'GİRİŞ YAP' : 'KATIL'}</span>
                <Gamepad2 className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-12 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); playSound('click'); }}
            className="text-zinc-600 hover:text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all underline underline-offset-8"
          >
            {isLogin ? "BİR HESAP OLUŞTUR" : "ZATEN BİR HESABIM VAR"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
