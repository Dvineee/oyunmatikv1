import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Send, Users, Shield, LogOut, MessageSquare, 
  Loader2, Gamepad2, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AvatarDisplay } from '../components/AvatarPicker';
import { format } from 'date-fns';
import { playSound } from '../lib/sounds';
import { api, socket } from '../lib/api';

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string;
}

interface Room {
  id: string;
  name: string;
  host_id: string;
  max_players: number;
  status: string;
}

interface Player {
  id: string;
  username: string;
  avatar_id: string;
}

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;

    const fetchInitialData = async () => {
       try {
         const rooms = await api.get('/api/rooms');
         const currentRoom = rooms.find((r: any) => r.id === roomId);
         if (!currentRoom) {
           navigate('/lobby');
           return;
         }
         setRoom(currentRoom);
         setLoading(false);
       } catch (err) {
         navigate('/lobby');
       }
    };

    fetchInitialData();

    socket.emit('join_room', roomId);

    socket.on('new_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      if (msg.user_id !== user?.id) {
        playSound('message');
      }
    });

    socket.on('player_joined', (data) => {
      setPlayers(prev => {
        if (prev.find(p => p.id === data.user.id)) return prev;
        return [...prev, data.user];
      });
      playSound('success');
    });

    socket.on('player_left', (data) => {
      setPlayers(prev => prev.filter(p => p.id !== data.userId));
    });

    socket.on('error', (msg) => {
      alert(msg);
      navigate('/lobby');
    });

    return () => {
      socket.off('new_message');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('error');
    };
  }, [roomId, navigate, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId) return;

    socket.emit('send_message', {
      content: newMessage.trim()
    });
    setNewMessage('');
    playSound('click');
  };

  const leaveRoom = () => {
    socket.emit('leave_room');
    navigate('/lobby');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <Gamepad2 className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 animate-pulse" />
        </div>
        <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">Savaş Alanı Yükleniyor</p>
      </div>
    );
  }

  const isHost = room?.host_id === user?.id;

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 font-sans flex flex-col overflow-hidden relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-[#FF2D55]/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/2 right-0 w-[30%] h-[30%] bg-[#5856D6]/20 blur-[150px] rounded-full" />
      </div>

      <header className="bg-[#080808]/60 backdrop-blur-3xl border-b-2 border-white/5 px-8 py-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-8">
           <motion.button 
            whileHover={{ scale: 1.1, x: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={leaveRoom}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-zinc-400 hover:text-white group border border-white/10 shadow-lg"
           >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
           </motion.button>
           <div className="h-10 w-px bg-white/10" />
           <div>
             <div className="flex items-center gap-4">
               <h1 className="text-3xl font-black tracking-tighter italic text-white">{room?.name}</h1>
               <motion.span 
                 animate={{ scale: [1, 1.05, 1] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-xl ${
                   room?.status === 'waiting' 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20'
                 }`}
               >
                 {room?.status === 'waiting' ? '• BEKLEME ODASI' : '• SAVAŞTA'}
               </motion.span>
             </div>
             <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-[#5856D6] rounded-full animate-pulse" />
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">ARENA KODU: {room?.id}</p>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-6">
           {isHost && (
             <motion.button 
               whileHover={{ scale: 1.05, y: -2 }}
               whileTap={{ scale: 0.95 }}
               className="bg-gradient-to-r from-[#FF2D55] to-[#FF9500] text-white text-xs font-black px-10 py-5 rounded-[1.75rem] transition-all shadow-2xl shadow-pink-500/20 active:scale-95 uppercase tracking-[0.3em] flex items-center gap-3"
             >
               OYUNU BAŞLAT
               <Gamepad2 className="w-5 h-5" />
             </motion.button>
           )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col bg-[#050505]/40 backdrop-blur-xl relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-10">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <MessageSquare className="w-24 h-24 mb-6" />
                </motion.div>
                <p className="text-sm font-black uppercase tracking-[0.5em]">İlk mermiyi sen at (Selam ver)</p>
              </div>
            )}
            
            {messages.map((msg, i) => {
              const isOwn = msg.user_id === user?.id;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={msg.id} 
                  className={`flex items-end gap-5 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <div className="relative group">
                    <AvatarDisplay avatarId={msg.avatar_url || 'animal_1'} size="sm" animate />
                    <div className="absolute -inset-2 bg-white/5 rounded-full scale-0 group-hover:scale-100 transition-transform -z-10" />
                  </div>
                  <div className={`max-w-[75%] group`}>
                    <div className={`flex items-center gap-4 mb-2 ${isOwn ? 'justify-end' : ''}`}>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{msg.username}</span>
                      <span className="text-[8px] font-black text-zinc-700 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{format(new Date(msg.created_at), 'HH:mm')}</span>
                    </div>
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className={`p-5 rounded-[2rem] text-sm font-bold leading-relaxed shadow-2xl relative border-2 transition-all ${
                        isOwn 
                          ? 'bg-gradient-to-br from-[#5856D6] to-[#4644BD] text-white border-white/10 rounded-br-none shadow-indigo-500/10' 
                          : 'bg-zinc-900/60 text-zinc-100 border-white/5 rounded-bl-none backdrop-blur-md hover:bg-zinc-900/80'
                      }`}
                    >
                      {msg.content}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="p-10 bg-[#080808]/80 backdrop-blur-3xl border-t-2 border-white/5">
            <form onSubmit={sendMessage} className="relative max-w-5xl mx-auto group">
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#5856D6] to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Takımına taktik ver veya selam yolla..."
                className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] py-6 px-10 pr-20 focus:bg-white/10 focus:border-[#5856D6]/30 outline-none transition-all placeholder:text-zinc-700 text-base font-bold shadow-inner"
              />
              <motion.button 
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-gradient-to-br from-[#5856D6] to-[#af52de] text-white rounded-[1.5rem] transition-all shadow-2xl shadow-indigo-500/40 disabled:opacity-30"
              >
                {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </motion.button>
            </form>
          </div>
        </div>

        <aside className="w-[420px] bg-[#080808] border-l-2 border-white/5 p-12 flex flex-col gap-12 overflow-y-auto no-scrollbar">
          <div className="relative">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-4">
                <Users className="w-5 h-5 text-[#FF2D55]" />
                SAVAŞÇILAR
              </h3>
              <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                <span className="text-[11px] font-black text-[#FF9500]">
                  {players.length} / {room?.max_players}
                </span>
              </div>
            </div>
            
            <div className="space-y-6">
              {players.map((p, i) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, type: "spring" }}
                  key={p.id} 
                  className="flex items-center justify-between group p-6 rounded-[2.5rem] bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-[#5856D6]/30 transition-all cursor-default relative overflow-hidden"
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="relative">
                      <AvatarDisplay avatarId={p.avatar_id} size="sm" animate />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#080808] shadow-xl" 
                      />
                    </div>
                    <div>
                      <p className="text-base font-black text-white uppercase tracking-tight leading-none">{p.username}</p>
                      <div className="flex items-center gap-2 mt-3">
                        {p.id === room?.host_id ? (
                          <div className="flex items-center gap-2 bg-[#FF9500]/10 px-2.5 py-1 rounded-md border border-[#FF9500]/20">
                            <Shield className="w-3.5 h-3.5 text-[#FF9500]" />
                            <span className="text-[9px] font-black text-[#FF9500] uppercase tracking-widest">LİDER</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] leading-none">HAZIR</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {room && players.length < room.max_players && Array.from({ length: room.max_players - players.length }).map((_, i) => (
                <div 
                  key={`empty-${i}`}
                  className="flex items-center gap-6 p-6 rounded-[2.5rem] border-2 border-dashed border-white/5 opacity-20 relative overflow-hidden"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-2xl animate-pulse" />
                  <div className="h-3 w-32 bg-white/5 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto">
             <motion.div 
               whileHover={{ y: -5 }}
               className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-8 border-2 border-white/5 relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF2D55]/5 blur-2xl" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-[#5856D6]/20 rounded-2xl border border-[#5856D6]/30">
                    <Timer className="w-6 h-6 text-[#5856D6]" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-[0.2em] text-white italic">MAÇ BRİFİNGİ</h4>
                    <p className="text-[10px] font-black text-[#5856D6] uppercase tracking-[0.3em]">Harekete Geçiliyor</p>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-500 font-bold uppercase tracking-widest">
                  Tüm oyuncular toplandığında lider savaşı başlatır. <br/><br/>
                  <span className="text-zinc-400">İyi bir strateji ve hızlı refleksler seni zafere götürür!</span>
                </p>
             </motion.div>
          </div>
        </aside>
      </main>
    </div>
  );
}
