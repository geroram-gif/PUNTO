import { Db } from './harness';
import { createUsers, matchArgs, seedGroup, uid, updateArgs, type UserKey } from './fixtures';

let db: Db;
beforeAll(async () => {
  db = new Db();
  await db.migrate();
}, 60000);
afterAll(() => db.close());
beforeEach(() => db.begin());
afterEach(() => db.rollback());

/** Corre algo que tiene que fallar sin dejar abortada la transacción del test. */
async function fails(run: () => Promise<unknown>, code: string, message?: RegExp) {
  await db.exec('savepoint f');
  const err = await run().then(
    () => null,
    (e: Error & { code?: string }) => e,
  );
  await db.exec('rollback to savepoint f');
  expect(err).not.toBeNull();
  expect(err?.code).toBe(code);
  if (message) expect(err?.message).toMatch(message);
}

type Snap = {
  me: string;
  onboarded: boolean;
  players: { id: string; name: string; isGuest: boolean }[];
  groups: { id: string; name: string; adminIds: string[]; memberIds: string[] }[];
  matches: { id: string; groupId: string; createdBy: string | null; edited: boolean }[];
  pendingRequests: { id: string; groupId: string; name: string }[];
};
const snapshot = (k: UserKey) => db.as(uid(k)).then(() => db.rpc<Snap>('app_snapshot'));

/**
 * Los del Jueves: admin Tomi + Fran, Nico, Mati. Los Pibes: admin Gonza + Lean, Facu, Rama.
 * `extra` no está en ningún grupo.
 */
async function scenario() {
  const p = await createUsers(db);
  const jueves = await seedGroup(db, 'Los del Jueves', 'tomi', p, ['tomi', 'fran', 'nico', 'mati']);
  const pibes = await seedGroup(db, 'Los Pibes', 'gonza', p, ['gonza', 'lean', 'facu', 'rama']);
  const J = [p.tomi, p.fran, p.nico, p.mati];
  const P = [p.gonza, p.lean, p.facu, p.rama];
  return { p, jueves, pibes, J, P };
}

async function record(as: UserKey, args: Record<string, unknown>) {
  await db.as(uid(as));
  return db.rpc<{ id: string; seq: number }>('record_match', args);
}
const count = async (table: string) => {
  await db.admin();
  return Number((await db.query<{ n: string }>(`select count(*) n from public.${table}`))[0].n);
};

