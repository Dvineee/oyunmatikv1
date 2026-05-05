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
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-zinc-500 text-xs font-medium animate-pulse uppercase tracking-widest">Başlatılıyor...</p>
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
