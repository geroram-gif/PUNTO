import { MIN_DUO } from './constants';
import { chrono } from './order';
import { pct } from './pct';
import { winnerOf } from './results';
import type { ISODate, Match, PlayerId } from './types';

export interface DuoRecord {
  /** Los dos jugadores, ordenados. */
  ids: PlayerId[];
  n: number;
  w: number;
  last: ISODate | null;
  /** Resultados en orden cronológico: 'G' ganado, 'P' perdido. */
  results: ('G' | 'P')[];
  pct: number;
  /** Menos de MIN_DUO partidos juntos. */
  provisional: boolean;
}

/** Duplas: mismo lado de la cancha. */
export function duoStats(ms: readonly Match[]): {
  qualified: DuoRecord[];
  provisional: DuoRecord[];
} {
  const map = new Map<string, DuoRecord>();
  chrono(ms).forEach((m) => {
    const w = winnerOf(m);
    (
      [
        ['A', m.teamA],
        ['B', m.teamB],
      ] as const
    ).forEach(([side, team]) => {
      const ids = team.slice().sort();
      const k = ids.join('|');
      let d = map.get(k);
      if (!d) {
        d = { ids, n: 0, w: 0, last: null, results: [], pct: 0, provisional: false };
        map.set(k, d);
      }
      d.n++;
      if (w === side) d.w++;
      d.last = m.date;
      d.results.push(w === side ? 'G' : 'P');
    });
  });
  const all = Array.from(map.values()).map((d) => {
    d.pct = pct(d.w, d.n);
    d.provisional = d.n < MIN_DUO;
    return d;
  });
  all.sort(
    (a, b) =>
      b.w / b.n - a.w / a.n || b.w - a.w || b.n - a.n || (a.ids.join() < b.ids.join() ? -1 : 1),
  );
  return {
    qualified: all.filter((d) => !d.provisional),
    provisional: all.filter((d) => d.provisional),
  };
}

export function topDuo(ms: readonly Match[]): DuoRecord | null {
  const q = duoStats(ms).qualified;
  return q.length ? q[0] : null;
}