describe('aislamiento entre grupos (RLS)', () => {
  it('cada usuario ve solo lo de sus grupos: snapshot y lecturas directas', async () => {
    const { p, jueves, pibes, J, P } = await scenario();
    await record('tomi', matchArgs(jueves, [J[0], J[1]], [J[2], J[3]]));
    await record('gonza', matchArgs(pibes, [P[0], P[1]], [P[2], P[3]]));

    const t = await snapshot('tomi');
    expect(t.groups.map((g) => g.name)).toEqual(['Los del Jueves']);
    expect(t.matches).toHaveLength(1);
    expect(t.players.map((x) => x.id).sort()).toEqual([...J].sort());
    expect(t.me).toBe(p.tomi);

    const l = await snapshot('lean');
    expect(l.groups.map((g) => g.name)).toEqual(['Los Pibes']);
    expect(l.matches.every((m) => m.groupId === pibes)).toBe(true);
    expect(l.players.map((x) => x.id).sort()).toEqual([...P].sort());

    // Lectura directa de las tablas: tampoco se cuela nada del otro grupo.
    await db.as(uid('lean'));
    expect(await db.query(`select 1 from public.matches where group_id = $1`, [jueves])).toEqual(
      [],
    );
    expect(
      await db.query(`select 1 from public.group_members where group_id = $1`, [jueves]),
    ).toEqual([]);
    expect(await db.query(`select 1 from public.groups where id = $1`, [jueves])).toEqual([]);
    expect(await db.query(`select 1 from public.players where id = $1`, [p.tomi])).toEqual([]);
    expect(
      await db.query(
        `select 1 from public.match_players mp join public.matches m on m.id = mp.match_id where m.group_id = $1`,
        [jueves],
      ),
    ).toEqual([]);
    expect(await db.query(`select 1 from public.match_sets`)).toHaveLength(2);
    expect(await db.query(`select 1 from public.profiles`)).toHaveLength(1); // solo el propio
  });

  it('un usuario sin grupos ve todo vacío', async () => {
    await scenario();
    const e = await snapshot('extra');
    expect([e.groups, e.matches, e.pendingRequests]).toEqual([[], [], []]);
    expect(e.players).toHaveLength(1); // solo él
  });

  it('no se puede cargar, corregir ni borrar en un grupo ajeno (y no se revela que existe)', async () => {
    const { jueves, pibes, J, P } = await scenario();
    const m = await record('tomi', matchArgs(jueves, [J[0], J[1]], [J[2], J[3]]));
    await db.as(uid('lean'));
    await fails(
      () => db.rpc('record_match', matchArgs(jueves, [J[0], J[1]], [J[2], J[3]])),
      'P0002',
      /Grupo no encontrado/,
    );
    await fails(
      () => db.rpc('update_match', updateArgs(m.id, matchArgs(pibes, [P[0], P[1]], [P[2], P[3]]))),
      'P0002',
      /Partido no encontrado/,
    );
    await fails(
      () => db.rpc('delete_match', { p_match_id: m.id }),
      'P0002',
      /Partido no encontrado/,
    );
    // Un id que no existe da exactamente la misma respuesta que uno ajeno.
    await fails(
      () => db.rpc('delete_match', { p_match_id: '11111111-1111-1111-1111-111111111111' }),
      'P0002',
      /Partido no encontrado/,
    );
    await fails(() => db.rpc('get_group_invite', { p_group_id: jueves }), 'P0002');
    await fails(() => db.rpc('add_guest', { p_group_id: jueves, p_name: 'Colado' }), 'P0002');
    expect(await count('matches')).toBe(1);
  });

  it('no se puede armar un partido con jugadores de otro grupo', async () => {
    const { jueves, J, P } = await scenario();
    await db.as(uid('tomi'));
    await fails(
      () => db.rpc('record_match', matchArgs(jueves, [J[0], J[1]], [J[2], P[0]])),
      '22023',
      /del grupo/,
    );
    expect(await count('matches')).toBe(0);
  });
});

describe('quién corrige y borra partidos', () => {
  it('quien lo cargó sí; otro miembro no; el admin sí', async () => {
    const { jueves, J } = await scenario();
    const m = await record('fran', matchArgs(jueves, [J[0], J[1]], [J[2], J[3]]));
    const upd = updateArgs(
      m.id,
      matchArgs(jueves, [J[0], J[1]], [J[2], J[3]], {
        p_sets: [
          [3, 6],
          [3, 6],
        ],
      }),
    );

    await db.as(uid('nico'));
    await fails(() => db.rpc('update_match', upd), '42501', /quien lo cargó o un admin/);
    await fails(() => db.rpc('delete_match', { p_match_id: m.id }), '42501');

    await db.as(uid('fran'));
    await db.rpc('update_match', upd);
    let s = await snapshot('fran');
    expect(s.matches[0].edited).toBe(true);

    await db.as(uid('tomi')); // admin, no lo cargó
    await db.rpc('update_match', {
      ...upd,
      p_sets: [
        [6, 0],
        [6, 0],
      ],
    });
    await db.rpc('delete_match', { p_match_id: m.id });
    s = await snapshot('tomi');
    expect(s.matches).toEqual([]);
    expect(await count('match_players')).toBe(0);
    expect(await count('match_sets')).toBe(0);
  });

  it('el admin de OTRO grupo no administra este', async () => {
    const { jueves, J } = await scenario();
    const m = await record('tomi', matchArgs(jueves, [J[0], J[1]], [J[2], J[3]]));
    await db.as(uid('gonza'));
    await fails(() => db.rpc('delete_match', { p_match_id: m.id }), 'P0002');
  });
});

