import type { Match, PlayerId, Side } from './types';

/** Orden cronológico determinista: fecha, luego `seq`, luego id. No muta la entrada. */
export function chrono<T extends Pick<Match, 'date' | 'seq' | 'id'>>(ms: readonly T[]): T[] {
  return ms.slice().sort((x, y) => {
    if (x.date !== y.date) return x.date < y.date ? -1 : 1;
    return (x.seq || 0) - (y.seq || 0) || (x.id < y.id ? -1 : 1);
  });
}

export function newestFirst<T extends Pick<Match, 'date' | 'seq' | 'id'>>(ms: readonly T[]): T[] {
  return chrono(ms).reverse();
}

export function sideOf(m: Pick<Match, 'teamA' | 'teamB'>, pid: PlayerId): Side | null {
  if (m.teamA.indexOf(pid) >= 0) return 'A';
  if (m.teamB.indexOf(pid) >= 0) return 'B';
  return null;
}
