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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#5856D615,transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <motion.div 
          animate={{ 
            x: [0, 150, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-[#FF2D55] blur-[140px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            x: [0, -120, 0],
            y: [0, 100, 0],
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-[#5856D6] blur-[140px] rounded-full" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="w-full max-w-xl bg-zinc-900/40 backdrop-blur-[40px] border border-white/10 p-12 lg:p-16 rounded-[4rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden"
      >
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 w-full flex h-1.5">
          <div className="flex-1 bg-[#FF2D55]" />
          <div className="flex-1 bg-[#5856D6]" />
          <div className="flex-1 bg-[#FF9500]" />
          <div className="flex-1 bg-[#34C759]" />
        </div>
        
        <div className="flex flex-col items-center mb-10 sm:mb-14">
          <motion.div 
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
            className="p-6 sm:p-8 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] mb-6 sm:mb-8 shadow-2xl relative group cursor-pointer border border-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF2D55] to-[#5856D6] rounded-[2rem] sm:rounded-[2.5rem] opacity-20 group-hover:opacity-40 transition-opacity" />
            <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16 text-white relative z-10" />
          </motion.div>

          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white mb-3 sm:mb-4 flex justify-center gap-1 sm:gap-1.5">
              {Array.from("OYUNMATİK").map((l, i) => (
                <motion.span 
                  key={i}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.04, type: "spring", damping: 12 }}
                  className="inline-block"
                >
                  {l}
                </motion.span>
              ))}
            </h1>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-2 sm:gap-3 bg-indigo-500/10 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-indigo-500/20 mx-auto w-fit"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-indigo-400 font-black text-[9px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.5em]">Geleceğin Oyun Arenası</span>
            </motion.div>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-8 sm:y-10">
          <div className="space-y-6 sm:space-y-8">
            <div className="relative group">
              <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3 sm:mb-4 ml-2 sm:ml-3">OYUNCU KİMLİĞİ</label>
              <div className="relative">
                <User className="absolute left-6 sm:left-7 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 group-focus-within:text-white transition-colors z-10" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/[0.03] border-2 border-white/5 rounded-[1.5rem] sm:rounded-[2rem] py-5 sm:py-6 pl-14 sm:pl-16 pr-6 sm:pr-8 focus:bg-white/5 focus:border-[#5856D6]/40 outline-none transition-all placeholder:text-zinc-700 text-base sm:text-lg font-bold text-white shadow-inner"
                  placeholder="Kullanıcı adını seç..."
                />
              </div>
            </div>

            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3 sm:mb-4 ml-2 sm:ml-3">KARAKTERİNİ BELİRLE</label>
                <AvatarPicker selectedId={avatarUrl} onSelect={setAvatarUrl} />
              </motion.div>
            )}

            <div className="relative group">
              <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3 sm:mb-4 ml-2 sm:ml-3">GÜVENLİK KODU</label>
              <div className="relative">
                <Lock className="absolute left-6 sm:left-7 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 group-focus-within:text-white transition-colors z-10" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border-2 border-white/5 rounded-[1.5rem] sm:rounded-[2rem] py-5 sm:py-6 pl-14 sm:pl-16 pr-6 sm:pr-8 focus:bg-white/5 focus:border-[#5856D6]/40 outline-none transition-all placeholder:text-zinc-700 text-base sm:text-lg font-bold text-white shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-5 sm:p-6 bg-red-500/10 border-2 border-red-500/20 rounded-[1.5rem] sm:rounded-[2rem] text-red-400 text-[10px] sm:text-xs font-black text-center uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3"
              >
                <span className="text-lg sm:text-xl">⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-black py-5 sm:py-6 rounded-[2rem] sm:rounded-[2.5rem] transition-all duration-300 flex items-center justify-center gap-3 sm:gap-4 disabled:opacity-50 shadow-[0_20px_40px_rgba(255,255,255,0.1)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {loading ? (
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
            ) : (
              <>
                <span className="tracking-[0.3em] sm:tracking-[0.4em] uppercase text-xs sm:text-sm">{isLogin ? 'ARENAYA GİRİŞ YAP' : 'SAVAŞA ÜYE OL'}</span>
                <Gamepad2 className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-all" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-12 pt-10 border-t border-white/5 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); playSound('click'); }}
            className="text-zinc-500 hover:text-white text-[11px] font-black uppercase tracking-[0.4em] transition-all relative group"
          >
            <span>{isLogin ? "Hala bir hesabın yok mu? Kaydol" : "Zaten bizimlesin! Hemen Giriş Yap"}</span>
            <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-0 h-1 bg-[#5856D6] group-hover:w-full transition-all rounded-full" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