describe('escrituras atómicas', () => {
  it('un partido inválido no deja nada a medias', async () => {
    const { jueves, J } = await scenario();
    await db.as(uid('tomi'));
    await fails(
      () =>
        db.rpc(
          'record_match',
          matchArgs(jueves, [J[0], J[1]], [J[2], J[3]], {
            p_sets: [
              [6, 5],
              [6, 3],
            ],
          }),
        ),
      '22023',
      /no es válido/,
    );
    for (const t of ['matches', 'match_players', 'match_sets']) expect(await count(t)).toBe(0);
  });

  it('una corrección inválida deja el partido original intacto', async () => {
    const { jueves, J } = await scenario();
    const m = await record('tomi', matchArgs(jueves, [J[0], J[1]], [J[2], J[3]]));
    await fails(
      () => db.rpc('update_match', updateArgs(m.id, matchArgs(jueves, [J[0], J[0]], [J[2], J[3]]))),
      '22023',
      /distintos/,
    );
    const s = await snapshot('tomi');
    expect(s.matches).toHaveLength(1);
    expect(s.matches[0].edited).toBe(false);
    expect(await count('match_sets')).toBe(2);
  });
});

describe('invitaciones y pedidos de ingreso', () => {
  it('flujo completo: link → pedido → aprobación del admin → acceso', async () => {
    const { p, jueves, J } = await scenario();
    await record('tomi', matchArgs(jueves, [J[0], J[1]], [J[2], J[3]]));

    await db.as(uid('fran')); // cualquier miembro puede compartir el link
    const code = await db.rpc<string>('get_group_invite', { p_group_id: jueves });
    expect(code).toMatch(/^[0-9A-F]{16}$/);
    expect(await db.rpc<string>('get_group_invite', { p_group_id: jueves })).toBe(code); // estable

    await db.as(uid('extra'));
    await db.rpc('update_profile', {
      p_display_name: 'Extra',
      p_full_name: 'Extra Sosa',
      p_avatar_color: '#DCEB82',
    });
    const prev = await db.rpc<{ groupName: string; members: number; alreadyMember: boolean }>(
      'preview_invite',
      { p_code: code.toLowerCase() },
    );
    expect(prev).toMatchObject({ groupName: 'Los del Jueves', members: 4, alreadyMember: false });
    expect(await db.rpc('request_join', { p_code: code })).toMatchObject({ status: 'pending' });
    expect(await db.rpc('request_join', { p_code: code })).toMatchObject({ status: 'pending' }); // idempotente
    expect(await count('join_requests')).toBe(1);

    // Pedir entrar no da acceso a nada.
    expect((await snapshot('extra')).groups).toEqual([]);
    expect((await snapshot('extra')).matches).toEqual([]);

    // Solo el admin ve y resuelve los pedidos.
    expect((await snapshot('fran')).pendingRequests).toEqual([]);
    const pend = (await snapshot('tomi')).pendingRequests;
    expect(pend).toHaveLength(1);
    expect(pend[0].name).toBe('Extra');
    await db.as(uid('fran'));
    await fails(
      () => db.rpc('decide_join_request', { p_request_id: pend[0].id, p_approve: true }),
      '42501',
    );
    await db.as(uid('lean')); // admin/miembro de otro grupo: ni sabe que existe
    await fails(
      () => db.rpc('decide_join_request', { p_request_id: pend[0].id, p_approve: true }),
      'P0002',
    );

    await db.as(uid('tomi'));
    expect(await db.rpc('decide_join_request', { p_request_id: pend[0].id, p_approve: true })).toBe(
      'approved',
    );
    await fails(
      () => db.rpc('decide_join_request', { p_request_id: pend[0].id, p_approve: false }),
      '22023',
      /ya se resolvió/,
    );

    const s = await snapshot('extra');
    expect(s.groups.map((g) => g.name)).toEqual(['Los del Jueves']);
    expect(s.groups[0].memberIds).toContain(p.extra);
    expect(s.groups[0].adminIds).toEqual([p.tomi]);
    expect(s.matches).toHaveLength(1);
  });

  it('un pedido rechazado no da acceso y se puede volver a pedir pasada la espera', async () => {
    const { jueves } = await scenario();
    await db.as(uid('tomi'));
    const code = await db.rpc<string>('get_group_invite', { p_group_id: jueves });
    await db.as(uid('extra'));
    await db.rpc('request_join', { p_code: code });
    await db.as(uid('tomi'));
    const [r] = (await snapshot('tomi')).pendingRequests;
    expect(await db.rpc('decide_join_request', { p_request_id: r.id, p_approve: false })).toBe(
      'rejected',
    );
    expect((await snapshot('extra')).groups).toEqual([]);
    await db.as(uid('extra'));
    // Tras un rechazo hay que esperar para volver a pedir (evita el spam al admin).
    await fails(() => db.rpc('request_join', { p_code: code }), '22023', /rechazó/);
    await db.admin();
    await db.exec(`update public.join_requests set decided_at = now() - interval '8 days'`);
    await db.as(uid('extra'));
    expect(await db.rpc('request_join', { p_code: code })).toMatchObject({ status: 'pending' });
  });

  it('un link inválido o renovado no sirve; solo el admin renueva', async () => {
    const { jueves } = await scenario();
    await db.as(uid('tomi'));
    const old = await db.rpc<string>('get_group_invite', { p_group_id: jueves });
    await db.as(uid('fran'));
    await fails(() => db.rpc('rotate_group_invite', { p_group_id: jueves }), '42501');
    await db.as(uid('tomi'));
    const fresh = await db.rpc<string>('rotate_group_invite', { p_group_id: jueves });
    expect(fresh).not.toBe(old);
    await db.as(uid('extra'));
    await fails(() => db.rpc('preview_invite', { p_code: old }), 'P0002', /no es válido/);
    await fails(() => db.rpc('request_join', { p_code: old }), 'P0002');
    await fails(() => db.rpc('request_join', { p_code: 'cualquier-cosa' }), 'P0002');
    await db.rpc('request_join', { p_code: fresh });
  });

  it('un miembro que usa el link de su grupo no genera pedido', async () => {
    const { jueves } = await scenario();
    await db.as(uid('fran'));
    const code = await db.rpc<string>('get_group_invite', { p_group_id: jueves });
    expect(await db.rpc('request_join', { p_code: code })).toMatchObject({ status: 'member' });
    expect(await count('join_requests')).toBe(0);
  });

  it('el grupo tiene tope de 40 integrantes', async () => {
    const { jueves } = await scenario();
    await db.as(uid('tomi'));
    for (let i = 0; i < 36; i++)
      await db.rpc('add_guest', { p_group_id: jueves, p_name: `Inv${i}` });
    await fails(
      () => db.rpc('add_guest', { p_group_id: jueves, p_name: 'Uno más' }),
      '22023',
      /máximo de 40/,
    );
  });
});

