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
      const createSafeProxy = (target: any): any => {
        return new Proxy(target, {
          get(t, p) {
            if (p === 'then') return undefined; // Prevent it from looking like a promise if it's not
            if (typeof t[p] === 'function') return t[p];
            if (t[p] !== undefined) return t[p];
            // If it's a known fluent method or just any missing prop, return a function that returns a proxy
            return (...args: any[]) => createSafeProxy(t);
          }
        });
      };

      const mockAuth = {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (cb: any) => {
          // Trigger the callback with null session immediately to clear loading states
          setTimeout(() => cb('SIGNED_OUT', null), 0);
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signOut: async () => ({ error: null }),
        signUp: async () => ({ data: { user: null }, error: { message: 'Supabase unconfigured' } }),
        signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase unconfigured' } }),
      };

      const mockFrom = () => {
        const handler = {
          select: () => createSafeProxy(handler),
          insert: () => createSafeProxy(handler),
          update: () => createSafeProxy(handler),
          upsert: () => createSafeProxy(handler),
          delete: () => createSafeProxy(handler),
          eq: () => createSafeProxy(handler),
          neq: () => createSafeProxy(handler),
          gt: () => createSafeProxy(handler),
          lt: () => createSafeProxy(handler),
          order: () => createSafeProxy(handler),
          limit: () => createSafeProxy(handler),
          single: async () => ({ data: null, error: { message: 'Supabase unconfigured' } }),
          maybeSingle: async () => ({ data: null, error: { message: 'Supabase unconfigured' } }),
          then: (onFullfilled: any) => Promise.resolve({ data: [], error: null }).then(onFullfilled)
        };
        return createSafeProxy(handler);
      };

      const mockChannel = () => createSafeProxy({
        on: () => mockChannel(),
        subscribe: (cb: any) => { if (cb) setTimeout(() => cb('SUBSCRIBED'), 0); return mockChannel(); },
        unsubscribe: () => {},
        track: async () => {},
        send: async () => {},
        presenceState: () => ({})
      });

      const mocks: Record<string, any> = {
        auth: mockAuth,
        from: mockFrom,
        channel: mockChannel,
        rpc: async () => ({ data: null, error: null }),
      };

      return mocks[prop as string] || (() => createSafeProxy({}));
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
