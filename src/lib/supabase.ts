/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseInstance) {
      try {
        if (supabaseUrl && supabaseAnonKey) {
          supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
        } else {
          console.warn('Supabase URL or Key missing. Check your environment variables.');
        }
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
      }
    }

    if (!supabaseInstance) {
      // Return a safe-ish mock to prevent total crash on startup
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signOut: async () => {}
        },
        from: () => ({
          select: () => ({
             eq: () => ({ single: async () => ({ data: null, error: { message: 'Supabase unconfigured' } }), order: () => ({ data: [], error: null }) }),
             order: () => ({ data: [], error: null }),
             limit: () => ({ data: [], error: null })
          }),
          insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Supabase unconfigured' } }) }) }),
          delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
          upsert: async () => ({ error: null })
        }),
        channel: () => ({
          on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
          subscribe: () => ({ unsubscribe: () => {} }),
          track: async () => {},
          presenceState: () => ({})
        })
      }[prop as string] || (() => ({}));
    }

    return (supabaseInstance as any)[prop];
  }
});

export const AVATARS = [
  { id: 'animal_1', name: 'Aslan', color: 'bg-orange-500' },
  { id: 'animal_2', name: 'Panda', color: 'bg-zinc-200' },
  { id: 'animal_3', name: 'Kaplan', color: 'bg-amber-600' },
  { id: 'animal_4', name: 'Tavşan', color: 'bg-blue-400' },
  { id: 'animal_5', name: 'Tilki', color: 'bg-red-500' },
  { id: 'animal_6', name: 'Ayı', color: 'bg-stone-600' },
];