describe('invitados', () => {
  it('un miembro suma un invitado que puede jugar; nadie de afuera lo ve', async () => {
    const { jueves, J } = await scenario();
    await db.as(uid('nico'));
    const g = await db.rpc<string>('add_guest', { p_group_id: jueves, p_name: '  Lucho ' });
    await db.rpc('record_match', matchArgs(jueves, [J[0], g], [J[2], J[3]]));
    const s = await snapshot('tomi');
    const lucho = s.players.find((x) => x.id === g)!;
    expect(lucho).toMatchObject({ name: 'Lucho', isGuest: true });
    expect(s.groups[0].adminIds).not.toContain(g);
    expect((await snapshot('lean')).players.find((x) => x.id === g)).toBeUndefined();
  });

  it('valida el nombre: vacío, largo o repetido en el grupo (sin importar mayúsculas)', async () => {
    const { jueves } = await scenario();
    await db.as(uid('fran'));
    await db.rpc('update_profile', {
      p_display_name: 'Fran',
      p_full_name: 'Fran Pérez',
      p_avatar_color: '#B9A6F2',
    });
    await db.as(uid('tomi'));
    await fails(() => db.rpc('add_guest', { p_group_id: jueves, p_name: '   ' }), '22023');
    await fails(() => db.rpc('add_guest', { p_group_id: jueves, p_name: 'x'.repeat(21) }), '22023');
    await fails(
      () => db.rpc('add_guest', { p_group_id: jueves, p_name: 'FRAN' }),
      '22023',
      /ese nombre/,
    );
    await db.rpc('add_guest', { p_group_id: jueves, p_name: 'Pipo' });
    await fails(() => db.rpc('add_guest', { p_group_id: jueves, p_name: 'pipo' }), '22023');
  });

  it('el mismo nombre se puede usar en otro grupo; un invitado nunca es admin', async () => {
    const { pibes, jueves } = await scenario();
    await db.as(uid('tomi'));
    await db.rpc('add_guest', { p_group_id: jueves, p_name: 'Pipo' });
    await db.as(uid('gonza'));
    const g = await db.rpc<string>('add_guest', { p_group_id: pibes, p_name: 'Pipo' });
    await db.admin();
    await fails(
      () => db.query(`update public.group_members set role = 'admin' where player_id = $1`, [g]),
      '23514',
      /con cuenta/,
    );
  });
});

