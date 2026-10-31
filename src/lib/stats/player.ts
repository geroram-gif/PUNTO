import { chrono, sideOf } from './order';
import { pct } from './pct';
import { setsFor, winnerOf } from './results';
import type { GroupId, ISODate, Match, PlayerId } from './types';

export interface Streak {
  type: 'W' | 'L' | null;
  n: number;
}

export interface PlayerStats {
  /** Partidos jugados. */
  pj: number;
  /** Ganados. */
  g: number;
  /** Perdidos. */
  p: number;
  pct: number;
  setsW: number;
  setsL: number;
  setsPct: number;
  /** Racha actual (último resultado y cuántos seguidos). */
  streak: Streak;
  /** Mejor racha de victorias. */
  best: number;
  /** Fecha del primer partido. */
  first: ISODate | null;
  /** Partidos del jugador en orden cronológico. */
  matches: Match[];
}

export function playerStats(ms: readonly Match[], pid: PlayerId): PlayerStats {
  const list = chrono(ms.filter((m) => sideOf(m, pid)));
  let g = 0;
  let sw = 0;
  let sl = 0;
  let best = 0;
  let run = 0;
  let cur: Streak = { type: null, n: 0 };
  list.forEach((m) => {
    const side = sideOf(m, pid);
    const win = winnerOf(m) === side;
    if (win) {
      g++;
      run++;
      if (run > best) best = run;
    } else run = 0;
    const s = setsFor(m, side);
    sw += s.w;
    sl += s.l;
    const t = win ? 'W' : 'L';
    if (cur.type === t) cur.n++;
    else cur = { type: t, n: 1 };
  });
  const pj = list.length;
  return {
    pj,
    g,
    p: pj - g,
    pct: pct(g, pj),
    setsW: sw,
    setsL: sl,
    setsPct: pct(sw, sw + sl),
    streak: cur,
    best,
    first: list.length ? list[0].date : null,
    matches: list,
  };
}

export interface PeerRecord {
  id: PlayerId;
  /** Partidos juntos (compañero) o enfrentados (rival). */
  n: number;
  /** Ganados por el jugador consultado. */
  w: number;
  pct: number;
  /** Grupos donde coincidieron, en orden de aparición. */
  groupIds: GroupId[];
}

/** Compañeros y rivales para el perfil global. */
export function partnersAndRivals(
  ms: readonly Match[],
  pid: PlayerId,
): { partners: PeerRecord[]; rivals: PeerRecord[] } {
  type Acc = { id: PlayerId; n: number; w: number; groups: Set<GroupId> };
  const part = new Map<PlayerId, Acc>();
  const riv = new Map<PlayerId, Acc>();
  const bump = (map: Map<PlayerId, Acc>, x: PlayerId, w: boolean, groupId: GroupId) => {
    let r = map.get(x);
    if (!r) {
      r = { id: x, n: 0, w: 0, groups: new Set() };
      map.set(x, r);
    }
    r.n++;
    if (w) r.w++;
    r.groups.add(groupId);
  };
  ms.forEach((m) => {
    const s = sideOf(m, pid);
    if (!s) return;
    const w = winnerOf(m) === s;
    const mine = s === 'A' ? m.teamA : m.teamB;
    const other = s === 'A' ? m.teamB : m.teamA;
    mine.forEach((x) => {
      if (x === pid) return;
      bump(part, x, w, m.groupId);
    });
    other.forEach((x) => bump(riv, x, w, m.groupId));
  });
  const sorted = (o: Map<PlayerId, Acc>): PeerRecord[] =>
    Array.from(o.values())
      .map((x) => ({
        id: x.id,
        n: x.n,
        w: x.w,
        pct: pct(x.w, x.n),
        groupIds: Array.from(x.groups),
      }))
      .sort((a, b) => b.n - a.n || b.w - a.w || (a.id < b.id ? -1 : 1));
  return { partners: sorted(part), rivals: sorted(riv) };
}
