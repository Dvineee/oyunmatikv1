import React from 'react';
import { AvatarPickerProps, AVATARS } from '../lib/constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 p-3 sm:p-6 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-inner">
      {AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onSelect(avatar.id)}
          className={cn(
            "relative group flex flex-col items-center justify-center p-2 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] transition-all duration-300 border-[3px]",
            selectedId === avatar.id 
              ? "border-indigo-500 bg-indigo-500/20 scale-110 sm:scale-105 z-10" 
              : "border-transparent bg-white/5 hover:bg-white/10 hover:scale-105"
          )}
        >
          <motion.div 
            animate={selectedId === avatar.id ? { 
              y: [0, -4, 0],
              rotate: [0, -8, 8, 0],
              scale: [1, 1.15, 1]
            } : {}}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className={cn(
              "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] mb-2 sm:mb-3 flex items-center justify-center shadow-2xl relative overflow-hidden transition-transform", 
              avatar.color
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            
            <avatar.icon className="w-6 h-6 sm:w-9 sm:h-9 text-white filter drop-shadow-lg z-10" strokeWidth={3} />
          </motion.div>
          <span className={cn(
            "text-[8px] sm:text-[10px] uppercase tracking-[0.2em] font-black transition-colors hidden sm:block",
            selectedId === avatar.id ? "text-indigo-400" : "text-zinc-500"
          )}>
            {avatar.name}
          </span>
          {selectedId === avatar.id && (
            <motion.div 
              layoutId="activeAvatar"
              className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-8 sm:h-8 bg-indigo-500 rounded-full border-[2px] sm:border-[4px] border-[#080808] flex items-center justify-center shadow-xl z-20"
            >
               <motion.div 
                animate={{ scale: [1, 1.3, 1] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 bg-white rounded-full" 
               />
            </motion.div>
          )}
        </button>
      ))}
    </div>
  );
}

export function AvatarDisplay({ avatarId, size = "md", animate = false, ring = false }: { avatarId: string; size?: "xs" | "sm" | "md" | "lg"; animate?: boolean; ring?: boolean }) {
  const avatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-10 h-10",
    md: "w-16 h-16 sm:w-20 sm:h-20",
    lg: "w-24 h-24 sm:w-32 sm:h-32"
  };

  const iconClasses = {
    xs: "w-3 h-3",
    sm: "w-5 h-5",
    md: "w-9 h-9 sm:w-11 sm:h-11",
    lg: "w-12 h-12 sm:w-20 sm:h-20"
  };

  const roundedClasses = {
    xs: "rounded-lg",
    sm: "rounded-xl sm:rounded-2xl",
    md: "rounded-2xl sm:rounded-[2.5rem]",
    lg: "rounded-3xl sm:rounded-[4rem]"
  };

  return (
    <div className={cn("relative isolate", sizeClasses[size])}>
      {ring && (
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className={cn(
            "absolute inset-[-4px] sm:inset-[-6px] rounded-full border-2 border-dashed border-white/20 opacity-40 animate-pulse",
            size === 'xs' ? 'hidden' : 'block'
          )}
        />
      )}
      <motion.div 
        animate={animate ? {
          y: [0, -4, 0],
          rotate: [0, -3, 3, 0],
          scale: [1, 1.05, 1]
        } : {}}
        transition={{ 
          repeat: Infinity, 
          duration: 3 + Math.random(), 
          ease: "easeInOut" 
        }}
        className={cn(
          "flex items-center justify-center shadow-2xl relative overflow-hidden shrink-0 border-2 border-white/10 w-full h-full", 
          avatar.color, 
          roundedClasses[size]
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
        
        <motion.div
           animate={animate ? {
            scale: [1, 1.15, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <avatar.icon className={cn("text-white filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] z-10", iconClasses[size])} strokeWidth={2.5} />
        </motion.div>
        
        {/* Shine effect */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 skew-y-[-15deg] translate-y-[-50%]" />
      </motion.div>
    </div>
  );
}
