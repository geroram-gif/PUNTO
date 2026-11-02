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
import { AppState } from 'react-native';

import type { Backend } from '@/lib/backend';
import type { GroupId, ISODate, MatchId, PlayerId } from '@/lib/stats';
import type { JoinPreview, ProfileInput } from '@/lib/supabase/api';
import type { AuthSession } from '@/lib/supabase/auth';
import { NETWORK_MESSAGE, RemoteError, toRemoteError } from '@/lib/supabase/errors';

import { defaultDemoConfig, demoConfigFromEnv, type DemoConfig } from './config';
import type { Draft } from './draft';
import { initialState, reducer, remoteInitialState, type PuntoState } from './state';

const TOAST_MS = 3200;
/** Con la app volviendo al primer plano, no refrescar si se hizo hace menos de esto. */
const REFRESH_MIN_MS = 20000;

export interface PuntoActions {
  // Sesión (solo con cuenta)
  sendCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
  saveProfile(input: ProfileInput): Promise<void>;
  requestAccountDeletion(): Promise<void>;
  /** Vuelve a leer todo del servidor (no hace nada en la demo). */
  refresh(): Promise<void>;
  // Grupos
  selectGroup(groupId: GroupId): void;
  createGroup(name: string, color: string): Promise<GroupId>;
  getInvite(groupId: GroupId): Promise<string>;
  rotateInvite(groupId: GroupId): Promise<string>;
  previewInvite(code: string): Promise<JoinPreview>;
  requestJoin(code: string): Promise<{ status: 'pending' | 'member'; groupId: GroupId }>;
  decideJoin(requestId: string, approve: boolean): Promise<void>;
  addGuest(groupId: GroupId, name: string): Promise<PlayerId>;
  // Partidos
  /** Guarda un partido nuevo y devuelve su id. Falla (sin perder el borrador) si no se pudo. */
  addMatch(draft: Draft): Promise<MatchId>;
  editMatch(id: MatchId, draft: Draft): Promise<void>;
  deleteMatch(id: MatchId): Promise<void>;
  openMatch(id: MatchId): void;
  openDelete(id: MatchId): void;
  closeSheet(): void;
  showToast(message: string): void;
}

interface StoreValue {
  state: PuntoState;
  config: DemoConfig;
  /** Con cuenta (Supabase) o demo. */
  isRemote: boolean;
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

/** Día de hoy en la zona del teléfono (YYYY-MM-DD). */
export function localToday(d = new Date()): ISODate {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Store de la app (Context + reducer). Los partidos son la única fuente: todas las cifras se
 * recalculan en los view-models a partir de `state.matches`.
 *
 * - Sin `backend`: modo demo, datos del prototipo en memoria.
 * - Con `backend`: ingreso por email y datos en Supabase. Cada cambio va al servidor (que valida
 *   permisos y datos) y después se vuelve a leer todo, así lo que se ve es siempre lo guardado.
 */
export function PuntoProvider({
  config = defaultDemoConfig,
  backend = {},
  children,
}: {
  config?: DemoConfig;
  backend?: Backend;
  children: ReactNode;
}) {
  const { remote, auth } = backend;
  const isRemote = !!remote && !!auth;
  const [state, dispatch] = useReducer(reducer, config, (c) =>
    isRemote ? remoteInitialState() : initialState(c),
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Ids nuevos de la demo: «n1», «g2»… (un solo contador, como el prototipo). */
  const counter = useRef(1);
  const failedOnce = useRef(false);
  const session = useRef<AuthSession | null>(null);
  const loadSeq = useRef(0);
  const lastLoad = useRef(0);

  // Demo: esqueleto de carga simulado.
  useEffect(() => {
    if (isRemote || !state.loading) return;
    const t = setTimeout(() => dispatch({ type: 'loaded' }), config.loadingMs);
    return () => clearTimeout(t);
    // Solo al montar: la carga simulada ocurre una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const load = useCallback(async () => {
    if (!remote || !session.current) return;
    const mine = ++loadSeq.current;
    try {
      const snapshot = await remote.load();
      if (mine !== loadSeq.current) return; // llegó una carga más nueva
      lastLoad.current = Date.now();
      dispatch({
        type: 'hydrate',
        snapshot,
        email: session.current?.email ?? '',
        today: localToday(),
      });
    } catch (e) {
      if (mine === loadSeq.current)
        dispatch({ type: 'loadFailed', message: toRemoteError(e).message });
      throw e;
    }
  }, [remote]);

  // Con cuenta: seguir la sesión. Al entrar se cargan los datos; al salir se borran de memoria.
  useEffect(() => {
    if (!remote || !auth) return;
    let alive = true;
    const apply = async (s: AuthSession | null) => {
      if (!alive) return;
      session.current = s;
      if (!s) {
        loadSeq.current++;
        dispatch({ type: 'signedOut' });
        return;
      }
      await load().catch(() => {});
    };
    auth.getSession().then(apply, () => apply(null));
    const off = auth.onChange(apply);
    return () => {
      alive = false;
      off();
    };
  }, [remote, auth, load]);

  // Al volver a la app, ponerse al día con lo que cargaron los demás.
  useEffect(() => {
    if (!isRemote) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && session.current && Date.now() - lastLoad.current > REFRESH_MIN_MS)
        load().catch(() => {});
    });
    return () => sub.remove();
  }, [isRemote, load]);

