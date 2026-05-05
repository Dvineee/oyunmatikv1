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
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans pb-20">
      <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-3xl border-b border-white/5 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <h1 className="text-xl font-black italic tracking-tighter shadow-indigo-500/50">OYUNMATİK</h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 pr-8 border-r border-white/5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white leading-none">{user?.username}</p>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1.5 font-bold">PROFİLİM</p>
            </div>
            <AvatarDisplay avatarId={user?.avatar_id || 'animal_1'} size="sm" />
          </div>
          
          <button 
            onClick={signOut}
            className="p-3 bg-white/5 hover:bg-red-500/10 rounded-2xl transition-all text-zinc-400 hover:text-red-400 border border-white/5"
            title="Çıkış Yap"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Aktif Odalar</h2>
              <p className="text-zinc-500 text-sm mt-1">Hemen bir savaşa katıl veya kendi odanı kur</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-all hover:shadow-xl hover:shadow-indigo-500/20 active:scale-95 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              YENİ ODA KUR
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-44 bg-white/5 animate-pulse rounded-[2rem] border border-white/5" />
                ))
              ) : rooms.length > 0 ? (
                rooms.map((room) => (
                  <motion.div
                    key={room.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8 }}
                    className="glass-card p-6 flex flex-col justify-between h-52 group cursor-default"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-bold py-1 px-3 bg-white/5 border border-white/5 rounded-full text-zinc-400 uppercase tracking-[0.2em]">
                          {room.status === 'waiting' ? 'BEKLİYOR' : 'OYUNDA'}
                        </span>
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold font-mono">
                          <Users className="w-3.5 h-3.5" />
                          <span>{room.player_count}/{room.max_players}</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{room.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <AvatarDisplay avatarId={room.host_avatar || 'animal_1'} size="xs" />
                        <p className="text-[11px] text-zinc-500">Kuran: <span className="text-zinc-300 font-bold">{room.host_name}</span></p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => joinRoom(room.id)}
                      disabled={room.player_count === room.max_players && room.status === 'waiting'}
                      className="w-full bg-white/5 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5 active:scale-95 group-hover:bg-indigo-600/20"
                    >
                      <DoorOpen className="w-4 h-4 opacity-50" />
                      KATIL
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                   <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Gamepad2 className="w-10 h-10 text-zinc-700" />
                   </div>
                   <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.3em]">Henüz aktif oda bulunmuyor</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 h-fit sticky top-32">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-sm uppercase tracking-[0.2em] text-zinc-400">AKTİF ÜYELER</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                  {onlineUsers.length} CANLI
                </span>
              </div>
            </div>
            
            <div className="space-y-5">
              {onlineUsers.map((u: any, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={u.id || i} 
                  className="flex items-center gap-4 group px-2 py-1"
                >
                  <div className="relative">
                    <AvatarDisplay avatarId={u.avatar_id} size="sm" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 shadow-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-100 truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{u.username}</p>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Savaş Arıyor</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="w-full max-w-md bg-zinc-900 border border-white/5 p-10 rounded-[3rem] relative z-10 shadow-2xl"
            >
              <h3 className="text-3xl font-black mb-8 italic tracking-tighter text-white">ODA OLUŞTUR</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-3 tracking-[0.3em] ml-1">ODA ADI</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-[1.5rem] py-4 px-6 focus:border-indigo-500/50 outline-none transition-all text-sm text-white"
                    placeholder="Efsanevi bir isim seç..."
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] ml-1">KİŞİ SAYISI</label>
                    <span className="text-indigo-400 font-black text-sm">{maxPlayers} OYUNCU</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="4"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-white/5 rounded-full h-2 appearance-none cursor-pointer"
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-4 bg-white/5 text-zinc-400 font-bold rounded-2xl hover:bg-white/10 transition-colors uppercase tracking-widest text-xs"
                  >
                    İPTAL
                  </button>
                  <button
                    onClick={createRoom}
                    disabled={createLoading || !newRoomName}
                    className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {createLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'BAŞLAT'}
                  </button>
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
