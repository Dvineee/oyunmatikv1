import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/Auth';
import LobbyPage from './pages/Lobby';
import RoomPage from './pages/Room';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative"
        >
          <div className="w-20 h-20 border-8 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
          <Gamepad2 className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2" />
        </motion.div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-white text-xl font-black italic tracking-tighter animate-bounce">OYUNMATİK</p>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Savaş Alanı Hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route 
            path="/lobby" 
            element={
              <ProtectedRoute>
                <LobbyPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/room/:roomId" 
            element={
              <ProtectedRoute>
                <RoomPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/lobby" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
