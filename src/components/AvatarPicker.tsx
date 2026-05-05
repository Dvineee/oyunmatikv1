import React from 'react';
import { AVATARS } from '../lib/constants';
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
    <div className="grid grid-cols-3 gap-4 p-6 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
      {AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onSelect(avatar.id)}
          className={cn(
            "relative group flex flex-col items-center justify-center p-4 rounded-[2rem] transition-all duration-300 border-[3px]",
            selectedId === avatar.id 
              ? "border-indigo-500 bg-indigo-500/20 scale-105 shadow-lg shadow-indigo-500/20" 
              : "border-transparent bg-white/5 hover:bg-white/10 hover:scale-102"
          )}
        >
          <motion.div 
            animate={selectedId === avatar.id ? { 
              y: [0, -6, 0],
              rotate: [0, -5, 5, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className={cn("w-16 h-16 rounded-[1.5rem] mb-3 flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:rotate-6 transition-transform", avatar.color)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
            <span className="text-3xl filter drop-shadow-md">
              {(avatar as any).emoji}
            </span>
          </motion.div>
          <span className={cn(
            "text-[10px] uppercase tracking-[0.2em] font-black transition-colors",
            selectedId === avatar.id ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
          )}>
            {avatar.name}
          </span>
          {selectedId === avatar.id && (
            <motion.div 
              layoutId="activeAvatar"
              className="absolute -top-2 -right-2 w-7 h-7 bg-indigo-500 rounded-full border-[3px] border-[#080808] flex items-center justify-center shadow-xl"
            >
               <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-white rounded-full" 
               />
            </motion.div>
          )}
        </button>
      ))}
    </div>
  );
}

export function AvatarDisplay({ avatarId, size = "md", animate = false }: { avatarId: string; size?: "xs" | "sm" | "md" | "lg"; animate?: boolean }) {
  const avatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  
  const sizeClasses = {
    xs: "w-5 h-5 text-sm",
    sm: "w-10 h-10 text-xl",
    md: "w-16 h-16 text-3xl",
    lg: "w-24 h-24 text-5xl"
  };

  const roundedClasses = {
    xs: "rounded-lg",
    sm: "rounded-2xl",
    md: "rounded-[1.75rem]",
    lg: "rounded-[2.5rem]"
  };

  return (
    <motion.div 
      animate={animate ? {
        y: [0, -8, 0],
        rotate: [0, -5, 5, 0],
        scale: [1, 1.05, 1]
      } : {}}
      transition={{ 
        repeat: Infinity, 
        duration: 3 + Math.random(), 
        ease: "easeInOut" 
      }}
      className={cn(
        "flex items-center justify-center shadow-2xl relative overflow-hidden shrink-0 border-2 border-white/20", 
        avatar.color, 
        sizeClasses[size],
        roundedClasses[size]
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
      <motion.span 
        animate={animate ? {
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        } : {}}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] z-10"
      >
        {(avatar as any).emoji}
      </motion.span>
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}
