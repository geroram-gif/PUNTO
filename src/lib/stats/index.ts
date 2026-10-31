/**
 * Motor de estadísticas de PUNTO (puro, sin UI).
 * Port 1:1 de design/logic/engine.js: toda cifra que muestra la app sale de acá,
 * a partir de los partidos. La UI no calcula: consume view-models armados con esto.
 */
export * from './types';
export { MIN_RANK, MIN_DUO, MIN_H2H, FORMAT_LABEL } from './constants';
export { pct } from './pct';
export { fmtShort, fmtLong, fmtMonthYear, daysBetween, relDay } from './dates';
export {
  validSet,
  validSuper,
  analyze,
  winnerOf,
  setsFor,
  type ResultAnalysis,
  type DraftSets,
  type DraftPlayers,
} from './results';
export { chrono, newestFirst, sideOf } from './order';
export {
  playerStats,
  partnersAndRivals,
  type PlayerStats,
  type Streak,
  type PeerRecord,
} from './player';
export {
  groupRanking,
  rankOf,
  type GroupRanking,
  type RankingRow,
  type QualifiedRankingRow,
  type RankPosition,
} from './ranking';
export { duoStats, topDuo, type DuoRecord } from './duos';
export { h2h, h2hHeadline, type H2HResult, type H2HMeeting, type H2HHeadline } from './h2h';
export { impact, type Impact } from './impact';
