import {
  fmtMonthYear,
  fmtShort,
  newestFirst,
  partnersAndRivals,
  playerStats,
  rankOf,
  sideOf,
  winnerOf,
  type GroupId,
} from '@/lib/stats';

import type { AvatarVM, Ctx, StreakVM } from '../shared/ctx';

export interface ProfileVM {
  name: string;
  fullName: string;
  initials: string;
  scope: string;
  since: string;
  hasData: boolean;
  pct: number;
  pj: number;
  g: number;
  p: number;
  streak: StreakVM | null;
  setsW: number;
  setsL: number;
  setsPct: number;
  setsRatio: number;
  groups: {
    id: string;
    ini: string;
    bg: string;
    name: string;
    meta: string;
    badge: string;
    aria: string;
  }[];
  sumNote: string;
  partners: { id: string; av: AvatarVM; name: string; group: string; meta: string }[];
  rivals: {
    id: string;
    groupId: GroupId;
    av: AvatarVM;
    name: string;
    meta: string;
    score: string;
    aria: string;
  }[];
  recent: {
    matchId: string;
    won: boolean;
    title: string;
    meta: string;
    score: string;
    aria: string;
  }[];
}

/** Perfil global (prototipo: «05 PERFIL»). */
export function profileVM(c: Ctx): ProfileVM {
  const { me } = c;
  const gs = playerStats(c.myMatches, me);
  const n = c.myGroups.length;
  const meP = c.pl(me);
  const vm: ProfileVM = {
    name: meP.name,
    fullName: meP.fullName,
    initials: meP.initials,
    scope: 'Perfil global · ' + n + (n === 1 ? ' grupo' : ' grupos'),
    since: gs.first
      ? meP.name + ' · juega en PUNTO desde ' + fmtMonthYear(gs.first)
      : meP.name + ' · todavía sin partidos',
    hasData: gs.pj > 0,
    pct: gs.pct,
    pj: gs.pj,
    g: gs.g,
    p: gs.p,
    streak: null,
    setsW: gs.setsW,
    setsL: gs.setsL,
    setsPct: gs.setsPct,
    setsRatio: gs.setsW + gs.setsL ? gs.setsW / (gs.setsW + gs.setsL) : 0,
    groups: [],
    sumNote: '',
    partners: [],
    rivals: [],
    recent: [],
  };
  if (!gs.pj) return vm;
  vm.streak = c.streakVM(gs);
  const parts: number[] = [];
  vm.groups = c.myGroups.map((x) => {
    const ms2 = c.gm(x.id);
    const ps2 = playerStats(ms2, me);
    const rk2 = rankOf(ms2, x, c.players, me);
    if (ps2.pj) parts.push(ps2.pj);
    return {
      id: x.id,
      ini: x.initials,
      bg: x.color,
      name: c.gname(x),
      meta: ps2.pj ? ps2.pj + ' PJ · ' + ps2.g + ' G · ' + ps2.pct + '%' : 'Sin partidos todavía',
      badge: rk2 ? '#' + rk2.pos : ps2.pj ? 'Prov.' : '—',
      aria:
        c.gname(x) +
        ': ' +
        ps2.pj +
        ' partidos, ' +
        ps2.pct +
        ' por ciento' +
        (rk2 ? ', puesto ' + rk2.pos : ''),
    };
  });
  vm.sumNote =
    (parts.length > 1 ? parts.join(' + ') + ' = ' + gs.pj + '. ' : '') +
    'Cada partido suma una sola vez a tu perfil global; el ranking es siempre de cada grupo.';
  const pr = partnersAndRivals(c.myMatches, me);
  const gl = (ids: GroupId[]) =>
    ids
      .map((i) => {
        const x = c.gById(i);
        return x ? c.gname(x) : '';
      })
      .join(' · ');
  vm.partners = pr.partners.slice(0, 3).map((p) => ({
    id: p.id,
    av: c.av(p.id, false),
    name: c.pl(p.id).name,
    group: gl(p.groupIds),
    meta: p.n + ' PJ · ' + p.w + ' G · ' + p.pct + '%',
  }));
  vm.rivals = pr.rivals.slice(0, 3).map((r) => ({
    id: r.id,
    groupId: r.groupIds[0],
    av: c.av(r.id, true),
    name: c.pl(r.id).name,
    meta: gl(r.groupIds) + ' · ' + r.n + ' cruces',
    score: r.w + '-' + (r.n - r.w),
    aria: 'Cara a cara con ' + c.pl(r.id).name + ': ' + r.w + ' a ' + (r.n - r.w),
  }));
  vm.recent = newestFirst(gs.matches)
    .slice(0, 5)
    .map((m) => {
      const sd = sideOf(m, me);
      const wn = winnerOf(m) === sd;
      const mine = sd === 'A' ? m.teamA : m.teamB;
      const oth = sd === 'A' ? m.teamB : m.teamA;
      const partner = mine.filter((x) => x !== me)[0];
      const g = c.gById(m.groupId);
      return {
        matchId: m.id,
        won: wn,
        title: 'Con ' + c.pl(partner).name + ' vs ' + c.names(oth),
        meta: fmtShort(m.date) + ' · ' + (g ? c.gname(g) : ''),
        score: c.scoreFor(m, sd),
        aria:
          (wn ? 'Ganado' : 'Perdido') +
          ' con ' +
          c.pl(partner).name +
          ' contra ' +
          c.names(oth) +
          ', ' +
          c.scoreFor(m, sd) +
          '. Ver detalle.',
      };
    });
  return vm;
}
