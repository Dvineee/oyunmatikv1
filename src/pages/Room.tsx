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

    return () => {
      socket.off('new_message');
      socket.off('player_joined');
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
      roomId,
      content: newMessage.trim()
    });
    setNewMessage('');
    playSound('click');
  };

  const leaveRoom = () => {
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
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col overflow-hidden">
      <header className="bg-[#050505]/80 backdrop-blur-3xl border-b border-white/5 px-8 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
           <button 
            onClick={leaveRoom}
            className="p-3 hover:bg-white/5 rounded-2xl transition-all text-zinc-500 hover:text-white group border border-transparent hover:border-white/5"
           >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
           </button>
           <div className="h-8 w-px bg-white/5" />
           <div>
             <div className="flex items-center gap-3">
               <h1 className="text-xl font-black tracking-tight">{room?.name}</h1>
               <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md uppercase tracking-widest">
                 {room?.status === 'waiting' ? 'BEKLEME ODASI' : 'SAVAŞTA'}
               </span>
             </div>
             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">ODA KİMLİĞİ: {room?.id}</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           {isHost && (
             <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 uppercase tracking-[0.2em]">
               OYUNU BAŞLAT
             </button>
           )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col bg-[#080808] relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-20">
                <MessageSquare className="w-16 h-16 mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.3em]">Sohbeti Başlat</p>
              </div>
            )}
            
            {messages.map((msg, i) => {
              const isOwn = msg.user_id === user?.id;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={msg.id} 
                  className={`flex items-end gap-4 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <AvatarDisplay avatarId={msg.avatar_url || 'animal_1'} size="sm" />
                  <div className={`max-w-[70%] group`}>
                    <div className={`flex items-center gap-3 mb-2 ${isOwn ? 'justify-end' : ''}`}>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{msg.username}</span>
                      <span className="text-[9px] font-bold text-zinc-700">{format(new Date(msg.created_at), 'HH:mm')}</span>
                    </div>
                    <div className={`p-5 rounded-[1.75rem] text-sm leading-relaxed shadow-xl ${
                      isOwn 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-zinc-900 text-zinc-200 border border-white/5 rounded-bl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="p-8 bg-[#050505]/50 backdrop-blur-3xl border-t border-white/5">
            <form onSubmit={sendMessage} className="relative max-w-4xl mx-auto group">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Takımına bir şey fısılda..."
                className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-5 px-8 pr-16 focus:bg-white/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-30 active:scale-95"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>

        <aside className="w-96 bg-[#050505] border-l border-white/5 p-8 flex flex-col gap-10">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <Users className="w-4 h-4 text-indigo-500" />
                OYUNCULAR
              </h3>
              <span className="text-[9px] font-black px-2 py-1 bg-white/5 rounded-lg text-zinc-400">
                {players.length}/{room?.max_players}
              </span>
            </div>
            
            <div className="space-y-4">
              {players.map((p) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={p.id} 
                  className="flex items-center justify-between group p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <AvatarDisplay avatarId={p.avatar_id} size="sm" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050505]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-tight">{p.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {p.id === room?.host_id && <Shield className="w-3 h-3 text-indigo-400" />}
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                          {p.id === room?.host_id ? 'ODA LİDERİ' : 'SAVAŞÇI'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-white/5">
             <div className="bg-indigo-500/5 rounded-3xl p-6 border border-indigo-500/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <Timer className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-indigo-200">MAÇ ÖNCESİ</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-zinc-500 font-medium uppercase tracking-widest">
                  Oyunun başlaması için tüm oyuncuların hazır olması gerekiyor. Boş yerlerin dolmasını bekleyin.
                </p>
             </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
