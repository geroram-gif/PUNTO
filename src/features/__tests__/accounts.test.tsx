/**
 * Flujos con cuenta contra el esquema y las RPC reales (Postgres embebido, mismas migraciones que
 * Supabase): ingreso por código, perfil, grupo, invitación, primer partido y estadísticas
 * persistentes. Lo único simulado es el envío del mail (código fijo 123456).
 */
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import type { Backend } from '@/lib/backend';
import { blankDraft } from '@/lib/store';
import { createRemoteApi, type RemoteApi } from '@/lib/supabase/api';
import type { AuthApi, AuthSession } from '@/lib/supabase/auth';
import { RemoteError } from '@/lib/supabase/errors';

import { Db, rpcClient, u } from '../../../supabase/tests/harness';

let mockBackend: Backend = {};
jest.mock('@/lib/backend', () => ({ createBackend: () => mockBackend }));

const APP = './app';
const CODE = '123456';
let db: Db;
let user: string | null = null;
let sentTo: string[] = [];
let failNext: { fn: string; message: string } | null = null;
let remote: RemoteApi;

beforeAll(async () => {
  db = new Db();
  await db.migrate();
}, 60000);
afterAll(() => db.close());

/** Auth de mentira: el mail no se manda; el código correcto es siempre 123456. */
function fakeAuth(): AuthApi {
  const listeners = new Set<(s: AuthSession | null) => void>();
  let session: AuthSession | null = null;
  const set = (s: AuthSession | null) => {
    session = s;
    user = s?.userId ?? null;
    listeners.forEach((l) => l(s));
  };
  return {
    getSession: async () => session,
    onChange: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    sendCode: async (email) => {
      sentTo.push(email);
    },
    verifyCode: async (email, code) => {
      if (code.replace(/\D/g, '') !== CODE)
        throw new RemoteError('Ese código no es válido o ya venció. Pedí uno nuevo.', 'server');
      await db.admin();
      const found = await db.query<{ id: string }>('select id from auth.users where email = $1', [
        email.toLowerCase(),
      ]);
      let id = found[0]?.id;
      if (!id) {
        id = u(900 + sentTo.length);
        await db.query('insert into auth.users (id, email) values ($1, $2)', [
          id,
          email.toLowerCase(),
        ]);
      }
      set({ userId: id, email: email.toLowerCase() });
    },
    signOut: async () => set(null),
    // Atajo de los tests: arrancar con la sesión ya iniciada.
    ...({ signInAs: (s: AuthSession) => set(s) } as object),
  };
}

let auth: AuthApi & { signInAs?: (s: AuthSession) => void };
function boot(signedInAs?: { userId: string; email: string }) {
  auth = fakeAuth() as typeof auth;
  if (signedInAs) auth.signInAs?.(signedInAs);
  const client = rpcClient(db, () => user);
  const guarded = {
    rpc: async (fn: string, args?: Record<string, unknown>) => {
      if (failNext && failNext.fn === fn) {
        const { message } = failNext;
        failNext = null;
        return { data: null, error: { message } };
      }
      return client.rpc(fn, args);
    },
  };
  remote = createRemoteApi(guarded);
  mockBackend = { remote, auth };
}

beforeEach(async () => {
  await db.begin();
  user = null;
  sentTo = [];
  failNext = null;
});
afterEach(async () => {
  await db.rollback();
});

const press = (name: string | RegExp, role: 'button' | 'tab' | 'radio' = 'button') =>
  fireEvent.press(screen.getByRole(role, { name }));
