import type { Group, Match, MatchFormat, Player, PlayerId, SetScore } from '@/lib/stats';

/** Pedido de ingreso pendiente de un grupo que administro. */
export interface PendingRequest {
  id: string;
  groupId: string;
  name: string;
  initials: string;
  avatarColor: string;
}

/** Todo lo que el usuario puede ver, en el formato del motor (salida de public.app_snapshot). */
export interface Snapshot {
  /** Mi jugador. */
  me: PlayerId;
  /** Ya completó su perfil (nombre y color). */
  onboarded: boolean;
  deletionRequested: boolean;
  players: Record<PlayerId, Player>;
  groups: Group[];
  matches: Match[];
  pendingRequests: PendingRequest[];
}

const bad = (what: string): never => {
  throw new Error('Respuesta inesperada del servidor: ' + what);
};
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, what: string): string => (typeof v === 'string' ? v : bad(what));
const arr = (v: unknown, what: string): unknown[] => (Array.isArray(v) ? v : bad(what));
const obj = (v: unknown, what: string): Record<string, unknown> => (isObj(v) ? v : bad(what));
const strs = (v: unknown, what: string) => arr(v, what).map((x) => str(x, what));
const FORMATS: readonly string[] = ['one', 'bo3', 'st'];

/** Valida y tipa la respuesta de app_snapshot. La base ya manda el formato del motor. */
export function parseSnapshot(raw: unknown): Snapshot {
  const r = obj(raw, 'snapshot');
  const players: Record<PlayerId, Player> = {};
  for (const x of arr(r.players, 'players')) {
    const p = obj(x, 'player');
    const id = str(p.id, 'player.id');
    players[id] = {
      id,
      name: str(p.name, 'player.name'),
      fullName: str(p.fullName, 'player.fullName'),
      initials: str(p.initials, 'player.initials'),
      avatarColor: str(p.avatarColor, 'player.avatarColor'),
      isGuest: p.isGuest === true,
    };
  }
  const groups: Group[] = arr(r.groups, 'groups').map((x) => {
    const g = obj(x, 'group');
    return {
      id: str(g.id, 'group.id'),
      name: str(g.name, 'group.name'),
      initials: str(g.initials, 'group.initials'),
      color: str(g.color, 'group.color'),
      adminIds: strs(g.adminIds, 'group.adminIds'),
      memberIds: strs(g.memberIds, 'group.memberIds'),
    };
  });
  const matches: Match[] = arr(r.matches, 'matches').map((x) => {
    const m = obj(x, 'match');
    const format = str(m.format, 'match.format');
    if (!FORMATS.includes(format)) bad('match.format');
    const a = strs(m.teamA, 'match.teamA');
    const b = strs(m.teamB, 'match.teamB');
    if (a.length !== 2 || b.length !== 2) bad('match.teams');
    const sets = arr(m.sets, 'match.sets').map((s) => {
      const pair = arr(s, 'match.set');
      if (pair.length !== 2 || typeof pair[0] !== 'number' || typeof pair[1] !== 'number')
        bad('match.set');
      return [pair[0], pair[1]] as SetScore;
    });
    return {
      id: str(m.id, 'match.id'),
      groupId: str(m.groupId, 'match.groupId'),
      date: str(m.date, 'match.date'),
      seq: typeof m.seq === 'number' ? m.seq : bad('match.seq'),
      teamA: [a[0], a[1]],
      teamB: [b[0], b[1]],
      format: format as MatchFormat,
      sets,
      // Sin dato = su autor ya no está en PUNTO: nadie lo "cargó" a efectos de permisos.
      createdBy: typeof m.createdBy === 'string' ? m.createdBy : '',
      edited: m.edited === true,
    };
  });
  const pendingRequests: PendingRequest[] = arr(r.pendingRequests, 'pendingRequests').map((x) => {
    const q = obj(x, 'request');
    return {
      id: str(q.id, 'request.id'),
      groupId: str(q.groupId, 'request.groupId'),
      name: str(q.name, 'request.name'),
      initials: str(q.initials, 'request.initials'),
      avatarColor: str(q.avatarColor, 'request.avatarColor'),
    };
  });
  return {
    me: str(r.me, 'me'),
    onboarded: r.onboarded === true,
    deletionRequested: r.deletionRequested === true,
    players,
    groups,
    matches,
    pendingRequests,
  };
}
