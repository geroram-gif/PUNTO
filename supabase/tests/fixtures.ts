import { Db, u } from './harness';

/** Usuarios de prueba. El trigger on_auth_user_created crea su perfil y su jugador. */
export const USERS = {
  tomi: { n: 1, email: 'tomi@punto.test' },
  fran: { n: 2, email: 'fran@punto.test' },
  nico: { n: 3, email: 'nico@punto.test' },
  lean: { n: 4, email: 'lean@punto.test' },
  gonza: { n: 5, email: 'gonza@punto.test' },
  extra: { n: 6, email: 'extra@punto.test' },
  mati: { n: 7, email: 'mati@punto.test' },
  facu: { n: 8, email: 'facu@punto.test' },
  rama: { n: 9, email: 'rama@punto.test' },
} as const;
export type UserKey = keyof typeof USERS;

export const uid = (k: UserKey) => u(USERS[k].n);

/** Crea los usuarios (como lo haría Supabase Auth) y devuelve el id de jugador de cada uno. */
export async function createUsers(db: Db, keys: UserKey[] = Object.keys(USERS) as UserKey[]) {
  await db.admin();
  const players: Record<string, string> = {};
  for (const k of keys) {
    await db.query('insert into auth.users (id, email) values ($1, $2)', [uid(k), USERS[k].email]);
    const r = await db.query<{ id: string }>(
      'select id from public.players where profile_id = $1',
      [uid(k)],
    );
    players[k] = r[0].id;
  }
  return players;
}

/** Siembra por SQL de superusuario (saltea RLS): un grupo con sus miembros ya armados. */
export async function seedGroup(
  db: Db,
  name: string,
  admin: UserKey,
  players: Record<string, string>,
  members: UserKey[],
) {
  await db.admin();
  const [g] = await db.query<{ id: string }>(
    `insert into public.groups (name, initials, color, created_by) values ($1, 'XX', '#DCEB82', $2) returning id`,
    [name, uid(admin)],
  );
  for (const m of members) {
    await db.query(
      'insert into public.group_members (group_id, player_id, role) values ($1, $2, $3)',
      [g.id, players[m], m === admin ? 'admin' : 'member'],
    );
  }
  return g.id;
}

export const SETS_2_0 = [
  [6, 4],
  [6, 3],
];

/** Un partido válido de A (a1,a2) contra B (b1,b2). */
export function matchArgs(
  groupId: string,
  a: string[],
  b: string[],
  over: Record<string, unknown> = {},
) {
  return {
    p_group_id: groupId,
    p_played_on: '2026-10-30',
    p_format: 'bo3',
    p_team_a: a,
    p_team_b: b,
    p_sets: SETS_2_0,
    ...over,
  };
}

/** Argumentos de update_match (igual que record_match pero identificado por partido, no por grupo). */
export function updateArgs(matchId: string, args: Record<string, unknown>) {
  const { p_group_id: _group, ...rest } = args;
  return { p_match_id: matchId, ...rest };
}
