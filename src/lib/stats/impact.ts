import { playerStats, type PlayerStats } from './player';
import { rankOf, type RankPosition } from './ranking';
import type { GroupRef, Match, PlayerId, PlayerNames } from './types';

export interface Impact {
  before: PlayerStats;
  after: PlayerStats;
  groupBefore: PlayerStats;
  groupAfter: PlayerStats;
  rankBefore: RankPosition | null;
  rankAfter: RankPosition | null;
}

/** Impacto de un cambio (alta, corrección o borrado) para un jugador, global y en el grupo. */
export function impact(
  before: readonly Match[],
  after: readonly Match[],
  pid: PlayerId,
  group: GroupRef,
  players: PlayerNames,
): Impact {
  const inGroup = (ms: readonly Match[]) => ms.filter((m) => m.groupId === group.id);
  const b = playerStats(before, pid);
  const a = playerStats(after, pid);
  const gb = playerStats(inGroup(before), pid);
  const ga = playerStats(inGroup(after), pid);
  const rb = rankOf(inGroup(before), group, players, pid);
  const ra = rankOf(inGroup(after), group, players, pid);
  return { before: b, after: a, groupBefore: gb, groupAfter: ga, rankBefore: rb, rankAfter: ra };
}
