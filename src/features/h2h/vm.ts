import { fmtShort, h2h, h2hHeadline, sideOf, type GroupId, type PlayerId } from '@/lib/stats';

import type { AvatarVM, Ctx } from '../shared/ctx';

export interface H2HVM {
  groupId: GroupId;
  rivalId: PlayerId;
  meName: string;
  meInitials: string;
  groups: { id: GroupId; name: string; selected: boolean }[];
  rivals: { id: PlayerId; name: string; selected: boolean; guest: boolean; av: AvatarVM }[];
  rv: AvatarVM;
  rvName: string;
  rvGuest: boolean;
  hasHistory: boolean;
  total: number;
  score: string;
  title: string;
  sub: string;
  small: boolean;
  aPct: number;
  bPct: number;
  aria: string;
  barAria: string;
  together: string;
  emptyText: string;
  recent: {
    matchId: string;
    who: string;
    meWon: boolean;
    pairs: string;
    date: string;
    score: string;
    aria: string;
  }[];
  share: { kicker: string; big: string; line: string; text: string };
}

/** Cara a cara (prototipo: «06 CARA A CARA»). Sin grupo devuelve null («Sin rivales todavía.»). */
export function h2hVM(c: Ctx, groupId: GroupId | null, rival: PlayerId | null): H2HVM | null {
  const hg = c.gById(groupId);
  if (!hg) return null;
  const { me } = c;
  const meName = c.pl(me).name;
  const hms = c.gm(hg.id);
  const rivalIds = hg.memberIds.filter((i) => i !== me);
  const rid = rival && rivalIds.indexOf(rival) >= 0 ? rival : rivalIds[0];
  const hr = h2h(hms, me, rid);
  const rp = c.pl(rid);
  const hl = h2hHeadline(hr, meName, rp.name);
  const score = hr.aW + '-' + hr.bW;
  const gname = c.gname(hg);
  return {
    groupId: hg.id,
    rivalId: rid,
    meName,
    meInitials: c.pl(me).initials,
    groups: c.myGroups.map((x) => ({ id: x.id, name: c.gname(x), selected: x.id === hg.id })),
    rivals: rivalIds.map((i) => {
      const on = i === rid;
      const p = c.pl(i);
      return { id: i, name: p.name, selected: on, guest: p.isGuest, av: c.av(i, !on) };
    }),
    rv: c.av(rid, true),
    rvName: rp.name,
    rvGuest: rp.isGuest,
    hasHistory: hr.total > 0,
    total: hr.total,
    score,
    title: hl.title,
    sub: hl.sub,
    small: hl.small,
    aPct: hr.aPct,
    bPct: hr.bPct,
    aria: hr.total
      ? meName +
        ' ' +
        hr.aW +
        ', ' +
        rp.name +
        ' ' +
        hr.bW +
        ', en ' +
        hr.total +
        ' cruces en ' +
        gname
      : meName + ' y ' + rp.name + ' todavía no se cruzaron en ' + gname,
    barAria: meName + ' ' + hr.aPct + ' por ciento, ' + rp.name + ' ' + hr.bPct + ' por ciento',
    together: hr.together.n
      ? 'Como dupla: ' + hr.together.n + ' juntos, ' + hr.together.w + ' ganados.'
      : 'Nunca jugaron como dupla en este grupo.',
    emptyText: hr.together.n
      ? 'Jugaron ' +
        hr.together.n +
        (hr.together.n === 1 ? ' partido' : ' partidos') +
        ' juntos, como dupla. Cuando estén en lados opuestos, acá aparece el historial.'
      : 'Todavía no compartieron cancha en ' +
        gname +
        '. Cuando jueguen en lados opuestos, acá aparece el historial.',
    recent: hr.meetings.slice(0, 5).map((x) => {
      const m = x.m;
      const sd = sideOf(m, me);
      const mine = sd === 'A' ? m.teamA : m.teamB;
      const oth = sd === 'A' ? m.teamB : m.teamA;
      const partner = mine.filter((y) => y !== me)[0];
      const who = x.aWon ? meName : rp.name;
      return {
        matchId: m.id,
        who,
        meWon: x.aWon,
        pairs: 'Con ' + c.pl(partner).name + ' vs ' + c.names(oth),
        date: fmtShort(m.date),
        score: c.scoreFor(m, sd),
        aria: 'Ganó ' + who + ', ' + fmtShort(m.date) + ', ' + c.scoreFor(m, sd) + '. Ver detalle.',
      };
    }),
    share: {
      kicker: 'Cara a cara · ' + meName + ' vs ' + rp.name,
      big: score,
      line: hl.title,
      text: meName + ' vs ' + rp.name + ': ' + score + ' en ' + gname + '. ' + hl.title + ' PUNTO.',
    },
  };
}

/** Grupo inicial del cara a cara: el primero donde están los dos (prototipo: init). */
export function defaultH2HGroup(c: Ctx, rival: PlayerId): GroupId | null {
  const hit = c.groups.find(
    (g) => g.memberIds.indexOf(rival) >= 0 && g.memberIds.indexOf(c.me) >= 0,
  );
  return hit ? hit.id : (c.groups[0]?.id ?? null);
}
