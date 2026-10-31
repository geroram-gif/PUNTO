import { MIN_H2H } from './constants';
import { newestFirst, sideOf } from './order';
import { pct } from './pct';
import { winnerOf } from './results';
import type { Match, PlayerId } from './types';

export interface H2HMeeting {
  m: Match;
  aWon: boolean;
}

export interface H2HResult {
  /** Cruces (lados opuestos). */
  total: number;
  aW: number;
  bW: number;
  /** Partidos jugados del mismo lado (no cuentan como cruce). */
  together: { n: number; w: number };
  /** Cruces, del más nuevo al más viejo. */
  meetings: H2HMeeting[];
  aPct: number;
  bPct: number;
}

/** Cara a cara: solo cuentan los partidos en lados opuestos. */
export function h2h(ms: readonly Match[], a: PlayerId, b: PlayerId): H2HResult {
  const res: H2HResult = {
    total: 0,
    aW: 0,
    bW: 0,
    together: { n: 0, w: 0 },
    meetings: [],
    aPct: 0,
    bPct: 0,
  };
  newestFirst(ms).forEach((m) => {
    const sa = sideOf(m, a);
    const sb = sideOf(m, b);
    if (!sa || !sb) return;
    const w = winnerOf(m);
    if (sa === sb) {
      res.together.n++;
      if (w === sa) res.together.w++;
      return;
    }
    res.total++;
    if (w === sa) res.aW++;
    else res.bW++;
    res.meetings.push({ m, aWon: w === sa });
  });
  res.aPct = pct(res.aW, res.total);
  res.bPct = res.total ? 100 - res.aPct : 0;
  return res;
}

export interface H2HHeadline {
  title: string;
  sub: string;
  /** Muestra chica: menos de MIN_H2H cruces, sin veredicto. */
  small: boolean;
}

/** Titular honesto: nada de veredictos con muestras chicas. */
export function h2hHeadline(
  r: Pick<H2HResult, 'total' | 'aW' | 'bW'>,
  aName: string,
  bName: string,
): H2HHeadline {
  if (!r.total) return { title: 'Todavía no se cruzaron.', sub: '', small: false };
  if (r.total < MIN_H2H)
    return {
      title: 'Muestra chica.',
      sub: r.total + (r.total === 1 ? ' cruce' : ' cruces') + '. Todavía no hay veredicto.',
      small: true,
    };
  const d = r.aW - r.bW;
  if (Math.abs(d) <= 1)
    return {
      title: 'Mano a mano.',
      sub: r.aW + ' a ' + r.bW + ' en ' + r.total + ' cruces.',
      small: false,
    };
  const lead = d > 0 ? aName : bName;
  const lw = Math.max(r.aW, r.bW);
  if (Math.abs(d) >= 3)
    return {
      title: 'Hay historial.',
      sub: lead + ' ganó ' + lw + ' de los ' + r.total + ' cruces.',
      small: false,
    };
  return {
    title: 'Viene ganando ' + lead + '.',
    sub: lw + ' de ' + r.total + ' cruces.',
    small: false,
  };
}
