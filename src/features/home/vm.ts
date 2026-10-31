import {
  fmtLong,
  h2h,
  h2hHeadline,
  MIN_H2H,
  newestFirst,
  partnersAndRivals,
  playerStats,
  rankOf,
  relDay,
  winnerOf,
} from '@/lib/stats';

import { capitalize, type Ctx, type MatchCardVM, type StreakVM } from '../shared/ctx';

export interface HomeVM {
  meName: string;
  meInitials: string;
  dateLabel: string;
  hasData: boolean;
  win: {
    pct: number;
    pj: number;
    g: number;
    p: number;
    barRatio: number;
    scopeLabel: string;
    aria: string;
  } | null;
  streak: StreakVM | null;
  rival: {
    rivalId: string;
    groupId: string;
    group: string;
    title: string;
    text: string;
    score: string;
  } | null;
  last: MatchCardVM | null;
  activity: {
    matchId: string;
    gini: string;
    gbg: string;
    title: string;
    meta: string;
    score: string;
    aria: string;
  }[];
  groups: GroupCardVM[];
  groupsCount: string;
}

export interface GroupCardVM {
  id: string;
  ini: string;
  bg: string;
  name: string;
  meta: string;
  badge: string;
  badgeSub: string;
  aria: string;
}

/** Inicio (prototipo: «01 INICIO»). */
export function homeVM(c: Ctx): HomeVM {
  const { me, today } = c;
  const gs = playerStats(c.myMatches, me);
  const vm: HomeVM = {
    meName: c.pl(me).name,
    meInitials: c.pl(me).initials,
    dateLabel: capitalize(fmtLong(today)),
    hasData: gs.pj > 0,
    win: null,
    streak: null,
    rival: null,
    last: null,
    activity: [],
    groups: [],
    groupsCount: String(c.myGroups.length),
  };
  if (gs.pj) {
    const n = c.myGroups.length;
    vm.win = {
      pct: gs.pct,
      pj: gs.pj,
      g: gs.g,
      p: gs.p,
      barRatio: gs.g / gs.pj,
      scopeLabel: 'Global · ' + n + (n === 1 ? ' grupo' : ' grupos'),
      aria:
        'Tu porcentaje de victorias global: ' +
        gs.pct +
        ' por ciento, ' +
        gs.g +
        ' ganados y ' +
        gs.p +
        ' perdidos en ' +
        gs.pj +
        ' partidos. Ver perfil.',
    };
    vm.streak = c.streakVM(gs);
    const topR = partnersAndRivals(c.myMatches, me).rivals.find((r) => r.n >= MIN_H2H);
    if (topR) {
      const rgid = topR.groupIds[0];
      const rg = c.gById(rgid);
      const hr = h2h(c.gm(rgid), me, topR.id);
      const rname = c.pl(topR.id).name;
      const hl = h2hHeadline(hr, c.pl(me).name, rname);
      const text =
        hr.aW > hr.bW
          ? 'Le ganaste ' + hr.aW + ' de ' + hr.total + ' cruces a ' + rname + '.'
          : hr.bW > hr.aW
            ? rname + ' te ganó ' + hr.bW + ' de ' + hr.total + ' cruces.'
            : hr.aW + ' a ' + hr.bW + ' con ' + rname + ' en ' + hr.total + ' cruces.';
      vm.rival = {
        rivalId: topR.id,
        groupId: rgid,
        group: rg ? c.gname(rg) : '',
        title: hl.title,
        text,
        score: hr.aW + '-' + hr.bW,
      };
    }
    const lastMine = newestFirst(gs.matches)[0];
    if (lastMine) vm.last = c.card(lastMine);
    vm.activity = newestFirst(c.myMatches)
      .slice(0, 3)
      .map((m) => {
        const w = winnerOf(m);
        const top = w === 'B' ? m.teamB : m.teamA;
        const bot = w === 'B' ? m.teamA : m.teamB;
        const g = c.gById(m.groupId)!;
        return {
          matchId: m.id,
          gini: g.initials,
          gbg: g.color,
          title: c.names(top) + ' le ganaron a ' + c.names(bot),
          meta: c.gname(g) + ' · ' + relDay(m.date, today),
          score: c.scoreFor(m, w),
          aria:
            c.names(top) +
            ' le ganaron a ' +
            c.names(bot) +
            ' en ' +
            c.gname(g) +
            ', ' +
            relDay(m.date, today) +
            '. Ver detalle.',
        };
      });
  }
  vm.groups = c.myGroups.map((g) => {
    const ms = c.gm(g.id);
    const rk = rankOf(ms, g, c.players, me);
    const ps = playerStats(ms, me);
    const last = newestFirst(ms)[0];
    const meta =
      g.memberIds.length +
      ' miembros · ' +
      (last ? 'último partido ' + relDay(last.date, today) : 'sin partidos todavía');
    return {
      id: g.id,
      ini: g.initials,
      bg: g.color,
      name: c.gname(g),
      meta,
      badge: rk ? '#' + rk.pos : ps.pj ? ps.pj + '/5' : '—',
      badgeSub: rk ? 'de ' + rk.of : ps.pj ? 'provisorio' : 'sin partidos',
      aria:
        c.gname(g) + ', ' + meta + (rk ? ', estás en el puesto ' + rk.pos + ' de ' + rk.of : ''),
    };
  });
  return vm;
}