  const showToast = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    dispatch({ type: 'toast', message });
    toastTimer.current = setTimeout(() => dispatch({ type: 'toast', message: '' }), TOAST_MS);
  }, []);

  const actions = useMemo<PuntoActions>(() => {
    const needRemote = () => {
      if (!remote || !auth) throw new RemoteError('Esto necesita una cuenta de PUNTO.', 'unknown');
      return { remote, auth };
    };
    /** Demo: demora de guardado y, si se pidió, un primer error de red que conserva lo cargado. */
    const demoSave = async () => {
      await wait(config.saveMs);
      if (config.netError && !failedOnce.current) {
        failedOnce.current = true;
        throw new RemoteError(NETWORK_MESSAGE, 'network');
      }
    };
    /** Después de un cambio exitoso en el servidor: releer. Si falla la lectura, el cambio igual quedó. */
    const reload = () => load().catch(() => {});

    return {
      sendCode: (email) => needRemote().auth.sendCode(email),
      verifyCode: (email, code) => needRemote().auth.verifyCode(email, code),
      signOut: async () => {
        await needRemote().auth.signOut();
      },
      saveProfile: async (input) => {
        await needRemote().remote.saveProfile(input);
        await load();
      },
      requestAccountDeletion: async () => {
        await needRemote().remote.requestAccountDeletion();
        await reload();
      },
      refresh: async () => {
        if (remote) await load();
      },
      selectGroup: (groupId) => dispatch({ type: 'selectGroup', groupId }),
      createGroup: async (name, color) => {
        const id = await needRemote().remote.createGroup(name, color);
        await reload();
        dispatch({ type: 'selectGroup', groupId: id });
        return id;
      },
      getInvite: (groupId) => needRemote().remote.getInvite(groupId),
      rotateInvite: (groupId) => needRemote().remote.rotateInvite(groupId),
      previewInvite: (code) => needRemote().remote.previewInvite(code),
      requestJoin: (code) => needRemote().remote.requestJoin(code),
      decideJoin: async (requestId, approve) => {
        await needRemote().remote.decideJoin(requestId, approve);
        await reload();
      },
      addGuest: async (groupId, name) => {
        if (remote) {
          const id = await remote.addGuest(groupId, name);
          await reload();
          return id;
        }
        const id = 'g' + counter.current++;
        dispatch({ type: 'addGuest', id, groupId, name });
        return id;
      },
      addMatch: async (draft) => {
        if (remote) {
          const id = await remote.recordMatch(draft);
          dispatch({ type: 'selectGroup', groupId: draft.groupId });
          await reload();
          dispatch({ type: 'setResult', id });
          return id;
        }
        await demoSave();
        const id = 'n' + counter.current++;
        dispatch({ type: 'addMatch', id, draft });
        return id;
      },
      editMatch: async (id, draft) => {
        if (remote) {
          await remote.updateMatch(id, draft);
          await reload();
          return;
        }
        await demoSave();
        dispatch({ type: 'editMatch', id, draft });
      },
      deleteMatch: async (id) => {
        if (remote) {
          await remote.deleteMatch(id);
          await reload();
          dispatch({ type: 'closeSheet' });
          return;
        }
        dispatch({ type: 'deleteMatch', id });
      },
      openMatch: (matchId) => dispatch({ type: 'openSheet', mode: 'match', matchId }),
      openDelete: (matchId) => dispatch({ type: 'openSheet', mode: 'delete', matchId }),
      closeSheet: () => dispatch({ type: 'closeSheet' }),
      showToast,
    };
  }, [remote, auth, config.saveMs, config.netError, load, showToast]);

  const value = useMemo(
    () => ({ state, config, isRemote, me: state.me, today: state.today, actions }),
    [state, config, isRemote, actions],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function usePunto(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('usePunto necesita <PuntoProvider>');
  return v;
}
