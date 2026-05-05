import React from 'react';
import { AVATARS } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AvatarPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-black/20 rounded-3xl border border-white/5">
      {AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onSelect(avatar.id)}
          className={cn(
            "relative group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 border-2",
            selectedId === avatar.id 
              ? "border-indigo-500 bg-indigo-500/10 scale-105" 
              : "border-transparent bg-white/5 hover:bg-white/10"
          )}
        >
          <div className={cn("w-12 h-12 rounded-full mb-2 flex items-center justify-center shadow-lg", avatar.color)}>
            <span className="text-xl font-black text-white">
              {avatar.name[0]}
            </span>
          </div>
          <span className="text-[9px] text-zinc-500 group-hover:text-zinc-300 uppercase tracking-[0.2em] font-bold">
            {avatar.name}
          </span>
          {selectedId === avatar.id && (
            <motion.div 
              layoutId="activeAvatar"
              className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-2 border-[#050505] flex items-center justify-center"
            >
               <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </motion.div>
          )}
        </button>
      ))}
    </div>
  );
}

export function AvatarDisplay({ avatarId, size = "md" }: { avatarId: string; size?: "sm" | "md" | "lg" }) {
  const avatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-20 h-20 text-lg"
  };

  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-bold shrink-0", avatar.color, sizeClasses[size])}>
      {avatar.name[0]}
    </div>
  );
}
