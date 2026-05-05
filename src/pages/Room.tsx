import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Send, Users, Shield, LogOut, MessageSquare, Plus,
  UserMinus, Ban, Loader2, Gamepad2, ChevronLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AvatarDisplay } from '../components/AvatarPicker';
import { format } from 'date-fns';
import { playSound } from '../lib/sounds';

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
}

interface Room {
  id: string;
  name: string;
  host_id: string;
  max_players: number;
  status: string;
}

interface Player {
  user_id: string;
  joined_at: string;
  username: string;
  avatar_url: string;
}

export default function RoomPage() {
  const { roomId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;
    
    fetchRoomInitialData();

    const playersSub = supabase
      .channel(`room-players-${roomId}`)
      .on('postgres_changes' as any, { 
        event: '*', 
        schema: 'public',
        table: 'room_players', 
        filter: `room_id=eq.${roomId}` 
      }, () => {
        fetchPlayers();
      })
      .subscribe();

    const messagesSub = supabase
      .channel(`room-messages-${roomId}`)
      .on('postgres_changes' as any, { 
        event: 'INSERT', 
        schema: 'public',
        table: 'messages', 
        filter: `room_id=eq.${roomId}` 
      }, async (payload: any) => {
        const { data: userData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', payload.new.user_id)
          .single();
        
        const msg = { ...payload.new, user: userData } as Message;
        setMessages(prev => [...prev, msg]);
        if (payload.new.user_id !== user?.id) {
          playSound('message');
        }
      })
      .subscribe();

    const typingChannel = supabase.channel(`room-typing-${roomId}`);
    
    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { username, typing } = payload;
        setTypingUsers(prev => {
          if (typing) {
            return prev.includes(username) ? prev : [...prev, username];
          } else {
            return prev.filter(u => u !== username);
          }
        });
      })
      .subscribe();

    return () => {
      playersSub.unsubscribe();
      messagesSub.unsubscribe();
      typingChannel.unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  const fetchRoomInitialData = async () => {
    if (!roomId) return;
    
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !roomData) {
      navigate('/lobby');
      return;
    }

    setRoom(roomData);
    await fetchPlayers();
    await fetchMessages();
    setLoading(false);
  };

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('room_players')
      .select('joined_at, user_id, profiles(username, avatar_url)')
      .eq('room_id', roomId);

    if (!error && data) {
      const formattedPlayers = data.map((p: any) => ({
        user_id: p.user_id,
        joined_at: p.joined_at,
        username: p.profiles.username,
        avatar_url: p.profiles.avatar_url,
      }));
      setPlayers(formattedPlayers);
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, user:profiles(username, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (!error && data) {
      setMessages(data);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId) return;
    setSending(true);

    const { error } = await supabase
      .from('messages')
      .insert([{
        room_id: roomId,
        user_id: user.id,
        content: newMessage.trim()
      }]);

    if (!error) {
      setNewMessage('');
      handleTyping(false);
      playSound('click');
    }
    setSending(false);
  };

  const handleTyping = (typing: boolean) => {
    if (typing === isTyping) return;
    setIsTyping(typing);
    
    supabase.channel(`room-typing-${roomId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { username: profile?.username, typing }
    });
  };

  const leaveRoom = async () => {
    if (!user || !roomId) return;
    
    const { error } = await supabase
      .from('room_players')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (!error) {
      navigate('/lobby');
    }
  };

  const kickPlayer = async (targetUserId: string) => {
    if (!user || !roomId || room?.host_id !== user.id) return;
    
    await supabase
      .from('room_players')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', targetUserId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const isHost = room?.host_id === user?.id;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col overflow-hidden">
      <header className="bg-zinc-950/80 backdrop-blur-3xl border-b border-white/5 px-8 py-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={leaveRoom}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-zinc-400 hover:text-white border border-white/5"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
              {room?.name}
              <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
                {room?.status === 'waiting' ? 'BEKLENİYOR' : 'OYUNDA'}
              </span>
            </h1>
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mt-1">
              ODA KİMLİĞİ: {roomId?.slice(0, 8)}_STX
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={leaveRoom}
            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black rounded-2xl border border-red-500/10 flex items-center gap-3 text-xs tracking-widest transition-all uppercase"
          >
            <LogOut className="w-4 h-4 opacity-50" />
            AYRIL
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4 relative">
        <div className="lg:col-span-3 flex flex-col h-[calc(100vh-89px)] border-r border-white/5 bg-zinc-950/20">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/5"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-zinc-800">
                <MessageSquare className="w-16 h-16 mb-6 opacity-10" />
                <p className="font-black text-[10px] uppercase tracking-[0.4em]">Sohbet Boş</p>
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
                  <AvatarDisplay avatarId={msg.user?.avatar_url || 'animal_1'} size="sm" />
                  <div className={`max-w-[70%] group`}>
                    <div className={`flex items-center gap-3 mb-2 ${isOwn ? 'justify-end' : ''}`}>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{msg.user?.username}</span>
                      <span className="text-[9px] font-bold text-zinc-700">{format(new Date(msg.created_at), 'HH:mm')}</span>
                    </div>
                    <div className={`p-5 rounded-[1.75rem] text-sm leading-relaxed shadow-xl ${
                      isOwn 
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-indigo-500/10' 
                        : 'bg-white/5 border border-white/5 text-zinc-200 rounded-bl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 text-[10px] text-zinc-600 font-bold uppercase tracking-widest pl-14"
                >
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500/40 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-indigo-500/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-500/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  {typingUsers.join(', ')} yazıyor...
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={sendMessage} className="p-6 bg-zinc-950/40 border-t border-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-[1.5rem] p-2 focus-within:bg-white/10 focus-within:border-indigo-500/30 transition-all shadow-inner">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping(e.target.value.length > 0);
                }}
                onBlur={() => handleTyping(false)}
                placeholder="Mesajınızı buraya yazın..."
                className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-zinc-100 text-sm placeholder:text-zinc-700"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-500/20 px-6 py-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-[#050505]/40 backdrop-blur-3xl p-8 space-y-10 overflow-y-auto hidden lg:block">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <h2 className="font-black text-xs uppercase tracking-[0.3em] text-zinc-400">OYUNCULAR</h2>
              </div>
              <span className="bg-white/5 text-zinc-500 text-[10px] font-black px-3 py-1 rounded-full border border-white/5">
                {players.length}/{room?.max_players}
              </span>
            </div>

            <div className="space-y-6">
              {players.map((p) => (
                <div key={p.user_id} className="flex items-center justify-between group bg-white/[0.02] hover:bg-white/5 border border-transparent hover:border-white/5 p-3 rounded-2xl transition-all">
                  <div className="flex items-center gap-4">
                    <AvatarDisplay avatarId={p.avatar_url} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-zinc-100 uppercase tracking-tight">{p.username}</span>
                        {room?.host_id === p.user_id && <Shield className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">HAZIR</p>
                    </div>
                  </div>
                  
                  {isHost && p.user_id !== user?.id && (
                    <button 
                      onClick={() => kickPlayer(p.user_id)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-xl text-red-400 transition-all border border-transparent hover:border-red-500/20"
                      title="Oyuncuyu At"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {Array.from({ length: (room?.max_players || 4) - players.length }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl border-2 border-dashed border-white/5 opacity-30">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-zinc-600" />
                  </div>
                  <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] italic">BOŞ_SIRA_0{i+1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-10 border-t border-white/5">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6">ODA İSTATİSTİKLERİ</h3>
            <div className="space-y-4">
               <StatRow label="SÜRÜM" value="1.0.8" />
               <StatRow label="SUNUCU" value="AVR-01" />
               <StatRow label="GECİKME" value="18MS" color="text-emerald-500" />
            </div>
          </div>

          {isHost && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-12 bg-white text-black font-black py-5 rounded-[1.75rem] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-indigo-500/10 group"
            >
               <Gamepad2 className="w-5 h-5 group-hover:animate-spin" />
               <span className="tracking-[0.2em] uppercase text-xs">SAVAŞI BAŞLAT</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center text-[10px] font-mono">
      <span className="text-zinc-600">{label}</span>
      <span className={color || "text-zinc-400"}>{value}</span>
    </div>
  );
}
