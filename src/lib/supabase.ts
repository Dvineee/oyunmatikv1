import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!supabaseInstance) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Secrets panel.'
        );
      }
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
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