describe('perfil y grupos', () => {
  it('update_profile guarda la identidad y marca el onboarding', async () => {
    const { p } = await scenario();
    expect((await snapshot('extra')).onboarded).toBe(false);
    await db.as(uid('extra'));
    await db.rpc('update_profile', {
      p_display_name: 'Fede',
      p_full_name: 'Federico Gómez Paz',
      p_avatar_color: '#b9a6f2',
    });
    const s = await snapshot('extra');
    expect(s.onboarded).toBe(true);
    await db.admin();
    expect(
      await db.query(
        `select display_name, full_name, initials, avatar_color from public.players where id = $1`,
        [p.extra],
      ),
    ).toEqual([
      {
        display_name: 'Fede',
        full_name: 'Federico Gómez Paz',
        initials: 'FP',
        avatar_color: '#B9A6F2',
      },
    ]);
  });

  it('update_profile valida nombre y color; solo toca al propio jugador', async () => {
    const { p } = await scenario();
    await db.as(uid('extra'));
    await fails(
      () =>
        db.rpc('update_profile', {
          p_display_name: '',
          p_full_name: 'X',
          p_avatar_color: '#FF7855',
        }),
      '22023',
    );
    await fails(
      () =>
        db.rpc('update_profile', {
          p_display_name: 'X',
          p_full_name: 'X',
          p_avatar_color: '#123456',
        }),
      '22023',
    );
    await fails(
      () =>
        db.rpc('update_profile', { p_display_name: 'X', p_full_name: 'X', p_avatar_color: null }),
      '22023',
    );
    await db.rpc('update_profile', {
      p_display_name: 'Pirata',
      p_full_name: 'Pirata',
      p_avatar_color: '#FF7855',
    });
    await db.admin();
    expect(
      await db.query(`select display_name from public.players where id = $1`, [p.tomi]),
    ).toEqual([{ display_name: 'Jugador' }]);
  });

  it('create_group deja al creador como admin y valida nombre, color y tope', async () => {
    const { p } = await scenario();
    await db.as(uid('extra'));
    const g = await db.rpc<string>('create_group', {
      p_name: 'Los del Martes',
      p_color: '#dceb82',
    });
    const s = await snapshot('extra');
    expect(s.groups).toMatchObject([
      { id: g, name: 'Los del Martes', adminIds: [p.extra], memberIds: [p.extra] },
    ]);
    await fails(() => db.rpc('create_group', { p_name: ' ', p_color: '#DCEB82' }), '22023');
    await fails(() => db.rpc('create_group', { p_name: 'Ok', p_color: '#000000' }), '22023');
    for (let i = 0; i < 9; i++)
      await db.rpc('create_group', { p_name: `G${i}`, p_color: '#DCEB82' });
    await fails(
      () => db.rpc('create_group', { p_name: 'Once', p_color: '#DCEB82' }),
      '22023',
      /máximo de 10/,
    );
  });
});

