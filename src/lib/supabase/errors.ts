/**
 * Errores del backend en español. Los mensajes de las RPC (códigos 22023, 42501 y P0002) ya
 * están escritos para el usuario; cualquier otra cosa se traduce a un mensaje genérico.
 */
export type RemoteErrorKind = 'network' | 'server' | 'unknown';

export class RemoteError extends Error {
  kind: RemoteErrorKind;
  code?: string;
  constructor(message: string, kind: RemoteErrorKind, code?: string) {
    super(message);
    this.name = 'RemoteError';
    this.kind = kind;
    this.code = code;
  }
}

const USER_FACING = new Set(['22023', '42501', 'P0002', '23514', '23505']);
const NETWORK = /network|fetch|timeout|timed out|offline|internet|ECONN|ENOTFOUND/i;

export const NETWORK_MESSAGE = 'Revisá tu conexión y probá de nuevo.';
export const GENERIC_MESSAGE = 'Algo salió mal. Probá de nuevo en un rato.';

export function toRemoteError(e: unknown): RemoteError {
  if (e instanceof RemoteError) return e;
  const err = (e ?? {}) as { message?: unknown; code?: unknown; status?: unknown };
  const message = typeof err.message === 'string' ? err.message : '';
  const code = typeof err.code === 'string' && err.code ? err.code : undefined;
  if (code && USER_FACING.has(code) && message) return new RemoteError(message, 'server', code);
  if (!code && NETWORK.test(message)) return new RemoteError(NETWORK_MESSAGE, 'network');
  if (err.status === 0) return new RemoteError(NETWORK_MESSAGE, 'network');
  return new RemoteError(GENERIC_MESSAGE, 'unknown', code);
}
