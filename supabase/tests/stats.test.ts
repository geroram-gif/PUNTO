/**
 * Recálculo de estadísticas de punta a punta: los 36 partidos del prototipo se cargan en la base,
 * se leen como los lee la app (app_snapshot con RLS) y el motor tiene que dar las cifras aprobadas.
 * Después se carga, corrige y borra un partido por RPC y todo se recalcula.
 */
import { duoStats, groupRanking, h2h, newestFirst, playerStats, type Match } from '@/lib/stats';
import {
  groups as seedGroups,
  matches as seedMatches,
  players as seedPlayers,
} from '@/lib/demo/seed';
import { parseSnapshot, type Snapshot } from '@/lib/supabase/snapshot';

import { Db, u } from './harness';
import { updateArgs } from './fixtures';

let db: Db;
beforeAll(async () => {
  db = new Db();
  await db.migrate();
}, 60000);
afterAll(() => db.close());
beforeEach(() => db.begin());
afterEach(() => db.rollback());

/** id del seed ('tomi') ↔ uuid de jugador en la base, y uuid de usuario de cada uno con cuenta. */
const accounts = Object.values(seedPlayers).filter((p) => !p.isGuest);
const userOf: Record<string, string> = Object.fromEntries(
  accounts.map((p, i) => [p.id, u(100 + i)]),
);
let pid: Record<string, string> = {};
let sid: Record<string, string> = {};

async function loadDemo() {
  await db.admin();
  pid = {};
  for (const p of Object.values(seedPlayers)) {
    if (p.isGuest) {
      const [r] = await db.query<{ id: string }>(
        `insert into public.players (display_name, full_name, initials, avatar_color) values ($1, $2, $3, 'transparent') returning id`,
        [p.name, p.fullName, p.initials],
      );
      pid[p.id] = r.id;
    } else {
      await db.query('insert into auth.users (id, email) values ($1, $2)', [
        userOf[p.id],
        `${p.id}@punto.test`,
      ]);
      const [r] = await db.query<{ id: string }>(
        `update public.players set display_name = $2, full_name = $3, initials = $4, avatar_color = $5 where profile_id = $1 returning id`,
        [userOf[p.id], p.name, p.fullName, p.initials, p.avatarColor],
      );
      pid[p.id] = r.id;
    }
  }
  sid = Object.fromEntries(Object.entries(pid).map(([k, v]) => [v, k]));
  const gid: Record<string, string> = {};
  for (const g of seedGroups) {
    const [r] = await db.query<{ id: string }>(
      `insert into public.groups (name, initials, color) values ($1, $2, $3) returning id`,
      [g.name, g.initials, g.color],
    );
    gid[g.id] = r.id;
    for (const m of g.memberIds)
      await db.query(
        'insert into public.group_members (group_id, player_id, role) values ($1, $2, $3)',
        [r.id, pid[m], g.adminIds.includes(m) ? 'admin' : 'member'],
      );
  }
  for (const m of seedMatches) {
    const [r] = await db.query<{ id: string }>(
      `insert into public.matches (group_id, played_on, format, created_by) values ($1, $2, $3, $4) returning id`,
      [gid[m.groupId], m.date, m.format, userOf[m.createdBy]],
    );
    for (const [i, id] of [...m.teamA, ...m.teamB].entries())
      await db.query('insert into public.match_players values ($1, $2, $3, $4)', [
        r.id,
        pid[id],
        i < 2 ? 'A' : 'B',
        (i % 2) + 1,
      ]);
    for (const [i, s] of m.sets.entries())
      await db.query('insert into public.match_sets values ($1, $2, $3, $4)', [
        r.id,
        i + 1,
        s[0],
        s[1],
      ]);
  }
  // El seed del prototipo también cumple las reglas del servidor (4 jugadores del grupo, sets válidos).
  await db.exec('set constraints all immediate');
  await db.exec('set constraints all deferred'); // como en producción: se chequea al cerrar cada transacción
  return gid;
}

async function snapshotAs(seedId: string): Promise<Snapshot> {
  await db.as(userOf[seedId]);
  return parseSnapshot(await db.rpc('app_snapshot'));
}

/** Traduce los ids de la base a los del seed para comparar con las cifras del prototipo. */
const names = (ids: string[]) =>
  ids
    .map((i) => sid[i])
    .sort()
    .join('+');