const type = (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);
/** Textos que hay en pantalla (para que un fallo diga qué se estaba viendo). */
function visibleTexts(): string[] {
  const out: string[] = [];
  const walk = (n: unknown) => {
    if (!n || typeof n !== 'object') return;
    const node = n as { type?: string; children?: unknown[] };
    if (node.type === 'Text')
      out.push((node.children ?? []).map((c) => (typeof c === 'string' ? c : '')).join(''));
    (node.children ?? []).forEach(walk);
  };
  const tree = screen.toJSON();
  (Array.isArray(tree) ? tree : [tree]).forEach(walk);
  return out.filter(Boolean);
}
const see = async (text: string | RegExp) => {
  try {
    await waitFor(() => expect(screen.getAllByText(text)[0]).toBeVisible(), { timeout: 25000 });
  } catch (e) {
    throw new Error(`No se vio ${String(text)}. En pantalla: ${visibleTexts().join(' | ')}`, {
      cause: e,
    });
  }
};

async function makeUser(n: number, name: string) {
  await db.admin();
  await db.query('insert into auth.users (id, email) values ($1, $2)', [
    u(n),
    `${name.toLowerCase()}@punto.test`,
  ]);
  await db.as(u(n));
  await db.rpc('update_profile', {
    p_display_name: name,
    p_full_name: `${name} Test`,
    p_avatar_color: '#DCEB82',
  });
  const [p] = await db.query<{ id: string }>(
    'select id from public.players where profile_id = $1',
    [u(n)],
  );
  user = null;
  return { id: p.id, session: { userId: u(n), email: `${name.toLowerCase()}@punto.test` } };
}

