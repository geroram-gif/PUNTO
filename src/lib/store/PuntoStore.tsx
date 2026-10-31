import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';

import { today as seedToday } from '@/lib/demo/seed';
import type { GroupId, ISODate, MatchId, PlayerId } from '@/lib/stats';

import { defaultDemoConfig, demoConfigFromEnv, type DemoConfig } from './config';
import type { Draft } from './draft';
import { initialState, ME, reducer, type PuntoState } from './state';

const TOAST_MS = 3200;

export interface PuntoActions {
  selectGroup(groupId: GroupId): void;
  /** Guarda un partido nuevo y devuelve su id. */
  addMatch(draft: Draft): MatchId;
  editMatch(id: MatchId, draft: Draft): void;
  deleteMatch(id: MatchId): void;
  /** Suma un invitado al grupo y devuelve su id. */
  addGuest(groupId: GroupId, name: string): PlayerId;
  openMatch(id: MatchId): void;
  openDelete(id: MatchId): void;
  closeSheet(): void;
  showToast(message: string): void;
}

interface StoreValue {
  state: PuntoState;
  config: DemoConfig;
  me: PlayerId;
  today: ISODate;
  actions: PuntoActions;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Variables públicas de Expo: se leen una por una para que el bundler las inyecte. */
export function envDemoConfig(): DemoConfig {
  return demoConfigFromEnv({
    EXPO_PUBLIC_DEMO_ESCENARIO: process.env.EXPO_PUBLIC_DEMO_ESCENARIO,
    EXPO_PUBLIC_DEMO_ERROR_DE_RED: process.env.EXPO_PUBLIC_DEMO_ERROR_DE_RED,
    EXPO_PUBLIC_DEMO_NOMBRES_LARGOS: process.env.EXPO_PUBLIC_DEMO_NOMBRES_LARGOS,
    EXPO_PUBLIC_DEMO_CARGA: process.env.EXPO_PUBLIC_DEMO_CARGA,
  });
}

/**
 * Store local de la demo (Context + reducer). Los partidos son la única fuente:
 * todas las cifras se recalculan en los view-models a partir de `state.matches`.
 * En la Fase 3 se reemplaza por queries a Supabase con la misma interfaz de acciones.
 */
export function PuntoProvider({
  config = defaultDemoConfig,
  children,
}: {
  config?: DemoConfig;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, config, initialState);
  /** Ids nuevos: «n1», «g2»… (un solo contador, como el prototipo). Solo se usa en handlers. */
  const counter = useRef(1);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!state.loading) return;
    const t = setTimeout(() => dispatch({ type: 'loaded' }), config.loadingMs);
    return () => clearTimeout(t);
    // Solo al montar: la carga simulada ocurre una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    dispatch({ type: 'toast', message });
    toastTimer.current = setTimeout(() => dispatch({ type: 'toast', message: '' }), TOAST_MS);
  }, []);

  const actions = useMemo<PuntoActions>(
    () => ({
      selectGroup: (groupId) => dispatch({ type: 'selectGroup', groupId }),
      addMatch: (draft) => {
        const id = 'n' + counter.current++;
        dispatch({ type: 'addMatch', id, draft });
        return id;
      },
      editMatch: (id, draft) => dispatch({ type: 'editMatch', id, draft }),
      deleteMatch: (id) => dispatch({ type: 'deleteMatch', id }),
      addGuest: (groupId, name) => {
        const id = 'g' + counter.current++;
        dispatch({ type: 'addGuest', id, groupId, name });
        return id;
      },
      openMatch: (matchId) => dispatch({ type: 'openSheet', mode: 'match', matchId }),
      openDelete: (matchId) => dispatch({ type: 'openSheet', mode: 'delete', matchId }),
      closeSheet: () => dispatch({ type: 'closeSheet' }),
      showToast,
    }),
    [showToast],
  );

  const value = useMemo(
    () => ({ state, config, me: ME, today: seedToday, actions }),
    [state, config, actions],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function usePunto(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('usePunto necesita <PuntoProvider>');
  return v;
}
