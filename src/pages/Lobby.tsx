import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, DoorOpen, LogOut, Radio, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AvatarDisplay } from '../components/AvatarPicker';
import { playSound } from '../lib/sounds';
import { api, socket } from '../lib/api';

interface Room {
  id: string;
  name: string;
  host_id: string;
  max_players: number;
  status: string;
  player_count: number;
  host_name?: string;
  host_avatar?: string;
}

export default function LobbyPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);

  const fetchRooms = async () => {
    try {
      const data = await api.get('/api/rooms');
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();

    socket.on('rooms_updated', fetchRooms);
    socket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    socket.on('room_created', (data) => {
      navigate(`/room/${data.id}`);
    });

    socket.on('error', (msg) => {
      alert(msg);
      setLoading(false);
      setCreateLoading(false);
    });

    return () => {
      socket.off('rooms_updated');
      socket.off('online_users');
      socket.off('room_created');
      socket.off('error');
    };
  }, []);

  const createRoom = () => {
    if (!newRoomName || !user) return;
    setCreateLoading(true);
    socket.emit('create_room', { name: newRoomName, maxPlayers });
  };

  const joinRoom = (roomId: string) => {
    if (!user) return;
    playSound('click');
    const room = rooms.find(r => r.id === roomId);
    if (room && room.player_count >= room.max_players) {
       playSound('error');
       return;
    }
    socket.emit('join_room', roomId);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 font-sans pb-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[#FF2D55]/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-[#5856D6]/20 blur-[150px] rounded-full" />
      </div>

      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-3xl border-b border-white/5 px-4 sm:px-8 py-4 sm:py-5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 sm:p-3 bg-white/[0.03] rounded-xl border border-white/10 shadow-lg">
              <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter text-white">OYUNMATİK</h1>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Global Sunucu</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-4 bg-white/[0.02] pl-4 pr-1 py-1 rounded-2xl border border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white leading-none uppercase tracking-wide">{user?.username}</p>
                <div className="flex items-center justify-end mt-1 opacity-40">
                  <p className="text-[8px] font-black text-white uppercase tracking-[0.2em]">PROFESYONEL</p>
                </div>
              </div>
              <AvatarDisplay avatarId={user?.avatar_id || 'animal_1'} size="sm" />
            </div>
            
            <button 
              onClick={signOut}
              className="p-3 sm:p-4 bg-white/[0.03] hover:bg-red-500/10 rounded-xl sm:rounded-2xl transition-all text-zinc-500 hover:text-red-500 border border-white/5"
            >
              <LogOut className="w-4 h-4 sm:w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 relative z-10">
        <div className="lg:col-span-3 space-y-8 sm:space-y-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter italic">ARENA LOBİSİ</h2>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                <div className="h-0.5 w-10 bg-white/20 rounded-full" />
                <p className="text-zinc-600 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em]">{rooms.length} SAVAŞ ODASI</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto bg-white text-black font-black px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl hover:bg-zinc-200"
            >
              <Plus className="w-5 h-5" />
              <span className="tracking-[0.1em] text-xs">YENİ ODA KUR</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-52 bg-white/[0.01] border border-white/5 rounded-3xl" />
                ))
              ) : rooms.length > 0 ? (
                rooms.map((room) => (
                  <motion.div
                    key={room.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#0F0F0F] border border-white/5 p-6 sm:p-8 rounded-[2rem] flex flex-col justify-between hover:bg-white/[0.02] hover:border-white/10 transition-all duration-300 shadow-xl"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <span className={cn(
                          "text-[8px] sm:text-[9px] font-black py-1 px-3 rounded text-white tracking-[0.2em] border border-white/10",
                          room.status === 'waiting' ? "bg-emerald-500/10" : "bg-zinc-800"
                        )}>
                          {room.status === 'waiting' ? 'BEKLEYİŞ' : 'OYUNDA'}
                        </span>
                        <div className="flex items-center gap-2">
                           <Users className="w-3 h-3 text-zinc-700" />
                           <span className="text-zinc-600 font-bold text-[10px]">{room.player_count}/{room.max_players}</span>
                        </div>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white truncate italic uppercase tracking-tight leading-none">{room.name}</h3>
                      <p className="text-[10px] text-zinc-800 font-black mt-3">LİDER: {room.host_name}</p>
                    </div>
                    
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => joinRoom(room.id)}
                      disabled={room.player_count === room.max_players && room.status === 'waiting'}
                      className="w-full bg-white/[0.03] hover:bg-white text-zinc-500 hover:text-black font-black py-4 rounded-xl mt-8 transition-all border border-white/5 flex items-center justify-center gap-3 text-[10px] tracking-widest"
                    >
                      KATIL
                      <DoorOpen className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center border border-dashed border-white/10 rounded-[3rem]">
                    <p className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.4em]">Savaş başlatılmayı bekliyor...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

          <div className="space-y-8">
            <div className="bg-[#0F0F0F] border border-white/5 rounded-3xl p-8 sticky top-32 shadow-2xl">
              <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-8">AKTİF SAVAŞÇILAR ({onlineUsers.length})</h3>
              
              <div className="space-y-5">
                {onlineUsers.map((u: any, i) => (
                  <div key={u.id || i} className="flex items-center gap-4">
                    <AvatarDisplay avatarId={u.avatar_id} size="sm" />
                    <div>
                      <p className="text-xs sm:text-sm font-black text-white/80 uppercase tracking-tight">{u.username}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">ONLINE</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-lg bg-[#0F0F0F] border border-white/5 p-12 rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden"
            >
              <h3 className="text-3xl font-black mb-8 italic tracking-tighter text-white uppercase">ARENA OLUŞTUR</h3>
              
              <div className="space-y-10">
                <div className="relative group">
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-4 tracking-[0.4em] ml-1">Savaş Alanı İsmi</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 px-6 focus:border-white/10 outline-none transition-all text-base text-white font-medium"
                    placeholder="Efsanevi bişey..."
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-6 px-1">
                    <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Kapasite</label>
                    <span className="text-white font-black text-sm">{maxPlayers} OYUNCU</span>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      min="2"
                      max="4"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                      className="w-full accent-white bg-white/5 rounded-full h-1 appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-4 bg-white/[0.02] text-zinc-500 font-black rounded-xl hover:text-white transition-all uppercase tracking-[0.2em] text-[10px] border border-white/5"
                  >
                    KAPAT
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={createRoom}
                    disabled={createLoading || !newRoomName}
                    className="flex-1 py-4 bg-white text-black font-black rounded-xl transition-all uppercase tracking-[0.2em] text-[10px] shadow-xl disabled:opacity-20 flex items-center justify-center gap-2"
                  >
                    {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'BAŞLAT'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Gamepad2(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    >
      <line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15" y1="13" y2="13"/><line x1="18" x2="18" y1="11" y2="11"/><path d="M6.12 2.7a2 2 0 0 1 1.76 0l11.4 5.7c.6.3 1.1.8 1.4 1.4L22.1 14.5a3 3 0 0 1-1.8 4.1l-10.2 3.4a4.3 4.3 0 0 1-2.6 0L2.3 19.8A3 3 0 0 1 .5 15.7l1.7-4.7c.3-.6.8-1.1 1.4-1.4l2.5-6.9z"/>
    </svg>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
