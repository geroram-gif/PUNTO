import {
  duoStats,
  groupRanking,
  h2h,
  MIN_RANK,
  newestFirst,
  partnersAndRivals,
  playerStats,
  rankOf,
  topDuo,
  type GroupId,
} from '@/lib/stats';
import { colors, palette } from '@/theme/colors';

import type { AvatarVM, Ctx, MatchCardVM } from '../shared/ctx';

export type GroupTab = 'resumen' | 'ranking' | 'partidos' | 'duplas';

export const GROUP_TABS: readonly [GroupTab, string][] = [
  ['resumen', 'Resumen'],
  ['ranking', 'Ranking'],
  ['partidos', 'Partidos'],
  ['duplas', 'Duplas'],
];

export interface RankingRowVM {
  id: string;
  pos: string;
  isFirst: boolean;
  name: string;
  guest: boolean;
  av: AvatarVM;
  pj: number;
  g: number;
  pct: number;
  me: boolean;
  aria: string;
}

export interface ProvisionalRowVM {
  id: string;
  name: string;
  guest: boolean;
  me: boolean;
  av: AvatarVM;
  meta: string;
  left: string;
  played: number;
  dotsAria: string;
  aria: string;
}

export interface DuoVM {
  pairId: string;
  a: AvatarVM;
  b: AvatarVM;
  names: string;
  pct: number;
  meta: string;
  top: boolean;
}

export interface GroupVM {
  id: GroupId;
  name: string;
  ini: string;
  bg: string;
  meta: string;
  isEmpty: boolean;
  stack: AvatarVM[];
  more: string | null;
  guestsLabel: string;
  membersAria: string;
  emptyText: string;
  place: { size: number; big: string; label: string; line1: string; line2: string } | null;
  duo: { a: AvatarVM; b: AvatarVM; text: string; pct: number } | null;
  rivalry: { rivalId: string; text: string; score: string } | null;
  last: MatchCardVM | null;
  seeAll: string;
  ranking: RankingRowVM[];
  provisional: ProvisionalRowVM[];
  /** En un grupo vacío se muestra igual la lista de provisorios (todos). */
  showProvisional: boolean;
  matches: MatchCardVM[];
  matchesLabel: string;
  duos: DuoVM[];
  provDuos: { pairId: string; names: string; meta: string }[];
  provDuosTotal: number;
  provMoreLabel: string;
}