const byGroup = (s: Snapshot, name: string) => {
  const g = s.groups.find((x) => x.name === name)!;
  return { g, ms: s.matches.filter((m) => m.groupId === g.id) };
};

describe('cifras del prototipo calculadas desde la base', () => {
  it('perfil global de Tomi: 22 PJ, 14 G, 8 P, 64%, sets 32-20, racha 3, mejor racha 5', async () => {
    await loadDemo();
    const s = await snapshotAs('tomi');
    expect(s.me).toBe(pid.tomi);
    expect(s.matches).toHaveLength(36);
    const t = playerStats(s.matches, s.me);
    expect([t.pj, t.g, t.p, t.pct, t.setsW, t.setsL, t.setsPct, t.streak, t.best]).toEqual([
      22,
      14,
      8,
      64,
      32,
      20,
      62,
      { type: 'W', n: 3 },
      5,
    ]);
  });

  it('rankings de Los del Jueves y Los Pibes', async () => {
    await loadDemo();
    const s = await snapshotAs('tomi');
    const fmt = (name: string) => {
      const { g, ms } = byGroup(s, name);
      const r = groupRanking(ms, g, s.players);
      return {
        q: r.qualified.map(
          (x) => `${x.pos}${x.tied ? '=' : ''} ${sid[x.id]} ${x.pj}/${x.g} ${x.pct}`,
        ),
        p: r.provisional.map((x) => `${sid[x.id]} ${x.pj}/${x.g}`),
      };
    };
    expect(fmt('Los del Jueves')).toEqual({
      q: [
        '1 fran 15/11 73',
        '2 tomi 14/9 64',
        '3 nico 16/8 50',
        '4 lean 13/6 46',
        '5 mati 14/6 43',
        '6 juani 12/5 42',
        '7 santi 8/2 25',
      ],
      p: ['pipo 4/1'],
    });
    expect(fmt('Los Pibes')).toEqual({
      q: [
        '1 bruno 6/5 83',
        '2 colo 5/4 80',
        '3 tomi 8/5 63',
        '4 tincho 5/3 60',
        '5 joaco 5/2 40',
        '6 agus 5/2 40',
        '7 gonza 6/2 33',
        '8 facu 5/0 0',
      ],
      p: ['fede 2/1', 'rama 1/0'],
    });
  });

  it('cara a cara y duplas', async () => {
    await loadDemo();
    const s = await snapshotAs('tomi');
    const nico = h2h(s.matches, s.me, pid.nico);
    expect([nico.total, nico.aW, nico.bW, nico.together.n]).toEqual([10, 8, 2, 0]);
    const fran = h2h(s.matches, s.me, pid.fran);
    expect([fran.total, fran.aW, fran.together.n, fran.together.w]).toEqual([3, 1, 5, 4]);
    const { ms } = byGroup(s, 'Los del Jueves');
    const d = duoStats(ms)
      .qualified.slice(0, 2)
      .map((x) => `${names(x.ids)} ${x.n}/${x.w} ${x.pct}`);
    expect(d).toEqual(['fran+tomi 5/4 80', 'fran+lean 4/3 75']);
  });

  it('el motor da lo mismo con datos de la base que con el seed en memoria', async () => {
    await loadDemo();
    const s = await snapshotAs('tomi');
    const fromDb = playerStats(s.matches, s.me);
    const fromSeed = playerStats(seedMatches as Match[], 'tomi');
    expect([fromDb.pj, fromDb.g, fromDb.setsW, fromDb.setsL, fromDb.streak, fromDb.best]).toEqual([
      fromSeed.pj,
      fromSeed.g,
      fromSeed.setsW,
      fromSeed.setsL,
      fromSeed.streak,
      fromSeed.best,
    ]);
    expect(
      newestFirst(s.matches)
        .slice(0, 3)
        .map((m) => m.date),
    ).toEqual(['2026-10-29', '2026-10-25', '2026-10-22']);
  });

  it('cada jugador ve su propio historial; los invitados no ven a nadie (no tienen cuenta)', async () => {
    await loadDemo();
    const gonza = await snapshotAs('gonza');
    expect(gonza.groups.map((g) => g.name)).toEqual(['Los Pibes']);
    expect(gonza.matches).toHaveLength(12);
    expect(playerStats(gonza.matches, gonza.me).pj).toBe(6);
    // Gonza no ve a los de Los del Jueves que no comparten grupo con él.
    expect(Object.keys(gonza.players).some((i) => sid[i] === 'fran')).toBe(false);
  });
});

