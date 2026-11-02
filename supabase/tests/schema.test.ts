import { Db } from './harness';
import { createUsers, uid } from './fixtures';

let db: Db;
beforeAll(async () => {
  db = new Db();
  await db.migrate();
}, 60000);
afterAll(() => db.close());
beforeEach(() => db.begin());
afterEach(() => db.rollback());

/** Una columna cualquiera de cada tabla, para probar el UPDATE. */
const ANY_COLUMN: Record<string, string> = {
  profiles: 'id',
  players: 'display_name',
  groups: 'name',
  group_members: 'role',
  group_invites: 'code',
  join_requests: 'status',
  matches: 'format',
  match_players: 'team',
  match_sets: 'games_a',
};
const TABLES = [
  'profiles',
  'players',
  'groups',
  'group_members',
  'group_invites',
  'join_requests',
  'matches',
  'match_players',
  'match_sets',
];

describe('migraciones', () => {
  it('todas las tablas de public tienen RLS activado', async () => {
    const rows = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' order by 1`,
    );
    expect(rows.map((r) => r.relname).sort()).toEqual([...TABLES].sort());
    expect(rows.filter((r) => !r.relrowsecurity)).toEqual([]);
  });

  it('el alta de un usuario crea su perfil y su jugador con un nombre genérico (no se filtra el mail)', async () => {
    const p = await createUsers(db, ['tomi']);
    await db.admin();
    const r = await db.query(
      `select display_name, initials, is_guest, avatar_color from public.players where id = $1`,
      [p.tomi],
    );
    expect(r).toEqual([
      { display_name: 'Jugador', initials: 'JU', is_guest: false, avatar_color: '#FF7855' },
    ]);
    const prof = await db.query(
      'select onboarding_completed_at from public.profiles where id = $1',
      [uid('tomi')],
    );
    expect(prof).toEqual([{ onboarding_completed_at: null }]);
  });
});

/** Corre algo que tiene que fallar sin dejar abortada la transacción del test. */
async function denied(run: () => Promise<unknown>, code = '42501') {
  await db.exec('savepoint denied');
  await expect(run()).rejects.toMatchObject({ code });
  await db.exec('rollback to savepoint denied');
}

describe('permisos: los clientes no escriben tablas', () => {
  beforeEach(async () => {
    await createUsers(db, ['tomi']);
  });

  it.each(TABLES)('authenticated no puede insertar, modificar ni borrar en %s', async (t) => {
    await db.as(uid('tomi'));
    await denied(() => db.exec(`insert into public.${t} default values`));
    await denied(() => db.exec(`update public.${t} set ${ANY_COLUMN[t]} = ${ANY_COLUMN[t]}`));
    await denied(() => db.exec(`delete from public.${t}`));
  });

  it.each(['group_invites', 'join_requests'])(
    'authenticated no lee %s (solo por RPC)',
    async (t) => {
      await db.as(uid('tomi'));
      await denied(() => db.query(`select * from public.${t}`));
    },
  );

  it.each(TABLES)('anon no ve nada de %s', async (t) => {
    await db.as(null);
    await denied(() => db.query(`select * from public.${t}`));
  });

  it('anon no puede llamar a ninguna RPC', async () => {
    await db.as(null);
    for (const f of [
      'app_snapshot()',
      'create_group(null, null)',
      'record_match(null, null, null, null, null, null)',
    ]) {
      await denied(() => db.query(`select public.${f}`));
    }
  });

  it('el esquema private y la baja de cuenta no son accesibles para la app', async () => {
    await db.as(uid('tomi'));
    await denied(() => db.query(`select private.match_result('one', '[[6,0]]')`));
    await denied(() => db.query(`select public.process_account_deletion('${uid('tomi')}')`));
  });

  it('un usuario autenticado sin sesión válida (sin sub) no ve el snapshot', async () => {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '', false)`);
    await denied(() => db.query('select public.app_snapshot()'));
  });
});
