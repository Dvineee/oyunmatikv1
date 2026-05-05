import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, DoorOpen, LogOut, Radio, Loader2 } from 'lucide-react';
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

      <header className="sticky top-0 z-40 bg-[#080808]/80 backdrop-blur-3xl border-b border-white/10 px-4 sm:px-8 pt-4 sm:pt-6 pb-0 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between pb-4 sm:pb-6">
          <div className="flex items-center gap-3 sm:gap-5">
            <motion.div 
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="p-2 sm:p-3 bg-gradient-to-br from-[#FF2D55] to-[#FF9500] rounded-xl sm:rounded-2xl shadow-lg shadow-pink-500/20"
            >
              <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black italic tracking-tighter text-white">OYUNMATİK</h1>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-emerald-500/80">Sistem Aktif</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-8">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 sm:gap-5 bg-white/5 pl-3 sm:pl-6 pr-1 sm:pr-2 py-1 sm:py-2 rounded-xl sm:rounded-[2rem] border border-white/10"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-white leading-none uppercase tracking-wide">{user?.username}</p>
                <div className="flex items-center gap-2 mt-1.5 justify-end">
                  <Sparkles className="w-3 h-3 text-[#FF9500]" />
                  <p className="text-[9px] font-black text-[#FF9500] uppercase tracking-[0.3em]">PROFESYONEL</p>
                </div>
              </div>
              <AvatarDisplay avatarId={user?.avatar_id || 'animal_1'} size="sm" animate ring />
            </motion.div>
            
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={signOut}
              className="p-3 sm:p-4 bg-white/5 hover:bg-red-500/20 rounded-xl sm:rounded-2xl transition-all text-zinc-400 hover:text-red-500 border border-white/10"
              title="Güvenli Çıkış"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </div>

        {/* News Ticker */}
        <div className="border-t border-white/5 bg-white/[0.02] overflow-hidden py-3">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="whitespace-nowrap flex gap-12 text-[9px] font-black uppercase tracking-[0.5em] text-zinc-600"
          >
            <span>• ARENA GÜNCELLEMESİ: YENİ KARAKTERLER EKLENDİ</span>
            <span>• TURNUVA GİRİŞLERİ YAKINDA BAŞLIYOR</span>
            <span>• EN AKTİF SAVAŞÇI: {onlineUsers[0]?.username || 'YÜKLENİYOR...'}</span>
            <span>• CANLI ARENA SAYISI: {rooms.length}</span>
            <span>• KESİNTİSİZ SOHBET KEYFİ AKTİF</span>
            <span>• ARENA GÜNCELLEMESİ: YENİ KARAKTERLER EKLENDİ</span>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 relative z-10">
        <div className="lg:col-span-3 space-y-8 sm:space-y-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 bg-white/[0.02] p-6 sm:p-0 rounded-[2rem] sm:bg-transparent border sm:border-0 border-white/5">
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter italic">ARENA LOBİSİ</h2>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                <div className="h-1 w-8 sm:w-12 bg-[#FF2D55] rounded-full" />
                <p className="text-zinc-500 text-xs sm:text-sm font-bold uppercase tracking-widest">{rooms.length} oda açık</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-[#5856D6] to-[#af52de] text-white font-black px-8 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-xl shadow-indigo-500/20 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform" />
              <span className="tracking-[0.2em] text-sm">YENİ ODA KUR</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-52 sm:h-64 bg-white/5 animate-pulse rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/5" />
                ))
              ) : rooms.length > 0 ? (
                rooms.map((room) => (
                  <motion.div
                    key={room.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -8 }}
                    className="bg-zinc-900/40 backdrop-blur-2xl p-6 sm:p-8 flex flex-col justify-between h-56 sm:h-64 border border-white/5 hover:border-[#5856D6]/50 transition-all rounded-[2.5rem] sm:rounded-[3.5rem] group relative overflow-hidden shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#5856D6]/5 blur-3xl group-hover:bg-[#5856D6]/20 transition-colors" />
                    
                    <div>
                      <div className="flex justify-between items-start mb-4 sm:mb-6">
                        <span className={cn(
                          "text-[9px] sm:text-[10px] font-black py-1.5 sm:py-2 px-3 sm:px-4 rounded-full uppercase tracking-[0.2em] shadow-lg",
                          room.status === 'waiting' 
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                            : "bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20"
                        )}>
                          {room.status === 'waiting' ? '• BEKLİYOR' : '• OYUNDA'}
                        </span>
                        <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/5">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400" />
                          <span className="text-white font-black text-[10px] sm:text-xs">{room.player_count}/{room.max_players}</span>
                        </div>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#5856D6] transition-colors truncate italic tracking-tight">{room.name}</h3>
                      <div className="flex items-center gap-3 mt-3 sm:mt-4 bg-white/5 w-fit px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-white/5">
                        <AvatarDisplay avatarId={room.host_avatar || 'animal_1'} size="xs" ring />
                        <div className="leading-none">
                          <p className="text-[8px] sm:text-[10px] text-zinc-600 font-black uppercase tracking-tighter">LİDER</p>
                          <p className="text-xs sm:text-sm font-black text-zinc-200 mt-0.5">{room.host_name}</p>
                        </div>
                      </div>
                    </div>
                    
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => joinRoom(room.id)}
                      disabled={room.player_count === room.max_players && room.status === 'waiting'}
                      className="w-full bg-white/5 hover:bg-[#5856D6] text-white font-black py-4 sm:py-5 rounded-[1.25rem] sm:rounded-[1.75rem] flex items-center justify-center gap-3 transition-all border border-white/10 shadow-lg group-hover:shadow-indigo-500/20"
                    >
                      <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                      <span className="tracking-widest text-xs sm:text-sm">KATIL</span>
                    </motion.button>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 sm:py-32 text-center border-4 border-dashed border-white/5 rounded-[3rem] sm:rounded-[4rem] bg-white/[0.02]">
                   <motion.div 
                     animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                     transition={{ repeat: Infinity, duration: 4 }}
                     className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl border border-white/10"
                   >
                     <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-100 opacity-20" />
                   </motion.div>
                   <p className="text-zinc-500 font-black text-xs sm:text-sm uppercase tracking-[0.3em] sm:tracking-[0.4em] px-4 leading-relaxed">Şu an arenada kimse yok... <br/>İlk savaşı sen başlat!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 h-fit lg:sticky lg:top-36 shadow-2xl overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-[#5856D6]" />
            
            <div className="flex items-center justify-between mb-8 sm:mb-10">
              <h3 className="font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] text-zinc-500">CANLI OYUNCULAR</h3>
              <div className="flex items-center gap-2 sm:gap-2.5 bg-emerald-500/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-emerald-500 text-[9px] sm:text-[11px] font-black uppercase tracking-tighter">
                  {onlineUsers.length} ONLINE
                </span>
              </div>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {onlineUsers.map((u: any, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={u.id || i} 
                  className="flex items-center gap-4 sm:gap-5 group"
                >
                  <div className="relative">
                    <AvatarDisplay avatarId={u.avatar_id} size="sm" animate ring />
                    <motion.div 
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 sm:border-4 border-[#121212] shadow-xl" 
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-black text-zinc-100 truncate group-hover:text-[#5856D6] transition-colors leading-none">{u.username}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                       <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[#FF9500] rounded-full" />
                       <p className="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-widest">Hazır</p>
                    </div>
                  </div>
                </motion.div>
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
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              transition={{ type: "spring", damping: 20 }}
              className="w-full max-w-lg bg-[#121212] border-2 border-white/10 p-12 rounded-[4rem] relative z-10 shadow-[0_0_100px_rgba(88,86,214,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#5856D6] to-[#FF9500]" />
              <h3 className="text-4xl font-black mb-10 italic tracking-tighter text-white">ARENA KUR</h3>
              
              <div className="space-y-10">
                <div className="relative group">
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-4 tracking-[0.4em] ml-2">ARENA İSMİ GİR</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-[2rem] py-5 px-8 focus:border-[#5856D6]/50 focus:bg-white/10 outline-none transition-all text-base text-white font-black italic shadow-inner"
                    placeholder="Korkutucu bir isim..."
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] ml-2">OYUNCU SAYISI</label>
                    <span className="text-[#5856D6] font-black text-base italic">{maxPlayers} SAVAŞÇI</span>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      min="2"
                      max="4"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                      className="w-full accent-[#5856D6] bg-white/10 rounded-full h-3 appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-3 text-[10px] font-black text-zinc-700 px-1">
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-8 py-5 bg-white/5 text-zinc-500 font-black rounded-[2rem] hover:bg-white/10 hover:text-white transition-all uppercase tracking-[0.2em] text-xs border border-white/5"
                  >
                    VAZGEÇ
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={createRoom}
                    disabled={createLoading || !newRoomName}
                    className="flex-1 px-8 py-5 bg-gradient-to-r from-[#5856D6] to-[#af52de] text-white font-black rounded-[2rem] transition-all uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/30 disabled:opacity-50 relative group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {createLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-white" /> : 'MEYDAN OKU'}
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