describe('recálculo al cargar, corregir y borrar', () => {
  it('cargar un partido suma a todo; corregirlo y borrarlo lo deshace', async () => {
    const gid = await loadDemo();
    await db.as(userOf.tomi);
    const created = await db.rpc<{ id: string }>('record_match', {
      p_group_id: gid.jueves,
      p_played_on: '2026-10-31',
      p_format: 'bo3',
      p_team_a: [pid.tomi, pid.fran],
      p_team_b: [pid.nico, pid.lean],
      p_sets: [
        [6, 4],
        [6, 3],
      ],
    });

    let s = await snapshotAs('tomi');
    let t = playerStats(s.matches, s.me);
    expect([t.pj, t.g, t.pct, t.streak]).toEqual([23, 15, 65, { type: 'W', n: 4 }]);
    let hn = h2h(s.matches, s.me, pid.nico);
    expect([hn.total, hn.aW, hn.bW]).toEqual([11, 9, 2]);
    let { g, ms } = byGroup(s, 'Los del Jueves');
    expect(
      groupRanking(ms, g, s.players)
        .qualified.map((r) => `${sid[r.id]} ${r.pj}/${r.g}`)
        .slice(0, 2),
    ).toEqual(['fran 16/12', 'tomi 15/10']);
    expect(duoStats(ms).qualified[0]).toMatchObject({ n: 6, w: 5 });
    // El resto del mundo no cambia.
    expect(playerStats(s.matches, pid.bruno).pj).toBe(6);

    // Corregir: ahora lo ganan Nico y Lean.
    await db.as(userOf.tomi);
    await db.rpc(
      'update_match',
      updateArgs(created.id, {
        p_played_on: '2026-10-31',
        p_format: 'bo3',
        p_team_a: [pid.tomi, pid.fran],
        p_team_b: [pid.nico, pid.lean],
        p_sets: [
          [3, 6],
          [4, 6],
        ],
      }),
    );
    s = await snapshotAs('tomi');
    t = playerStats(s.matches, s.me);
    expect([t.pj, t.g, t.p, t.streak]).toEqual([23, 14, 9, { type: 'L', n: 1 }]);
    hn = h2h(s.matches, s.me, pid.nico);
    expect([hn.total, hn.aW, hn.bW]).toEqual([11, 8, 3]);
    expect(s.matches.find((m) => m.id === created.id)!.edited).toBe(true);

    // Borrar: vuelve a las cifras originales.
    await db.as(userOf.tomi);
    await db.rpc('delete_match', { p_match_id: created.id });
    s = await snapshotAs('tomi');
    t = playerStats(s.matches, s.me);
    expect([t.pj, t.g, t.p, t.pct, t.streak]).toEqual([22, 14, 8, 64, { type: 'W', n: 3 }]);
    ({ g, ms } = byGroup(s, 'Los del Jueves'));
    expect(groupRanking(ms, g, s.players).qualified[0]).toMatchObject({ pj: 15, g: 11, pct: 73 });
  });

  it('un partido de un invitado cuenta para él en el grupo y una sola vez en el perfil de los demás', async () => {
    const gid = await loadDemo();
    await db.as(userOf.tomi);
    await db.rpc('record_match', {
      p_group_id: gid.jueves,
      p_played_on: '2026-10-31',
      p_format: 'one',
      p_team_a: [pid.tomi, pid.pipo],
      p_team_b: [pid.nico, pid.lean],
      p_sets: [[6, 2]],
    });
    const s = await snapshotAs('tomi');
    expect(playerStats(s.matches, pid.pipo)).toMatchObject({ pj: 5, g: 2 });
    const pipo = groupRanking(
      byGroup(s, 'Los del Jueves').ms,
      byGroup(s, 'Los del Jueves').g,
      s.players,
    );
    expect(pipo.qualified.find((r) => r.id === pid.pipo)).toBeDefined(); // llegó a 5: entra al ranking
    expect(playerStats(s.matches, s.me).pj).toBe(23);
  });
});
