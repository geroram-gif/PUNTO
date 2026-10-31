import {
  emptyGroup,
  groups as seedGroups,
  matches as seedMatches,
  players as seedPlayers,
} from '@/lib/demo/seed';
import type { Group, GroupId, Match, MatchId, Player, PlayerId } from '@/lib/stats';

import type { DemoConfig } from './config';
import { matchFromDraft, type Draft } from './draft';

export const ME: PlayerId = 'tomi';

export type SheetMode = 'match' | 'delete';

export interface PuntoState {
  players: Record<PlayerId, Player>;
  groups: Group[];
  matches: Match[];
  /** Grupo abierto en la pestaña Grupos. */
  groupId: GroupId | null;
  /** Último partido cargado (lo destaca la lista y lo muestra Resultado). */
  resultId: MatchId | null;
  /** Hoja de detalle de partido (se abre desde cualquier pantalla). */
  sheet: { mode: SheetMode; matchId: MatchId } | null;
  toast: string;
  loading: boolean;
}

export function initialState(config: Pick<DemoConfig, 'scenario' | 'loading'>): PuntoState {
  let groups = seedGroups.map((g) => ({
    ...g,
    adminIds: [...g.adminIds],
    memberIds: [...g.memberIds],
  }));
  let matches = seedMatches.map((m) => ({ ...m }));
  if (config.scenario === 'usuario-nuevo') {
    groups = [];
    matches = [];
  }
  if (config.scenario === 'grupo-sin-partidos')
    groups.unshift({
      ...emptyGroup,
      adminIds: [...emptyGroup.adminIds],
      memberIds: [...emptyGroup.memberIds],
    });
  const players: Record<PlayerId, Player> = {};
  for (const k of Object.keys(seedPlayers)) players[k] = { ...seedPlayers[k] };
  return {
    players,
    groups,
    matches,
    groupId: groups[0]?.id ?? null,
    resultId: null,
    sheet: null,
    toast: '',
    loading: config.loading,
  };
}

export type Action =
  | { type: 'loaded' }
  | { type: 'selectGroup'; groupId: GroupId }
  | { type: 'addMatch'; id: MatchId; draft: Draft }
  | { type: 'editMatch'; id: MatchId; draft: Draft }
  | { type: 'deleteMatch'; id: MatchId }
  | { type: 'addGuest'; id: PlayerId; groupId: GroupId; name: string }
  | { type: 'openSheet'; mode: SheetMode; matchId: MatchId }
  | { type: 'closeSheet' }
  | { type: 'toast'; message: string };

export function reducer(s: PuntoState, a: Action): PuntoState {
  switch (a.type) {
    case 'loaded':
      return { ...s, loading: false };
    case 'selectGroup':
      return { ...s, groupId: a.groupId };
    case 'addMatch': {
      const data = matchFromDraft(a.draft);
      if (!data) return s;
      const maxSeq = s.matches.reduce((acc, m) => Math.max(acc, m.seq || 0), 0);
      const nm: Match = {
        id: a.id,
        groupId: a.draft.groupId,
        seq: maxSeq + 1,
        createdBy: ME,
        edited: false,
        ...data,
      };
      return {
        ...s,
        matches: [...s.matches, nm],
        resultId: nm.id,
        groupId: a.draft.groupId,
        sheet: null,
      };
    }
    case 'editMatch': {
      const data = matchFromDraft(a.draft);
      if (!data) return s;
      return {
        ...s,
        matches: s.matches.map((m) => (m.id === a.id ? { ...m, ...data, edited: true } : m)),
        sheet: null,
      };
    }
    case 'deleteMatch':
      return { ...s, matches: s.matches.filter((m) => m.id !== a.id), sheet: null };
    case 'addGuest': {
      const id = a.id;
      const name = a.name.trim();
      return {
        ...s,
        players: {
          ...s.players,
          [id]: {
            id,
            name,
            fullName: name,
            initials: name.slice(0, 2).toUpperCase(),
            avatarColor: 'transparent',
            isGuest: true,
          },
        },
        groups: s.groups.map((g) =>
          g.id === a.groupId ? { ...g, memberIds: [...g.memberIds, id] } : g,
        ),
      };
    }
    case 'openSheet':
      return { ...s, sheet: { mode: a.mode, matchId: a.matchId } };
    case 'closeSheet':
      return { ...s, sheet: null };
    case 'toast':
      return { ...s, toast: a.message };
  }
}
