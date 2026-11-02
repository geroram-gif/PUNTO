import {
  emptyGroup,
  groups as seedGroups,
  matches as seedMatches,
  players as seedPlayers,
  today as seedToday,
} from '@/lib/demo/seed';
import type { Group, GroupId, ISODate, Match, MatchId, Player, PlayerId } from '@/lib/stats';
import type { PendingRequest, Snapshot } from '@/lib/supabase/snapshot';

import type { DemoConfig } from './config';
import { matchFromDraft, type Draft } from './draft';

export const ME: PlayerId = 'tomi';

export type SheetMode = 'match' | 'delete';

/**
 * Dónde está la sesión: cargando, sin ingresar, con el perfil por completar, lista para usar,
 * o con un error de carga (reintentable). En modo demo siempre está lista.
 */
export type Phase = 'loading' | 'signedOut' | 'needsProfile' | 'ready' | 'error';

export interface PuntoState {
  /** Mi jugador. */
  me: PlayerId;
  /** «Hoy»: fijo en la demo, el día real con cuenta. */
  today: ISODate;
  phase: Phase;
  email: string;
  loadError: string;
  deletionRequested: boolean;
  pendingRequests: PendingRequest[];
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
    me: ME,
    today: seedToday,
    phase: 'ready',
    email: '',
    loadError: '',
    deletionRequested: false,
    pendingRequests: [],
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

/** Estado de una app con cuenta antes de saber quién es el usuario. */
export function remoteInitialState(): PuntoState {
  return {
    ...initialState({ scenario: 'usuario-nuevo', loading: true }),
    me: '',
    phase: 'loading',
  };
}

export type Action =
  | { type: 'loaded' }
  | { type: 'hydrate'; snapshot: Snapshot; email: string; today: ISODate }
  | { type: 'signedOut' }
  | { type: 'loadFailed'; message: string }
  | { type: 'setResult'; id: MatchId | null }
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
    case 'hydrate': {
      const { snapshot: n } = a;
      return {
        ...s,
        me: n.me,
        today: a.today,
        email: a.email,
        phase: n.onboarded ? 'ready' : 'needsProfile',
        loading: false,
        loadError: '',
        deletionRequested: n.deletionRequested,
        pendingRequests: n.pendingRequests,
        players: n.players,
        groups: n.groups,
        matches: n.matches,
        groupId: n.groups.some((g) => g.id === s.groupId) ? s.groupId : (n.groups[0]?.id ?? null),
        resultId: n.matches.some((m) => m.id === s.resultId) ? s.resultId : null,
        sheet: s.sheet && n.matches.some((m) => m.id === s.sheet?.matchId) ? s.sheet : null,
      };
    }
    case 'signedOut':
      return { ...remoteInitialState(), phase: 'signedOut', loading: false };
    case 'loadFailed':
      return { ...s, phase: 'error', loading: false, loadError: a.message };
    case 'setResult':
      return { ...s, resultId: a.id };
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
        createdBy: s.me,
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
