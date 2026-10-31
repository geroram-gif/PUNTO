import { MIN_RANK } from './constants';
import { playerStats } from './player';
import type { GroupRef, Match, PlayerId, PlayerNames } from './types';

export interface RankingRow {
  id: PlayerId;
  pj: number;
  g: number;
  pct: number;
  ratio: number;
  setsRatio: number;
  name: string;
}

export interface QualifiedRankingRow extends RankingRow {
  pos: number;
  /** Empate total con el anterior o el siguiente: comparten puesto («=2»). */
  tied: boolean;
}

export interface GroupRanking {
  qualified: QualifiedRankingRow[];
  /** Menos de MIN_RANK partidos: sin puesto, con progreso «n de 5». */
  provisional: RankingRow[];
}

/**
 * Ranking por grupo. Orden: % de victorias, ganados, % de sets y nombre.
 * `ms` tiene que ser solo los partidos del grupo.
 */
export function groupRanking(
  ms: readonly Match[],
  group: GroupRef,
  players: PlayerNames,
): GroupRanking {
  const rows: RankingRow[] = group.memberIds.map((pid) => {
    const s = playerStats(ms, pid);
    return {
      id: pid,
      pj: s.pj,
      g: s.g,
      pct: s.pct,
      ratio: s.pj ? s.g / s.pj : 0,
      setsRatio: s.setsW + s.setsL ? s.setsW / (s.setsW + s.setsL) : 0,
      name: players[pid] ? players[pid].name : pid,
    };
  });
  const q: QualifiedRankingRow[] = rows
    .filter((r) => r.pj >= MIN_RANK)
    .map((r) => ({ ...r, pos: 0, tied: false }));
  const prov = rows.filter((r) => r.pj < MIN_RANK);
  q.sort(
    (a, b) =>
      b.ratio - a.ratio || b.g - a.g || b.setsRatio - a.setsRatio || (a.name < b.name ? -1 : 1),
  );
  q.forEach((r, i) => {
    const prev = i > 0 ? q[i - 1] : undefined;
    const tied =
      !!prev && prev.ratio === r.ratio && prev.g === r.g && prev.setsRatio === r.setsRatio;
    r.pos = tied && prev ? prev.pos : i + 1;
    r.tied = tied;
    if (tied && prev) prev.tied = true;
  });
  prov.sort((a, b) => b.pj - a.pj || (a.name < b.name ? -1 : 1));
  return { qualified: q, provisional: prov };
}

export interface RankPosition {
  pos: number;
  of: number;
  row: QualifiedRankingRow;
}

export function rankOf(
  ms: readonly Match[],
  group: GroupRef,
  players: PlayerNames,
  pid: PlayerId,
): RankPosition | null {
  const r = groupRanking(ms, group, players);
  for (let i = 0; i < r.qualified.length; i++)
    if (r.qualified[i].id === pid)
      return { pos: r.qualified[i].pos, of: r.qualified.length, row: r.qualified[i] };
  return null;
}
