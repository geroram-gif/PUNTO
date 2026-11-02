import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

/**
 * Cliente de Supabase para la app. Usa SOLO la clave pública (anon / publishable): lo que la
 * app puede hacer lo define RLS + las RPC. Jamás poner acá la service-role key.
 */
export interface SupabaseEnv {
  url?: string;
  anonKey?: string;
}

/** Variables públicas de Expo: se leen una por una para que el bundler las inyecte. */
export const envSupabase = (): SupabaseEnv => ({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

export const isSupabaseConfigured = (env: SupabaseEnv) => !!env.url && !!env.anonKey;

export function createSupabase(env: SupabaseEnv): SupabaseClient {
  if (!env.url || !env.anonKey)
    throw new Error('Falta configurar EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY');
  const client = createClient(env.url, env.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  // Recomendado por Supabase en React Native: renovar la sesión solo con la app en primer plano.
  AppState.addEventListener('change', (s) => {
    if (s === 'active') client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  });
  return client;
}
