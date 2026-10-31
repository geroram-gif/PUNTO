import {
  analyze,
  fmtShort,
  h2h,
  playerStats,
  rankOf,
  sideOf,
  winnerOf,
  type MatchId,
} from '@/lib/stats';
import { palette } from '@/theme/colors';

import type { AvatarVM, Ctx } from '../shared/ctx';

export interface ResultVM {
  matchId: MatchId;
  groupId: string;
  meta: string;
  winners: AvatarVM[];
  losers: AvatarVM[];
  winnerNames: string;
  loserNames: string;
  sets: string[];
  scoreSize: number;
  scoreAria: string;
  hasBig: boolean;
  big: string;
  title: string;
  text: string;
  lines: string[];
  h2h: { rivalId: string; label: string } | null;
  share: { kicker: string; big: string[]; size: number; line: string; text: string };
}

/** Resultado (prototipo: «04 RESULTADO»). */
export function resultVM(c: Ctx, id: MatchId | null): ResultVM | null {
  const rm = c.matches.find((m) => m.id === id);
  if (!rm) return null;
  const { me, today } = c;
  const rgrp = c.gById(rm.groupId)!;
  const gname = c.gname(rgrp);
  const w = winnerOf(rm);
  const winT = w === 'B' ? rm.teamB : rm.teamA;
  const losT = w === 'B' ? rm.teamA : rm.teamB;
  const vis = analyze(rm.format, rm.sets).visible;
  const sets = rm.sets
    .slice(0, vis)
    .map((x) => (w === 'B' ? x[1] + '-' + x[0] : x[0] + '-' + x[1]));
  /** Sobre fondo coral, el avatar coral pasa a navy con iniciales coral. */
  const resAv = (pid: string): AvatarVM => {
    const a = c.av(pid, false);
    return a.bg === palette.coral ? { ...a, bg: palette.navy, fg: palette.coral } : a;
  };
  const before = c.myMatches.filter((m) => m.id !== rm.id);
  const b0 = playerStats(before, me);
  const a0 = playerStats(c.myMatches, me);
  const side = sideOf(rm, me);
  const gB = before.filter((m) => m.groupId === rm.groupId);
  const gA = c.gm(rm.groupId);
  const rkB = rankOf(gB, rgrp, c.players, me);
  const rkA = rankOf(gA, rgrp, c.players, me);
  const winnerNames = c.names(winT);
  const vm: ResultVM = {
    matchId: rm.id,
    groupId: rm.groupId,
    meta: gname + ' · ' + (rm.date === today ? 'Hoy' : fmtShort(rm.date)),
    winners: winT.map(resAv),
    losers: losT.map(resAv),
    winnerNames,
    loserNames: c.names(losT),
    sets,
    scoreSize: sets.length === 1 ? 104 : sets.length === 2 ? 84 : 62,
    scoreAria: winnerNames + ' ganaron ' + sets.join(', '),
    hasBig: false,
    big: '',
    title: '',
    text: '',
    lines: [],
    h2h: null,
    share: {
      kicker: gname,
      big: sets,
      size: sets.length > 2 ? 44 : 52,
      line: winnerNames + ' ganaron.',
      text: winnerNames + ' ganaron ' + sets.join(' ') + ' en ' + gname + '. PUNTO.',
    },
  };
  if (side) {
    if (side === w) {
      const n = a0.streak.n;
      vm.hasBig = n >= 2;
      vm.big = String(n);
      vm.title = n >= 2 ? 'al hilo.' : 'Volviste a ganar.';
      vm.text = n >= 2 ? 'Sumaste ' + n + ' victorias seguidas.' : 'Cortaste la mala racha.';
    } else {
      const prevW = b0.streak.type === 'W' ? b0.streak.n : 0;
      vm.title = prevW >= 2 ? 'Se cortó la racha.' : 'Se viene revancha.';
      vm.text =
        prevW >= 2
          ? 'Venías de ' + prevW + ' al hilo. Se viene revancha.'
          : a0.streak.n >= 2
            ? 'Van ' + a0.streak.n + ' seguidos. La próxima es tuya.'
            : 'Queda en el historial. La próxima es tuya.';
    }
    vm.lines.push(
      b0.pct === a0.pct
        ? 'Tu % global se mantiene en ' + a0.pct + '% · ' + a0.pj + ' partidos'
        : 'Tu % global: ' + b0.pct + '% → ' + a0.pct + '% · ' + a0.pj + ' partidos',
    );
    if (rkA && (!rkB || rkB.pos !== rkA.pos))
      vm.lines.push(
        rkB
          ? 'En ' + gname + ': del #' + rkB.pos + ' al #' + rkA.pos
          : 'Entraste al ranking de ' + gname + ': #' + rkA.pos,
      );
    const opp = losT.indexOf(me) >= 0 ? winT : losT;
    const rivalId = opp.slice().sort((x, y) => h2h(gA, me, y).total - h2h(gA, me, x).total)[0];
    const hh = h2h(gA, me, rivalId);
    vm.h2h = {
      rivalId,
      label: 'Cara a cara con ' + c.pl(rivalId).name + ' · ' + hh.aW + '-' + hh.bW,
    };
  } else {
    vm.title = 'Ya quedó en el historial.';
    vm.text = 'Es el partido ' + gA.length + ' de ' + gname + '.';
  }
  return vm;
}
