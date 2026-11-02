/**
 * La validación del servidor tiene que ser la misma que la del motor (src/lib/stats):
 * lo que la app deja confirmar, la base lo acepta, y al revés.
 */
import { analyze, validSet, validSuper, type MatchFormat, type SetScore } from '@/lib/stats';

import { Db } from './harness';

let db: Db;
beforeAll(async () => {
  db = new Db();
  await db.migrate();
  await db.exec(`
    create function pg_temp.try_result(f text, s jsonb) returns text language plpgsql as $$
    begin return private.match_result(f, s); exception when others then return 'ERR'; end $$;
  `);
}, 60000);
afterAll(() => db.close());

describe('paridad SQL ↔ motor', () => {
  it('set y súper tie-break: todos los marcadores de 0 a 30', async () => {
    const rows = await db.query<{ a: number; b: number; s: boolean; t: boolean }>(
      `select a, b, private.is_valid_set(a, b) s, private.is_valid_super(a, b) t
         from generate_series(0, 30) a, generate_series(0, 30) b`,
    );
    expect(rows).toHaveLength(961);
    for (const r of rows) {
      expect([r.a, r.b, r.s, r.t]).toEqual([r.a, r.b, validSet(r.a, r.b), validSuper(r.a, r.b)]);
    }
  });

  it('resultado completo: ganador o error, para todas las combinaciones de hasta 3 sets', async () => {
    const candidates: SetScore[] = [
      [6, 0],
      [6, 4],
      [4, 6],
      [0, 6],
      [7, 5],
      [5, 7],
      [7, 6],
      [6, 7],
      [6, 5],
      [7, 4],
      [6, 6],
      [0, 0],
      [10, 4],
      [4, 10],
      [10, 8],
      [8, 10],
      [10, 9],
      [12, 10],
      [10, 12],
      [11, 9],
      [15, 13],
      [9, 7],
    ];
    const formats: MatchFormat[] = ['one', 'bo3', 'st'];
    const cases: { f: MatchFormat; sets: SetScore[] }[] = [];
    for (const f of formats) {
      cases.push({ f, sets: [] });
      for (const a of candidates) {
        cases.push({ f, sets: [a] });
        for (const b of candidates) {
          cases.push({ f, sets: [a, b] });
          for (const c of candidates) cases.push({ f, sets: [a, b, c] });
        }
      }
    }
    const out = await db.query<{ i: number; r: string }>(
      `select (c ->> 'i')::int i, pg_temp.try_result(c ->> 'f', c -> 'sets') r
         from jsonb_array_elements($1::jsonb) c`,
      [JSON.stringify(cases.map((c, i) => ({ i, f: c.f, sets: c.sets })))],
    );
    expect(out).toHaveLength(cases.length);
    let valid = 0;
    for (const { i, r } of out) {
      const { f, sets } = cases[i];
      const an = analyze(f, sets);
      // El servidor es más estricto con la cantidad: tienen que venir exactamente los sets que cuentan.
      const expected = sets.length === an.visible && an.ok ? an.winner : 'ERR';
      if (r !== expected)
        throw new Error(`${f} ${JSON.stringify(sets)}: servidor ${r}, motor ${expected}`);
      if (expected !== 'ERR') valid++;
    }
    expect(valid).toBeGreaterThan(500); // hay casos válidos de los tres formatos
  }, 120000);

  it('rechaza formatos y estructuras raras', async () => {
    for (const [f, s] of [
      ['raro', [[6, 0]]],
      ['one', null],
      ['one', {}],
      ['one', [6, 0]],
      ['one', [[6]]],
      ['one', [['6', '0']]],
      ['one', [[6.5, 0]]],
      ['one', [[-6, 0]]],
      ['one', [[600, 0]]],
    ] as const) {
      const [{ r }] = await db.query<{ r: string }>(`select pg_temp.try_result($1, $2::jsonb) r`, [
        f,
        JSON.stringify(s),
      ]);
      expect(r).toBe('ERR');
    }
  });
});