describe('baja de cuenta', () => {
  it('se pide desde la app y se procesa solo desde el servidor, sin romper los partidos de los demás', async () => {
    const { p, jueves, J } = await scenario();
    await record('tomi', matchArgs(jueves, [J[0], J[1]], [J[2], J[3]]));

    await db.as(uid('nico'));
    const at = await db.rpc<string>('request_account_deletion');
    expect(at).toBeTruthy();
    expect(await db.rpc<string>('request_account_deletion')).toBe(at); // idempotente
    expect((await snapshot('nico')).me).toBe(p.nico); // la cuenta sigue activa hasta que se procese

    await fails(() => db.rpc('process_account_deletion', { p_profile_id: uid('nico') }), '42501');
    await db.admin();
    await fails(
      () => db.rpc('process_account_deletion', { p_profile_id: uid('fran') }),
      '22023',
      /no pidió/,
    );
    await db.rpc('process_account_deletion', { p_profile_id: uid('nico') });

    const s = await snapshot('tomi');
    const exNico = s.players.find((x) => x.id === p.nico)!;
    expect(exNico).toMatchObject({ name: 'Ex jugador', isGuest: true });
    expect(s.matches).toHaveLength(1);
    await db.admin();
    expect(await db.query(`select 1 from auth.users where id = $1`, [uid('nico')])).toEqual([]);
    expect(await db.query(`select 1 from public.profiles where id = $1`, [uid('nico')])).toEqual(
      [],
    );
  });
});

describe('integridad como respaldo de las RPC', () => {
  /** Escribe como superusuario (salteando RPC y RLS) y fuerza el chequeo del cierre de transacción. */
  async function rawMatch(groupId: string, players: string[], sets: number[][], format = 'bo3') {
    await db.admin();
    const [m] = await db.query<{ id: string }>(
      `insert into public.matches (group_id, played_on, format) values ($1, '2026-10-01', $2) returning id`,
      [groupId, format],
    );
    for (const [i, pl] of players.entries())
      await db.query(`insert into public.match_players values ($1, $2, $3, $4)`, [
        m.id,
        pl,
        i < 2 ? 'A' : 'B',
        (i % 2) + 1,
      ]);
    for (const [i, s] of sets.entries())
      await db.query(`insert into public.match_sets values ($1, $2, $3, $4)`, [
        m.id,
        i + 1,
        s[0],
        s[1],
      ]);
    await db.exec('set constraints all immediate');
  }

  it('acepta un partido bien formado', async () => {
    const { jueves, J } = await scenario();
    await rawMatch(jueves, J, [
      [6, 4],
      [6, 3],
    ]);
  });

  it('rechaza menos de 4 jugadores, jugadores de otro grupo, sets inválidos o salteados', async () => {
    const { jueves, J, P } = await scenario();
    await fails(
      () =>
        rawMatch(jueves, J.slice(0, 3), [
          [6, 4],
          [6, 3],
        ]),
      '23514',
      /4 jugadores/,
    );
    await fails(
      () =>
        rawMatch(
          jueves,
          [J[0], J[1], J[2], P[0]],
          [
            [6, 4],
            [6, 3],
          ],
        ),
      '23514',
      /del grupo/,
    );
    await fails(
      () =>
        rawMatch(jueves, J, [
          [6, 4],
          [6, 5],
        ]),
      '22023',
      /no es válido/,
    );
    await fails(
      () =>
        rawMatch(jueves, J, [
          [6, 4],
          [3, 6],
        ]),
      '22023',
      /Cantidad de sets/,
    );
    await fails(() => rawMatch(jueves, J, [[6, 4]]), '22023', /Falta el set 2/);
  });

  it('el mismo jugador no puede estar dos veces en un partido', async () => {
    const { jueves, J } = await scenario();
    await db.admin();
    const [m] = await db.query<{ id: string }>(
      `insert into public.matches (group_id, played_on, format) values ($1, '2026-10-01', 'one') returning id`,
      [jueves],
    );
    await db.query(`insert into public.match_players values ($1, $2, 'A', 1)`, [m.id, J[0]]);
    await fails(
      () => db.query(`insert into public.match_players values ($1, $2, 'B', 1)`, [m.id, J[0]]),
      '23505',
    );
  });
});

