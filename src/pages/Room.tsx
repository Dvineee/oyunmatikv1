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
    <div className="min-h-screen bg-[#080808] text-zinc-100 font-sans flex flex-col overflow-hidden relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-[#FF2D55]/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/2 right-0 w-[30%] h-[30%] bg-[#5856D6]/20 blur-[150px] rounded-full" />
      </div>

      <header className="bg-[#080808]/80 backdrop-blur-3xl border-b border-white/10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between z-40 shadow-2xl">
        <div className="flex items-center gap-3 sm:gap-8">
           <motion.button 
            whileHover={{ scale: 1.1, x: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={leaveRoom}
            className="p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all text-zinc-400 hover:text-white group border border-white/10 shadow-lg"
           >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
           </motion.button>
           <div className="h-8 sm:h-10 w-px bg-white/10 hidden sm:block" />
           <div>
             <div className="flex items-center gap-3 sm:gap-4">
               <h1 className="text-xl sm:text-3xl font-black tracking-tighter italic text-white hidden sm:block">{room?.name}</h1>
               <h1 className="text-lg font-black tracking-tighter italic text-white sm:hidden truncate max-w-[120px]">{room?.name}</h1>
               <motion.span 
                 animate={{ scale: [1, 1.05, 1] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className={`text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-xl ${
                   room?.status === 'waiting' 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20'
                 }`}
               >
                 {room?.status === 'waiting' ? '• LOBİ' : '• SAVAŞ'}
               </motion.span>
             </div>
             <div className="flex items-center gap-2 mt-1 sm:mt-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#5856D6] rounded-full animate-pulse" />
                <p className="text-[8px] sm:text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">ARENA: {room?.id?.slice(0, 8)}...</p>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
           <motion.button 
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => { playSound('click'); setShowPlayers(!showPlayers); }}
             className={`lg:hidden p-3 rounded-xl border border-white/10 transition-all ${showPlayers ? 'bg-indigo-500 text-white' : 'bg-white/5 text-zinc-400'}`}
           >
             <Users className="w-5 h-5" />
           </motion.button>

           {isHost && (
             <motion.button 
               whileHover={{ scale: 1.05, y: -2 }}
               whileTap={{ scale: 0.95 }}
               className="bg-white text-black text-[10px] sm:text-xs font-black px-6 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-[1.75rem] transition-all shadow-xl active:scale-95 uppercase tracking-[0.2em] sm:tracking-[0.3em] flex items-center gap-2 sm:gap-3"
             >
               <span className="hidden sm:inline">BAŞLAT</span>
               <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
             </motion.button>
           )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative z-10 flex-col lg:flex-row">
        <div className="flex-1 flex flex-col bg-[#050505]/40 backdrop-blur-xl relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-10 no-scrollbar scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-5">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <MessageSquare className="w-20 sm:w-24 mb-6" />
                </motion.div>
                <p className="text-xs sm:text-sm font-black uppercase tracking-[0.5em] text-center px-6">İlk mermiyi sen at (Selam ver)</p>
              </div>
            )}
            
            {messages.map((msg, i) => {
              const isOwn = msg.user_id === user?.id;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={msg.id} 
                  className={`flex items-end gap-3 sm:gap-5 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <div className="relative group shrink-0">
                    <AvatarDisplay avatarId={msg.avatar_url || 'animal_1'} size="sm" animate ring />
                  </div>
                  <div className={`max-w-[85%] sm:max-w-[75%] group`}>
                    <div className={`flex items-center gap-3 mb-1.5 sm:mb-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] sm:tracking-[0.3em]">{msg.username}</span>
                      <span className="text-[7px] sm:text-[8px] font-black text-zinc-700 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">{format(new Date(msg.created_at), 'HH:mm')}</span>
                    </div>
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] text-xs sm:text-sm font-bold leading-relaxed shadow-2xl relative border border-white/10 transition-all ${
                        isOwn 
                          ? 'bg-gradient-to-br from-[#5856D6] to-[#4644BD] text-white rounded-br-none shadow-indigo-500/10' 
                          : 'bg-zinc-900/60 text-zinc-100 rounded-bl-none backdrop-blur-md'
                      }`}
                    >
                      {msg.content}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="p-4 sm:p-8 lg:p-10 bg-[#080808]/80 backdrop-blur-3xl border-t border-white/10">
            <form onSubmit={sendMessage} className="relative max-w-5xl mx-auto group">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Taktik ver..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] py-4 sm:py-6 px-6 sm:px-10 pr-16 sm:pr-20 focus:bg-white/5 focus:border-[#5856D6]/40 outline-none transition-all placeholder:text-zinc-700 text-sm sm:text-base font-bold shadow-inner"
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white text-black rounded-xl sm:rounded-[1.5rem] transition-all shadow-xl disabled:opacity-20"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 sm:w-6 sm:h-6" />}
              </motion.button>
            </form>
          </div>
        </div>

        <AnimatePresence>
          {(showPlayers || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
            <motion.aside 
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              className={`fixed lg:relative inset-y-0 right-0 z-50 lg:z-0 w-[85%] sm:w-[420px] bg-[#080808] border-l border-white/10 p-8 sm:p-12 flex flex-col gap-8 sm:gap-12 overflow-y-auto no-scrollbar shadow-[-20px_0_40px_rgba(0,0,0,0.5)] lg:shadow-none`}
            >
              <div className="relative">
                <div className="flex items-center justify-between mb-8 sm:mb-10">
                  <h3 className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3 sm:gap-4">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF2D55]" />
                    SAVAŞÇILAR
                  </h3>
                  <div className="bg-white/5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/5">
                    <span className="text-[10px] sm:text-[11px] font-black text-[#FF9500]">
                      {players.length} / {room?.max_players}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  {players.map((p, i) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, type: "spring" }}
                      key={p.id} 
                      className="flex items-center justify-between group p-4 sm:p-6 rounded-[1.75rem] sm:rounded-[2.5rem] bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-[#5856D6]/30 transition-all cursor-default relative overflow-hidden"
                    >
                      <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                        <div className="relative">
                          <AvatarDisplay avatarId={p.avatar_id} size="sm" animate ring />
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border border-[#080808] shadow-xl" 
                          />
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-black text-white uppercase tracking-tight leading-none">{p.username}</p>
                          <div className="flex items-center gap-2 mt-2 sm:mt-3">
                            {p.id === room?.host_id ? (
                              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FF9500]/10 px-2 sm:px-2.5 py-1 rounded-md border border-[#FF9500]/20">
                                <Shield className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#FF9500]" />
                                <span className="text-[8px] sm:text-[9px] font-black text-[#FF9500] uppercase tracking-widest">LİDER</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-500/10 px-2 sm:px-2.5 py-1 rounded-md border border-emerald-500/20">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[8px] sm:text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] leading-none">HAZIR</span>
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
                      className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-[1.75rem] sm:rounded-[2.5rem] border-2 border-dashed border-white/5 opacity-10 relative overflow-hidden"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-xl animate-pulse" />
                      <div className="h-2 w-24 sm:w-32 bg-white/5 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto hidden sm:block">
                 <motion.div 
                   whileHover={{ y: -5 }}
                   className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF2D55]/5 blur-2xl" />
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-[#5856D6]/10 rounded-xl border border-[#5856D6]/20">
                        <Timer className="w-5 h-5 text-[#5856D6]" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-white italic">ARENA BİLGİSİ</h4>
                        <p className="text-[9px] font-black text-[#5856D6] uppercase tracking-[0.3em]">Harekete Geçiliyor</p>
                      </div>
                    </div>
                    <p className="text-[10px] leading-relaxed text-zinc-500 font-bold uppercase tracking-widest italic">
                      Lider savaşı başlattığında arena kapıları açılacak. Stratejini kur ve zafere hazırlan!
                    </p>
                 </motion.div>
              </div>

              {/* Close Button Mobile */}
              <button 
                onClick={() => setShowPlayers(false)}
                className="lg:hidden absolute top-4 right-4 p-3 bg-white/10 rounded-full text-white"
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
