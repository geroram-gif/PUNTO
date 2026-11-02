import { createRemoteApi, type RemoteApi } from '@/lib/supabase/api';
import { createAuthApi, type AuthApi } from '@/lib/supabase/auth';
import {
  createSupabase,
  envSupabase,
  isSupabaseConfigured,
  type SupabaseEnv,
} from '@/lib/supabase/client';

/**
 * Con Supabase configurado la app corre con cuentas y datos persistentes. Sin configurar,
 * corre en modo demo (datos del prototipo en memoria, sin ingreso), como en la Fase 2.
 */
export interface Backend {
  remote?: RemoteApi;
  auth?: AuthApi;
}

export function createBackend(env: SupabaseEnv = envSupabase()): Backend {
  if (!isSupabaseConfigured(env)) return {};
  const client = createSupabase(env);
  return { remote: createRemoteApi(client), auth: createAuthApi(client) };
}
