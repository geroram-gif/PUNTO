import type { Match, MatchFormat, PlayerId, SetScore, Side } from './types';

/** Set válido: 6-0 a 6-4, 7-5 o 7-6. */
export function validSet(a: number, b: number): boolean {
  const mx = Math.max(a, b);
  const mn = Math.min(a, b);
  return (mx === 6 && mn <= 4) || (mx === 7 && (mn === 5 || mn === 6));
}

/** Súper tie-break: a 10 o más con 2 de diferencia (si pasa de 10, diferencia exacta de 2). */
export function validSuper(a: number, b: number): boolean {
  const mx = Math.max(a, b);
  const mn = Math.min(a, b);
  return mx >= 10 && mx - mn >= 2 && (mx === 10 || mx - mn === 2);
}

export interface ResultAnalysis {
  /** Cantidad de sets a mostrar (suma el tercero solo si los dos primeros quedan 1-1). */
  visible: number;
  needThird: boolean;
  /** Mensaje de error por set visible ('' si está bien o vacío). */
  setErrs: string[];
  /** Lo que falta o está mal, en el orden en que se muestra. */
  missing: string[];
  winner: Side | null;
  ok: boolean;
}

/** Borrador de sets: puede venir incompleto mientras se carga. */
export type DraftSets = readonly (Readonly<SetScore> | null | undefined)[];
/** Lugares de jugadores de un borrador (vacíos = null/undefined/''). */
export type DraftPlayers = readonly (PlayerId | null | undefined)[];

/** Analiza un borrador o un partido. Devuelve sets visibles, errores por set, faltantes y ganador. */
export function analyze(
  format: MatchFormat,
  sets: DraftSets,
  players?: DraftPlayers,
): ResultAnalysis {
  const base = format === 'one' ? 1 : 2;
  const ok: boolean[] = [];
  let wa = 0;
  let wb = 0;
  let a: number;
  let b: number;
  let v: boolean;
  for (let i = 0; i < base; i++) {
    const s = sets[i];
    a = s ? s[0] : 0;
    b = s ? s[1] : 0;
    v = validSet(a, b);
    ok.push(v);
    if (v) {
      if (a > b) wa++;
      else wb++;
    }
  }
  const needThird = format !== 'one' && ok[0] && ok[1] && wa === 1 && wb === 1;
  const visible = base + (needThird ? 1 : 0);
  if (needThird) {
    const s = sets[2];
    a = s ? s[0] : 0;
    b = s ? s[1] : 0;
    v = format === 'st' ? validSuper(a, b) : validSet(a, b);
    ok.push(v);
    if (v) {
      if (a > b) wa++;
      else wb++;
    }
  }
  const missing: string[] = [];
  const setErrs: string[] = [];
  if (players) {
    const filled = players.filter(Boolean).length;
    if (filled < 4)
      missing.push(4 - filled === 1 ? 'falta 1 jugador' : 'faltan ' + (4 - filled) + ' jugadores');
  }
  for (let i = 0; i < visible; i++) {
    const s = sets[i];
    a = s ? s[0] : 0;
    b = s ? s[1] : 0;
    const isSuper = format === 'st' && i === 2;
    const label = isSuper ? 'el súper tie-break' : 'el set ' + (i + 1);
    if (a === 0 && b === 0) {
      missing.push('falta ' + label);
      setErrs.push('');
      continue;
    }
    if (!ok[i]) {
      missing.push(label + ' no es válido');
      setErrs.push(
        isSuper
          ? a +
              '-' +
              b +
              ' no cierra el súper tie-break. Se gana llegando a 10 con 2 de diferencia.'
          : a + '-' + b + ' no cierra un set. Valen 6-0 a 6-4, 7-5 o 7-6.',
      );
    } else setErrs.push('');
  }
  const target = format === 'one' ? 1 : 2;
  const winner: Side | null = wa >= target ? 'A' : wb >= target ? 'B' : null;
  if (!missing.length && !winner) missing.push('el resultado no define ganador');
  return { visible, needThird, setErrs, missing, winner, ok: missing.length === 0 };
}

/** Ganador derivado de los sets. Nunca se guarda. */
export function winnerOf(m: Pick<Match, 'format' | 'sets'>): Side | null {
  return analyze(m.format, m.sets).winner;
}

/** Sets ganados y perdidos por un lado (el súper tie-break cuenta como set). */
export function setsFor(
  m: Pick<Match, 'format' | 'sets'>,
  side: Side | null,
): { w: number; l: number } {
  let w = 0;
  let l = 0;
  const n = analyze(m.format, m.sets).visible;
  for (let i = 0; i < n; i++) {
    const a = m.sets[i][0];
    const b = m.sets[i][1];
    const mine = side === 'A' ? a : b;
    const theirs = side === 'A' ? b : a;
    if (mine > theirs) w++;
    else l++;
  }
  return { w, l };
}