describe('usuario nuevo', () => {
  it('ingresa con un código, arma su perfil, crea un grupo, carga su primer partido y las estadísticas quedan guardadas', async () => {
    boot();
    await renderRouter(APP, { initialUrl: '/' });

    // 1. Ingreso por mail y código.
    await see('Cada partido cuenta.');
    await type('Tu mail', 'esto-no-es-un-mail');
    await press('Mandame el código');
    await see('Escribí un mail válido, por ejemplo vos@mail.com.');
    await type('Tu mail', 'Nico@Punto.test');
    await press('Mandame el código');
    await see(/Te mandamos un código de 6 dígitos a nico@punto.test/);
    expect(sentTo).toEqual(['Nico@Punto.test']);
    await type('Código', '000000');
    await press('Entrar');
    await see('Ese código no es válido o ya venció. Pedí uno nuevo.');
    await type('Código', '123 456');
    await press('Entrar');

    // 2. Perfil (obligatorio antes de usar la app).
    await see('Armá tu perfil.');
    await press('Guardar y seguir');
    await see('Escribí cómo te dicen.');
    await type('¿Cómo te dicen?', 'Nico');
    await type('Nombre completo', 'Nicolás Ruiz');
    await press('Lima', 'radio');
    await press('Guardar y seguir');

    // 3. Inicio vacío: sin cifras inventadas.
    await see('Hola, Nico.');
    await see('Tu historia arranca con el primer partido.');
    expect(screen.queryByText('Tu % de victorias')).toBeNull();

    // 4. Crear un grupo privado.
    await press('Crear un grupo');
    await see('Nuevo grupo');
    await press('Crear grupo');
    await see('Ponele un nombre al grupo.');
    await type('Nombre del grupo', 'Los del Jueves');
    await press('Crear grupo');
    await see('Grupo creado. Invitá a los tuyos con el botón Invitar.');
    await see('Los del Jueves');
    await see('1 miembros · sin partidos todavía');

    // 5. Invitación: código para compartir.
    await press('Invitar');
    await see(/^[0-9A-F]{4}(-[0-9A-F]{4}){3}$/);
    await see('No hay pedidos pendientes.');
    await press('Cerrar');

    // 6. Primer partido con tres invitados.
    await press(/^Partido: registrar un partido en Los del Jueves/);
    await see('Nuevo partido');
    await press('Nicolás Ruiz');
    for (const g of ['Fran', 'Lean', 'Mati']) {
      await press('Invitado');
      await type('Nombre del invitado', g);
      await press('Sumar invitado');
      await screen.findByRole(
        'button',
        { name: new RegExp(`^${g}, invitado`) },
        { timeout: 25000 },
      );
    }
    expect(
      screen.getByRole('button', { name: 'Fran, en Pareja A. Tocá para sacarlo.' }),
    ).toBeVisible();
    for (let i = 0; i < 6; i++) await press('Sumar un game a Nico y Fran en Set 1');
    for (let i = 0; i < 4; i++) await press('Sumar un game a Lean y Mati en Set 1');
    for (let i = 0; i < 6; i++) await press('Sumar un game a Nico y Fran en Set 2');
    for (let i = 0; i < 3; i++) await press('Sumar un game a Lean y Mati en Set 2');
    await see('Todo listo. Ganan Nico y Fran.');
    await press('Revisar partido');
    await press('Confirmar y guardar');

    // 7. Resultado con las cifras del servidor.
    await see('Partido cargado.');
    await see('Nico y Fran');
    await see('Tu % global: 0% → 100% · 1 partidos');
    await press('Ver el grupo');
    await see('4 miembros · 1 partido');
    await press('Perfil', 'tab');
    await see('100%');
    await see('1 PJ · 1 G · 100%');

    // 8. Todo quedó guardado en el servidor, con los invitados como jugadores sin cuenta.
    const snap = await remote.load();
    expect(snap.matches).toHaveLength(1);
    expect(
      Object.values(snap.players)
        .filter((p) => p.isGuest)
        .map((p) => p.name)
        .sort(),
    ).toEqual(['Fran', 'Lean', 'Mati']);
  }, 120000);

  it('los datos guardados siguen ahí: una app nueva con la misma sesión ve las mismas cifras', async () => {
    const nico = await makeUser(10, 'Nico');
    boot(nico.session);
    user = nico.session.userId;
    const group = await remote.createGroup('Los del Jueves', '#DCEB82');
    const guests = [];
    for (const g of ['Fran', 'Lean', 'Mati']) guests.push(await remote.addGuest(group, g));
    const draft = {
      ...blankDraft(group, '2026-10-31'),
      slots: [nico.id, guests[0], guests[1], guests[2]],
      sets: [
        [6, 4],
        [3, 6],
        [0, 0],
      ] as [number, number][],
    };
    // 1-1 en sets, falta el tercero: el servidor no deja guardar un resultado a medias.
    await expect(remote.recordMatch(draft)).rejects.toMatchObject({ kind: 'server' });
    draft.sets[2] = [7, 5];
    await remote.recordMatch(draft);

    user = null;
    boot(nico.session);
    await renderRouter(APP, { initialUrl: '/' });
    await see('Hola, Nico.');
    await see('100%');
    await see('Tomás González'.slice(0, 0) + 'Los del Jueves');
  }, 60000);

  it('si el servidor no responde, se ofrece reintentar y después carga todo', async () => {
    const nico = await makeUser(11, 'Nico');
    boot(nico.session);
    failNext = { fn: 'app_snapshot', message: 'TypeError: Network request failed' };
    await renderRouter(APP, { initialUrl: '/' });
    await see('No pudimos cargar tus datos.');
    await see('Revisá tu conexión y probá de nuevo.');
    await press('Reintentar');
    await see('Hola, Nico.');
  }, 60000);

  it('se une con una invitación: pide entrar y, hasta que lo aprueban, no ve nada del grupo', async () => {
    const admin = await makeUser(20, 'Tomi');
    const joiner = await makeUser(21, 'Pipa');
    boot(admin.session);
    user = admin.session.userId;
    const group = await remote.createGroup('Los Pibes', '#B9A6F2');
    const code = await remote.getInvite(group);

    user = null;
    boot(joiner.session);
    await renderRouter(APP, { initialUrl: '/' });
    await see('Hola, Pipa.');
    await press('Tengo una invitación');
    await see('Código del grupo');
    await type('Código del grupo', 'no-es-un-codigo');
    await press('Buscar grupo');
    await see('Ese link no es válido o ya no está vigente');
    await type('Código del grupo', code.toLowerCase());
    await press('Buscar grupo');
    await see('Los Pibes');
    await see('1 integrante');
    await press('Pedir unirme');
    await see('Pedido enviado.');
    await see(/Un admin del grupo tiene que aprobarte/);

    const snap = await remote.load();
    expect(snap.groups).toEqual([]);
    expect(snap.matches).toEqual([]);
  }, 90000);

  it('el admin ve los pedidos pendientes y aprueba: el grupo pasa a ser de los dos', async () => {
    const admin = await makeUser(22, 'Tomi');
    const joiner = await makeUser(23, 'Pipa');
    boot(admin.session);
    user = admin.session.userId;
    const group = await remote.createGroup('Los Pibes', '#B9A6F2');
    const code = await remote.getInvite(group);
    user = joiner.session.userId;
    await remote.requestJoin(code);

    user = null;
    boot(admin.session);
    await renderRouter(APP, { initialUrl: '/' });
    await see('Hola, Tomi.');
    await press('Grupos', 'tab');
    await see('1 pedido para unirse');
    await press(/^1 pedido para unirse/);
    await see('Pipa');
    await press('Aprobar a Pipa');
    await see('Pipa ya es parte del grupo.');

    user = joiner.session.userId;
    const snap = await remote.load();
    expect(snap.groups.map((g) => g.name)).toEqual(['Los Pibes']);
    expect(snap.groups[0].memberIds).toHaveLength(2);
    expect(snap.groups[0].adminIds).toEqual([admin.id]);
  }, 90000);

  it('cerrar sesión vuelve al ingreso y pide confirmación', async () => {
    const nico = await makeUser(24, 'Nico');
    boot(nico.session);
    await renderRouter(APP, { initialUrl: '/' });
    await see('Hola, Nico.');
    await press('Perfil', 'tab');
    await press('Ajustes');
    await see('Sesión iniciada con nico@punto.test.');
    await press('Cerrar sesión');
    await see('¿Cerrar sesión?');
    await press('Cancelar');
    await see('Sesión iniciada con nico@punto.test.');
    await press('Cerrar sesión');
    await press('Sí, cerrar sesión');
    await see('Cada partido cuenta.');
    await see('Entrá con tu mail y te mandamos un código. Sin contraseñas.');
    expect(user).toBeNull();
  }, 90000);

  it('pedir la baja de la cuenta: confirma, queda registrada y la cuenta sigue activa hasta procesarla', async () => {
    const nico = await makeUser(25, 'Nico');
    boot(nico.session);
    await renderRouter(APP, { initialUrl: '/' });
    await see('Hola, Nico.');
    await press('Perfil', 'tab');
    await press('Ajustes');
    await press('Eliminar cuenta');
    await see('¿Eliminar tu cuenta?');
    await see(/Ex jugador/);
    await press('Sí, pedir la baja');
    await see('Pedido enviado. Vamos a procesar la baja de tu cuenta.');
    await db.admin();
    const [row] = await db.query<{ at: string | null }>(
      'select deletion_requested_at at from public.profiles where id = $1',
      [nico.session.userId],
    );
    expect(row.at).not.toBeNull();
    await press('Ajustes');
    await see('Baja solicitada');
  }, 90000);

  it('quien entra con el mail equivocado puede salir del armado de perfil', async () => {
    await db.admin();
    await db.query('insert into auth.users (id, email) values ($1, $2)', [
      u(30),
      'equivocado@punto.test',
    ]);
    boot({ userId: u(30), email: 'equivocado@punto.test' });
    await renderRouter(APP, { initialUrl: '/' });
    await see('Armá tu perfil.');
    await type('Nombre completo', 'Alguien');
    await press('Guardar y seguir');
    await see('Escribí cómo te dicen.'); // el error va en el campo que corresponde
    expect(screen.queryByText('Escribí tu nombre completo.')).toBeNull();
    await press('Entrar con otro mail');
    await see('Cada partido cuenta.');
    expect(user).toBeNull();
  }, 60000);
});
