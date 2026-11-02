import type { SupabaseClient } from '@supabase/supabase-js';

import { GENERIC_MESSAGE, RemoteError, toRemoteError } from './errors';

export interface AuthSession {
  userId: string;
  email: string;
}

/**
 * Ingreso por email con código de 6 dígitos (OTP). Funciona igual en Expo Go y en la build
 * nativa, sin depender de links profundos. La plantilla del mail tiene que incluir {{ .Token }}.
 */
export interface AuthApi {
  getSession(): Promise<AuthSession | null>;
  /** Avisa solo cuando cambia el usuario (entra, sale u otra cuenta). Devuelve cómo dejar de escuchar. */
  onChange(cb: (s: AuthSession | null) => void): () => void;
  sendCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

/** Normaliza lo que pega el usuario: quita espacios y guiones («123 456» → «123456»). */
export const normalizeCode = (s: string) => s.replace(/\D/g, '');

const fail = (
  e: { message: string; status?: number; code?: string } | null,
  fallback: string,
): never => {
  const err = toRemoteError(e);
  if (err.kind === 'network') throw err;
  throw new RemoteError(fallback, 'server', e?.code);
};

export function createAuthApi(client: SupabaseClient): AuthApi {
  const toSession = (
    s: { user: { id: string; email?: string | null } } | null,
  ): AuthSession | null => (s ? { userId: s.user.id, email: s.user.email ?? '' } : null);

  return {
    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw toRemoteError(error);
      return toSession(data.session);
    },
    onChange(cb) {
      let last: string | null | undefined;
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        const next = session?.user.id ?? null;
        if (next === last) return;
        last = next;
        cb(toSession(session));
      });
      return () => data.subscription.unsubscribe();
    },
    async sendCode(email) {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true },
      });
      if (error) fail(error, 'No pudimos mandar el código. Revisá el mail y probá de nuevo.');
    },
    async verifyCode(email, code) {
      const { error } = await client.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: normalizeCode(code),
        type: 'email',
      });
      if (error) fail(error, 'Ese código no es válido o ya venció. Pedí uno nuevo.');
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw new RemoteError(GENERIC_MESSAGE, 'unknown');
    },
  };
}