/** Grupo (prototipo: «02 GRUPO»). `showAllDuos` expande las duplas provisorias. */
export function groupVM(c: Ctx, gid: GroupId | null, showAllDuos = false): GroupVM | null {
  const g = c.gById(gid);
  if (!g) return null;
  const { me } = c;
  const ms = c.gm(g.id);
  const isEmpty = ms.length === 0;
  const rank = groupRanking(ms, g, c.players);
  const guests = g.memberIds.filter((i) => c.pl(i).isGuest).length;
  const n = g.memberIds.length;
  const vm: GroupVM = {
    id: g.id,
    name: c.gname(g),
    ini: g.initials,
    bg: g.color,
    isEmpty,
    meta:
      n +
      ' miembros · ' +
      (isEmpty ? 'sin partidos todavía' : ms.length + (ms.length === 1 ? ' partido' : ' partidos')),
    stack: g.memberIds.slice(0, 5).map((i) => c.av(i, true)),
    more: n > 5 ? '+' + (n - 5) : null,
    guestsLabel: guests ? guests + (guests === 1 ? ' invitado' : ' invitados') : 'sin invitados',
    membersAria:
      n +
      ' miembros: ' +
      (n - guests) +
      ' con cuenta y ' +
      guests +
      (guests === 1 ? ' invitado' : ' invitados'),
    emptyText:
      'Ya son ' +
      n +
      '. Cuando carguen el primer partido aparecen el ranking, las duplas y las rivalidades.',
    place: null,
    duo: null,
    rivalry: null,
    last: null,
    seeAll: ms.length > 1 ? 'Ver los ' + ms.length : 'Ver partidos',
    ranking: [],
    provisional: [],
    showProvisional: false,
    matches: [],
    matchesLabel:
      ms.length +
      (ms.length === 1 ? ' partido' : ' partidos') +
      ' en el grupo. Tocá uno para ver el detalle o corregirlo.',
    duos: [],
    provDuos: [],
    provDuosTotal: 0,
    provMoreLabel: '',
  };

  const myR = rankOf(ms, g, c.players, me);
  const myS = playerStats(ms, me);
  const leader = rank.qualified[0];
  if (!isEmpty && myS.pj > 0) {
    if (myR)
      vm.place = {
        size: 52,
        big: '#' + myR.pos,
        label: 'Tu lugar en el grupo',
        line1: myS.pct + '% · ' + myS.g + ' ganados de ' + myS.pj,
        line2:
          leader.id === me
            ? myR.row.tied
              ? 'Compartís el primer puesto.'
              : 'Estás primero.'
            : c.pl(leader.id).name + ' está 1° con ' + leader.pct + '%',
      };
    else {
      const left = MIN_RANK - myS.pj;
      vm.place = {
        size: 44,
        big: myS.pj + '/5',
        label: 'Todavía sin puesto',
        line1: myS.g + ' ganados de ' + myS.pj,
        line2:
          'Te ' +
          (left === 1 ? 'falta 1 partido' : 'faltan ' + left + ' partidos') +
          ' para entrar al ranking.',
      };
    }
  }
  const td = topDuo(ms);
  if (td) {
    const ids = c.meFirst(td.ids);
    vm.duo = {
      a: c.av(ids[0], false),
      b: c.av(ids[1], false),
      text: c.names(td.ids) + ' · ' + td.w + ' ganados de ' + td.n,
      pct: td.pct,
    };
  }
  const gr = partnersAndRivals(ms, me).rivals.find((r) => r.n >= 3);
  if (gr) {
    const gh = h2h(ms, me, gr.id);
    vm.rivalry = {
      rivalId: gr.id,
      text: c.pl(me).name + ' vs ' + c.pl(gr.id).name + ' · ' + gh.total + ' cruces directos',
      score: gh.aW + '-' + gh.bW,
    };
  }
  const lastG = newestFirst(ms)[0];
  if (lastG) vm.last = c.card(lastG);

  vm.ranking = rank.qualified.map((r) => {
    const isMe = r.id === me;
    const p = c.pl(r.id);
    return {
      id: r.id,
      pos: (r.tied ? '=' : '') + r.pos,
      isFirst: r.pos === 1,
      name: p.name,
      guest: p.isGuest,
      av: c.av(r.id, isMe),
      pj: r.pj,
      g: r.g,
      pct: r.pct,
      me: isMe,
      aria:
        (isMe ? 'Vos, ' : '') +
        p.name +
        ', puesto ' +
        r.pos +
        (r.tied ? ' compartido' : '') +
        ', ' +
        r.pct +
        ' por ciento, ' +
        r.g +
        ' ganados de ' +
        r.pj +
        (isMe ? '' : '. Ver cara a cara.'),
    };
  });
  vm.provisional = rank.provisional.map((r) => {
    const isMe = r.id === me;
    const p = c.pl(r.id);
    const left = MIN_RANK - r.pj;
    return {
      id: r.id,
      name: p.name,
      guest: p.isGuest,
      me: isMe,
      av: c.av(r.id, false),
      meta: r.pj
        ? r.pj +
          (r.pj === 1 ? ' partido' : ' partidos') +
          ' · ' +
          r.g +
          (r.g === 1 ? ' ganado' : ' ganados')
        : 'Todavía no jugó',
      left: 'Falta' + (left === 1 ? ' 1' : 'n ' + left),
      played: r.pj,
      dotsAria: r.pj + ' de 5 partidos jugados',
      aria:
        p.name +
        (p.isGuest ? ', invitado' : '') +
        ', provisorio, ' +
        r.pj +
        ' de 5 partidos' +
        (isMe ? '' : '. Ver cara a cara.'),
    };
  });
  vm.showProvisional = !isEmpty ? rank.provisional.length > 0 : true;
  vm.matches = newestFirst(ms).map(c.card);

  const ds = duoStats(ms);
  vm.duos = ds.qualified.map((d, i) => {
    const ids = c.meFirst(d.ids);
    const top = i === 0;
    return {
      pairId: d.ids.join('|'),
      a: c.av(ids[0], false),
      b: c.av(ids[1], false),
      names: c.names(d.ids),
      pct: d.pct,
      meta:
        d.n + ' juntos · ' + d.w + ' G · ' + (d.n - d.w) + ' P' + (top ? ' · la del momento' : ''),
      top,
    };
  });
  const provAll = ds.provisional.slice().sort((a, b) => b.n - a.n || b.w - a.w);
  vm.provDuosTotal = provAll.length;
  vm.provDuos = (showAllDuos ? provAll : provAll.slice(0, 3)).map((d) => ({
    pairId: d.ids.join('|'),
    names: c.names(d.ids),
    meta: d.n + ' juntos · ' + d.w + ' G · ' + (d.n - d.w) + ' P',
  }));
  vm.provMoreLabel = showAllDuos ? 'Ver menos' : 'Ver ' + (provAll.length - 3) + ' más';
  return vm;
}

/** Colores de una fila de ranking según sea «vos» o no (prototipo: rowVM). */
export function rankingRowColors(me: boolean) {
  return {
    rowBg: me ? palette.navy : 'transparent',
    fg: me ? colors.text.onDark : colors.text.onLight,
    sub: me ? colors.text.onDarkSecondary : colors.text.onLightSecondary,
    track: me ? palette.navyLine : palette.creamLine,
    fill: me ? palette.lime : palette.navy,
  };
}
