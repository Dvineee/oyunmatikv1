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
  const [showPlayers, setShowPlayers] = useState(false);
  
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
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col overflow-hidden relative">
      <header className="bg-[#0A0A0A]/80 backdrop-blur-3xl border-b border-white/5 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between z-40">
        <div className="flex items-center gap-4 sm:gap-8">
           <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={leaveRoom}
            className="p-3 bg-white/[0.03] hover:bg-white/10 rounded-xl transition-all text-zinc-500 hover:text-white border border-white/5"
           >
            <LogOut className="w-4 h-4 sm:w-5 h-5" />
           </motion.button>
           
           <div>
             <div className="flex items-center gap-3">
               <h1 className="text-lg sm:text-2xl font-black tracking-tighter text-white italic">{room?.name}</h1>
               <span className={`text-[8px] sm:text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                   room?.status === 'waiting' 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20'
                 }`}
               >
                 {room?.status === 'waiting' ? '• BEKLİYOR' : '• OYUNDA'}
               </span>
             </div>
             <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-1">ARENA: {room?.id?.slice(0,8)}</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           {isHost && (
             <motion.button 
               whileTap={{ scale: 0.95 }}
               className="bg-white text-black text-[9px] sm:text-xs font-black px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all shadow-xl active:scale-95 uppercase tracking-[0.2em] flex items-center gap-2"
             >
               <span>BAŞLAT</span>
               <Gamepad2 className="w-4 h-4" />
             </motion.button>
           )}
           <button 
             onClick={() => setShowPlayers(!showPlayers)}
             className={`lg:hidden p-3 rounded-xl border border-white/5 transition-all ${showPlayers ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'}`}
           >
             <Users className="w-5 h-5" />
           </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative z-10 flex-col lg:flex-row">
        <div className="flex-1 flex flex-col bg-[#050505] relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 no-scrollbar scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-10">
                <MessageSquare className="w-12 h-12 mb-4" strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sohbete Katıl</p>
              </div>
            )}
            
            {messages.map((msg) => {
              const isOwn = msg.user_id === user?.id;
              return (
                <div 
                  key={msg.id} 
                  className={`flex items-end gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <AvatarDisplay avatarId={msg.avatar_url || 'animal_1'} size="sm" />
                  <div className={`max-w-[80%] sm:max-w-[70%]`}>
                    <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{msg.username}</span>
                      <span className="text-[8px] font-bold text-zinc-800">{format(new Date(msg.created_at), 'HH:mm')}</span>
                    </div>
                    <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold leading-relaxed border ${
                      isOwn 
                        ? 'bg-white/[0.03] text-white border-white/10 rounded-br-none' 
                        : 'bg-zinc-900/50 text-zinc-300 border-white/5 rounded-bl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 sm:p-6 bg-[#0A0A0A] border-t border-white/5">
            <form onSubmit={sendMessage} className="relative max-w-4xl mx-auto">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Taktik ver..."
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 px-6 focus:border-white/10 outline-none transition-all text-sm text-white font-medium"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white disabled:opacity-10"
              >
                 <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        <AnimatePresence>
          {(showPlayers || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
            <motion.aside 
              initial={{ x: 350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 350, opacity: 0 }}
              className={`fixed lg:relative inset-y-0 right-0 z-50 lg:z-0 w-[280px] sm:w-[350px] bg-[#0A0A0A] border-l border-white/5 p-8 flex flex-col gap-10 shadow-2xl lg:shadow-none`}
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    OYUNCULAR
                  </h3>
                  <span className="text-[10px] font-black text-zinc-600">{players.length} / {room?.max_players}</span>
                </div>
                
                <div className="space-y-4">
                  {players.map((p) => (
                    <div 
                      key={p.id} 
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <AvatarDisplay avatarId={p.avatar_id} size="sm" />
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{p.username}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {p.id === room?.host_id && <Shield className="w-3 h-3 text-zinc-600" />}
                            <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">{p.id === room?.host_id ? 'LİDER' : 'HAZIR'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto hidden sm:block">
                 <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5">
                    <h4 className="font-black text-[9px] uppercase tracking-[0.3em] text-zinc-700 mb-4 italic underline decoration-zinc-800 underline-offset-8">Savaş Notu</h4>
                    <p className="text-[10px] leading-relaxed text-zinc-500 font-bold uppercase tracking-widest italic">
                      Arenaya hoş geldin savaşçı. Taktiklerini konuştur ve liderle birlikte zafere yürü!
                    </p>
                 </div>
              </div>

              <button 
                onClick={() => setShowPlayers(false)}
                className="lg:hidden absolute top-4 right-4 p-2 text-zinc-600"
              >
                <LogOut className="w-5 h-5 rotate-180" />
              </button>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
