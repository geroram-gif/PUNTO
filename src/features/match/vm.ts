import { FORMAT_LABEL, fmtLong, playerStats, sideOf, type MatchId } from '@/lib/stats';

import { capitalize, type Ctx, type MatchCardVM } from '../shared/ctx';

export interface MatchSheetVM {
  card: MatchCardVM;
  meta: string;
  rows: { k: string; v: string }[];
  canEdit: boolean;
  permNote: string;
  del: { text: string; impact: string | null };
}

/** Hoja de detalle y confirmación de borrado (prototipo: sh.match / sh.del). */
export function matchSheetVM(c: Ctx, id: MatchId | null): MatchSheetVM | null {
  const sm = c.matches.find((m) => m.id === id);
  if (!sm) return null;
  const { me } = c;
  const smg = c.gById(sm.groupId)!;
  const card = c.card(sm);
  const isAdmin = smg.adminIds.indexOf(me) >= 0;
  const canEdit = isAdmin || sm.createdBy === me;
  const after = c.matches.filter((m) => m.id !== sm.id);
  const playedMe = !!sideOf(sm, me);
  const ib = playerStats(c.gm(sm.groupId), me);
  const ia = playerStats(
    after.filter((m) => m.groupId === sm.groupId),
    me,
  );
  const ga2 = playerStats(
    after.filter((m) => c.myGroups.some((x) => x.id === m.groupId)),
    me,
  );
  return {
    card,
    meta: capitalize(fmtLong(sm.date)) + ' · ' + c.gname(smg),
    rows: [
      { k: 'Formato', v: FORMAT_LABEL[sm.format] },
      { k: 'Cargado por', v: c.pl(sm.createdBy).name + (sm.edited ? ' · corregido' : '') },
      { k: 'Pareja A', v: c.names(sm.teamA) },
      { k: 'Pareja B', v: c.names(sm.teamB) },
    ],
    canEdit,
    permNote: canEdit
      ? isAdmin
        ? 'Sos admin del grupo: podés corregirlo o borrarlo. Las estadísticas se recalculan solas.'
        : 'Lo cargaste vos, así que podés corregirlo. Las estadísticas se recalculan solas.'
      : 'Solo quien lo cargó (' +
        c.pl(sm.createdBy).name +
        ') o un admin del grupo puede corregirlo.',
    del: {
      text:
        card.top +
        ' ' +
        card.topSets.map((v, i) => v + '-' + card.botSets[i]).join(' ') +
        ' a ' +
        card.bot +
        ', ' +
        fmtLong(sm.date) +
        '. Se recalculan el ranking, las rachas, las duplas y los cara a cara de los 4 jugadores. No se puede deshacer.',
      impact: playedMe
        ? 'En ' +
          c.gname(smg) +
          ' pasarías de ' +
          ib.pct +
          '% a ' +
          (ia.pj ? ia.pct + '%' : 'sin partidos') +
          '. Tu racha actual quedaría en ' +
          (ga2.streak.n
            ? ga2.streak.n + (ga2.streak.type === 'W' ? ' ganados' : ' perdidos')
            : 'cero') +
          '.'
        : null,
    },
  };
}

/** Link de invitación de prueba del prototipo. */
export const inviteLink = (groupId: string) => 'punto.app/i/demo-' + groupId;