describe('fechas', () => {
  it('no acepta fechas futuras ni anteriores a 2020', async () => {
    const { jueves, J } = await scenario();
    await db.as(uid('tomi'));
    await fails(
      () =>
        db.rpc(
          'record_match',
          matchArgs(jueves, [J[0], J[1]], [J[2], J[3]], { p_played_on: '2999-01-01' }),
        ),
      '22023',
      /futura/,
    );
    await fails(
      () =>
        db.rpc(
          'record_match',
          matchArgs(jueves, [J[0], J[1]], [J[2], J[3]], { p_played_on: '2019-12-31' }),
        ),
      '23514',
    );
    await db.rpc(
      'record_match',
      matchArgs(jueves, [J[0], J[1]], [J[2], J[3]], { p_played_on: '2020-01-01' }),
    );
  });
});

describe('hallazgos de la auditoría de seguridad', () => {
  it('si el autor de un partido se da de baja, un miembro común NO puede editarlo ni borrarlo', async () => {
    const { jueves, J } = await scenario();
    const m = await record('fran', matchArgs(jueves, [J[0], J[1]], [J[2], J[3]]));
    await db.as(uid('fran'));
    await db.rpc('request_account_deletion');
    await db.admin();
    await db.rpc('process_account_deletion', { p_profile_id: uid('fran') });
    await db.admin();
    expect(await db.query('select created_by from public.matches where id = $1', [m.id])).toEqual([
      { created_by: null },
    ]);

    await db.as(uid('nico'));
    await fails(() => db.rpc('delete_match', { p_match_id: m.id }), '42501');
    await fails(
      () => db.rpc('update_match', updateArgs(m.id, matchArgs(jueves, [J[0], J[1]], [J[2], J[3]]))),
      '42501',
    );
    await db.as(uid('tomi')); // el admin sí
    await db.rpc('delete_match', { p_match_id: m.id });
  });

  it('si se da de baja el único admin, el grupo pasa a un miembro con cuenta', async () => {
    const { p, jueves } = await scenario();
    await db.as(uid('tomi'));
    await db.rpc('request_account_deletion');
    await db.admin();
    await db.rpc('process_account_deletion', { p_profile_id: uid('tomi') });
    const s = await snapshot('fran');
    const g = s.groups[0];
    expect(g.adminIds).toHaveLength(1);
    expect(g.adminIds[0]).not.toBe(p.tomi);
    expect(g.memberIds).toContain(p.tomi); // el ex jugador sigue en el historial, como miembro
    // El nuevo admin puede administrar de verdad.
    const admin = [uid('fran'), uid('nico'), uid('mati')].find(
      (_, i) => [p.fran, p.nico, p.mati][i] === g.adminIds[0],
    )!;
    await db.as(admin);
    await db.rpc('rotate_group_invite', { p_group_id: jueves });
  });

  it('si no queda nadie con cuenta para heredar, la baja no falla y el grupo queda sin admin', async () => {
    const p = await createUsers(db, ['tomi']);
    await db.as(uid('tomi'));
    const g = await db.rpc<string>('create_group', { p_name: 'Solo', p_color: '#DCEB82' });
    await db.rpc('add_guest', { p_group_id: g, p_name: 'Pipo' });
    await db.rpc('request_account_deletion');
    await db.admin();
    await db.rpc('process_account_deletion', { p_profile_id: uid('tomi') });
    expect(
      await db.query('select role from public.group_members where player_id = $1', [p.tomi]),
    ).toEqual([{ role: 'member' }]);
    expect(
      await db.query(`select count(*)::int n from public.group_members where role = 'admin'`),
    ).toEqual([{ n: 0 }]);
  });

  it('una función nueva en public nace cerrada; solo las RPC listadas son ejecutables por la app', async () => {
    await createUsers(db, ['tomi']);
    await db.admin();
    await db.exec(`create function public.zz_nueva() returns int language sql as 'select 1'`);
    for (const role of ['anon', 'authenticated']) {
      const [r] = await db.query<{ ok: boolean }>(
        `select has_function_privilege($1, 'public.zz_nueva()', 'execute') ok`,
        [role],
      );
      expect(r.ok).toBe(false);
    }
    const open = await db.query<{ name: string }>(
      `select p.proname name from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname <> 'zz_nueva' and has_function_privilege('authenticated', p.oid, 'execute') order by 1`,
    );
    expect(open.map((x) => x.name)).toEqual([
      'add_guest',
      'app_snapshot',
      'create_group',
      'decide_join_request',
      'delete_match',
      'get_group_invite',
      'is_group_admin',
      'is_group_member',
      'match_group_id',
      'my_player_id',
      'pending_join_requests',
      'preview_invite',
      'record_match',
      'request_account_deletion',
      'request_join',
      'rotate_group_invite',
      'shares_group_with',
      'update_match',
      'update_profile',
    ]);
    const anon = await db.query<{ name: string }>(
      `select p.proname name from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')`,
    );
    expect(anon).toEqual([]);
  });

  it('match_group_id no revela el grupo de un partido ajeno', async () => {
    const { jueves, J } = await scenario();
    const m = await record('tomi', matchArgs(jueves, [J[0], J[1]], [J[2], J[3]]));
    await db.as(uid('lean'));
    expect(await db.query('select public.match_group_id($1) g', [m.id])).toEqual([{ g: null }]);
    await db.as(uid('fran'));
    expect(await db.query('select public.match_group_id($1) g', [m.id])).toEqual([{ g: jueves }]);
  });

  it('límites de pedidos: 25 pendientes por grupo y 5 por persona', async () => {
    const { jueves, pibes } = await scenario();
    await db.as(uid('tomi'));
    const code = await db.rpc<string>('get_group_invite', { p_group_id: jueves });
    await db.as(uid('gonza'));
    const pcode = await db.rpc<string>('get_group_invite', { p_group_id: pibes });
    const bulk = (i: number) => `00000000-0000-0000-0000-0000000002${String(i).padStart(2, '0')}`;
    await db.admin();
    for (let i = 0; i < 26; i++)
      await db.query('insert into auth.users (id, email) values ($1, $2)', [
        bulk(i),
        `x${i}@punto.test`,
      ]);
    for (let i = 0; i < 25; i++) {
      await db.as(bulk(i));
      await db.rpc('request_join', { p_code: code });
    }
    await db.as(bulk(25));
    await fails(() => db.rpc('request_join', { p_code: code }), '22023', /muchos pedidos/);

    // Una persona con 5 pedidos pendientes en 5 grupos distintos no puede pedir un sexto.
    for (let i = 0; i < 5; i++) {
      await db.as(uid('tomi'));
      const g = await db.rpc<string>('create_group', { p_name: `G${i}`, p_color: '#DCEB82' });
      const c = await db.rpc<string>('get_group_invite', { p_group_id: g });
      await db.as(uid('extra'));
      await db.rpc('request_join', { p_code: c });
    }
    await fails(() => db.rpc('request_join', { p_code: pcode }), '22023', /5 pedidos pendientes/);
  });

  it('un partido no puede traer más de 3 sets', async () => {
    const { jueves, J } = await scenario();
    await db.as(uid('tomi'));
    const big = Array.from({ length: 200 }, () => [6, 0]);
    await fails(
      () => db.rpc('record_match', matchArgs(jueves, [J[0], J[1]], [J[2], J[3]], { p_sets: big })),
      '22023',
      /máximo 3 sets/,
    );
  });
});
