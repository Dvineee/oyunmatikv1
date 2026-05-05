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
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 p-4 bg-[#0A0A0A] rounded-[2rem] border border-white/5 shadow-2xl">
      {AVATARS.map((avatar) => {
        const Icon = avatar.icon;
        const isSelected = selectedId === avatar.id;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.id)}
            className={cn(
              "relative group flex flex-col items-center justify-center p-3 rounded-[1.5rem] transition-all duration-300",
              isSelected 
                ? "bg-white/[0.03] shadow-[0_0_20px_rgba(255,255,255,0.02)]" 
                : "hover:bg-white/[0.02]"
            )}
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mb-2 flex items-center justify-center relative overflow-hidden transition-all duration-500 border", 
                avatar.color,
                isSelected ? "border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "border-white/10 opacity-60 group-hover:opacity-100"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white filter drop-shadow-lg z-10" strokeWidth={2.5} />
            </motion.div>
            <span className={cn(
              "text-[8px] uppercase tracking-[0.2em] font-black transition-colors",
              isSelected ? "text-white" : "text-zinc-600"
            )}>
              {avatar.name}
            </span>
            {isSelected && (
              <motion.div 
                layoutId="activeAvatar"
                className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"
              />
            )}
          </button>
        );
      })}
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

  const Icon = avatar.icon;

  return (
    <div className={cn("relative isolate group", sizeClasses[size])}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className={cn(
          "flex items-center justify-center relative overflow-hidden shrink-0 border border-white/10 w-full h-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]", 
          avatar.color, 
          roundedClasses[size]
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        <Icon className={cn("text-white filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] z-10 transition-transform duration-500 group-hover:scale-110", iconClasses[size])} strokeWidth={2} />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    </div>
  );
}
