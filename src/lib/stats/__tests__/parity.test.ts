/**
 * Test diferencial: corre el motor original (design/logic/engine.js, sin tocar) y el port
 * TypeScript sobre las mismas entradas y exige resultados idénticos. Cubre el seed completo,
 * todos los marcadores posibles y partidos aleatorios (semilla fija, reproducible).
 */
import * as seed from '@/lib/demo/seed';
import { avatarTextColor } from '@/theme/colors';

import * as TS from '..';
import type { Match, MatchFormat, SetScore } from '..';

type Fn = (...args: any[]) => any;
const JS = jest.requireActual<Record<string, Fn>>('../../../../design/logic/engine.js');
const JSD = jest.requireActual<any>('../../../../design/logic/seed.js');

const ms = seed.matches;
const allIds = Object.keys(seed.players);
const allGroups = [...seed.groups, seed.emptyGroup];
const jsGroup = (id: string) =>
  [...JSD.groups, JSD.emptyGroup].find((g: { id: string }) => g.id === id);

/** El original devuelve también `groups` (mapa interno) en compañeros y rivales; el port solo `groupIds`. */
const stripGroups = (r: { partners: object[]; rivals: object[] }) => ({
  partners: r.partners.map(({ groups: _g, ...x }: any) => x),
  rivals: r.rivals.map(({ groups: _g, ...x }: any) => x),
});

/** PRNG determinista (mulberry32). */
function rng(seedValue: number) {
  let a = seedValue;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Compara todas las funciones públicas del motor sobre un conjunto de partidos. */
function expectSameStats(list: readonly Match[]) {
  for (const pid of allIds) {
    expect(TS.playerStats(list, pid)).toEqual(JS.playerStats(list, pid));
    expect(TS.partnersAndRivals(list, pid)).toEqual(stripGroups(JS.partnersAndRivals(list, pid)));
  }
  for (const g of allGroups) {
    const inGroup = list.filter((m) => m.groupId === g.id);
    const jg = jsGroup(g.id);
    expect(TS.groupRanking(inGroup, g, seed.players)).toEqual(
      JS.groupRanking(inGroup, jg, JSD.players),
    );
    for (const pid of g.memberIds)
      expect(TS.rankOf(inGroup, g, seed.players, pid)).toEqual(
        JS.rankOf(inGroup, jg, JSD.players, pid),
      );
    expect(TS.duoStats(inGroup)).toEqual(JS.duoStats(inGroup));
    expect(TS.topDuo(inGroup)).toEqual(JS.topDuo(inGroup));
  }
  expect(TS.duoStats(list)).toEqual(JS.duoStats(list));
  for (const a of allIds)
    for (const b of allIds) {
      if (a === b) continue;
      const r = TS.h2h(list, a, b);
      expect(r).toEqual(JS.h2h(list, a, b));
      expect(TS.h2hHeadline(r, a, b)).toEqual(JS.h2hHeadline(r, a, b));
    }
  expect(TS.chrono(list)).toEqual(JS.chrono(list));
  expect(TS.newestFirst(list)).toEqual(JS.newestFirst(list));
}

describe('seed', () => {
  it('los partidos son idénticos al seed original', () => {
    expect(ms).toEqual(JSD.matches);
    expect([seed.me, seed.today]).toEqual([JSD.me, JSD.today]);
  });

  it('jugadores y grupos mapeados al modelo del handoff sin perder datos', () => {
    for (const id of Object.keys(JSD.players)) {
      const o = JSD.players[id];
      expect(seed.players[id]).toEqual({
        id: o.id,
        name: o.name,
        fullName: o.full,
        initials: o.ini,
        avatarColor: o.bg,
        isGuest: o.guest,
      });
      expect(avatarTextColor(o.bg)).toBe(o.fg);
    }
    expect(Object.keys(seed.players)).toEqual(Object.keys(JSD.players));
    for (const g of allGroups) {
      const o = jsGroup(g.id);
      expect(g).toEqual({
        id: o.id,
        name: o.name,
        initials: o.ini,
        color: o.bg,
        adminIds: o.admins,
        memberIds: o.members,
      });
    }
  });
});

describe('paridad con design/logic/engine.js', () => {
  it('constantes', () => {
    expect([TS.MIN_RANK, TS.MIN_DUO, TS.MIN_H2H, TS.FORMAT_LABEL]).toEqual([
      JS.MIN_RANK,
      JS.MIN_DUO,
      JS.MIN_H2H,
      JS.FORMAT_LABEL,
    ]);
  });

  it('redondeo', () => {
    for (let n = 0; n <= 60; n++)
      for (let w = 0; w <= n; w++) expect(TS.pct(w, n)).toBe(JS.pct(w, n));
  });

  it('estadísticas del seed completo', () => {
    expectSameStats(ms);
  });

  it('borrar cualquier partido recalcula todo igual (impacto incluido)', () => {
    for (const m of ms) {
      const after = ms.filter((x) => x.id !== m.id);
      expectSameStats(after);
      for (const g of seed.groups)
        expect(TS.impact(ms, after, seed.me, g, seed.players)).toEqual(
          JS.impact(ms, after, seed.me, jsGroup(g.id), JSD.players),
        );
    }
  });

  it('corregir un partido (invertir el resultado) recalcula todo igual', () => {
    for (const m of ms) {
      const flipped: Match = {
        ...m,
        edited: true,
        sets: m.sets.map(([a, b]) => [b, a] as SetScore),
      };
      const after = ms.map((x) => (x.id === m.id ? flipped : x));
      expectSameStats(after);
      const g = seed.groups.find((x) => x.id === m.groupId)!;
      for (const pid of [...m.teamA, ...m.teamB])
        expect(TS.impact(ms, after, pid, g, seed.players)).toEqual(
          JS.impact(ms, after, pid, jsGroup(g.id), JSD.players),
        );
    }
  });

  it('partidos aleatorios válidos (con empates de fecha y duplas repetidas)', () => {
    const rand = rng(20261031);
    const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
    const validSets: SetScore[] = [];
    for (let a = 0; a <= 7; a++)
      for (let b = 0; b <= 7; b++) if (TS.validSet(a, b)) validSets.push([a, b]);
    const supers: SetScore[] = [
      [10, 4],
      [8, 10],
      [12, 10],
      [10, 12],
      [15, 13],
    ];
    const winning = (s: SetScore[]) => s.filter(([a, b]) => a > b).length;
    for (let round = 0; round < 6; round++) {
      const list: Match[] = [];
      for (let i = 0; i < 40; i++) {
        const g = pick(seed.groups);
        const pool = g.memberIds.slice().sort(() => rand() - 0.5);
        const format = pick<MatchFormat>(['one', 'bo3', 'st']);
        let sets: SetScore[];
        if (format === 'one') sets = [pick(validSets)];
        else {
          sets = [pick(validSets), pick(validSets)];
          if (winning(sets) === 1) sets.push(format === 'st' ? pick(supers) : pick(validSets));
        }
        list.push({
          id: 'r' + round + '-' + String(i).padStart(2, '0'),
          groupId: g.id,
          date: '2026-0' + (1 + Math.floor(rand() * 9)) + '-1' + Math.floor(rand() * 10),
          seq: Math.floor(rand() * 5),
          teamA: [pool[0], pool[1]],
          teamB: [pool[2], pool[3]],
          format,
          sets,
          createdBy: pool[0],
          edited: false,
        });
      }
      expectSameStats(list);
    }
  });
});

describe('paridad de validación de resultados', () => {
  const formats: MatchFormat[] = ['one', 'bo3', 'st'];

  it('todos los marcadores de un set (0-15 × 0-15)', () => {
    for (const f of formats)
      for (let a = 0; a <= 15; a++)
        for (let b = 0; b <= 15; b++) {
          expect(TS.analyze(f, [[a, b]])).toEqual(JS.analyze(f, [[a, b]]));
          expect(
            TS.analyze(f, [
              [a, b],
              [6, 2],
            ]),
          ).toEqual(
            JS.analyze(f, [
              [a, b],
              [6, 2],
            ]),
          );
        }
  });

  it('todos los terceros sets y súper tie-breaks (0-20 × 0-20)', () => {
    for (const f of formats)
      for (let a = 0; a <= 20; a++)
        for (let b = 0; b <= 20; b++) {
          const sets: SetScore[] = [
            [6, 3],
            [4, 6],
            [a, b],
          ];
          expect(TS.analyze(f, sets)).toEqual(JS.analyze(f, sets));
        }
  });

  it('borradores incompletos con jugadores faltantes', () => {
    const rand = rng(42);
    const val = () => (rand() < 0.15 ? 0 : Math.floor(rand() * 13));
    for (let i = 0; i < 3000; i++) {
      const f = formats[i % 3];
      const n = Math.floor(rand() * 4);
      const sets: SetScore[] = [];
      for (let k = 0; k < n; k++) sets.push([val(), val()]);
      const ps = ['tomi', 'fran', 'nico', 'lean'].map((p) => (rand() < 0.3 ? null : p));
      expect(TS.analyze(f, sets, ps)).toEqual(JS.analyze(f, sets, ps));
      expect(TS.analyze(f, sets)).toEqual(JS.analyze(f, sets));
    }
  });
});

describe('paridad de fechas', () => {
  it('todos los días de 2026 y 2027', () => {
    const start = Date.UTC(2026, 0, 1);
    for (let i = 0; i < 730; i++) {
      const d = new Date(start + i * 86400000).toISOString().slice(0, 10);
      expect(TS.fmtShort(d)).toBe(JS.fmtShort(d));
      expect(TS.fmtLong(d)).toBe(JS.fmtLong(d));
      expect(TS.fmtMonthYear(d)).toBe(JS.fmtMonthYear(d));
      expect(TS.daysBetween(d, seed.today)).toBe(JS.daysBetween(d, seed.today));
      expect(TS.relDay(d, seed.today)).toBe(JS.relDay(d, seed.today));
    }
  });
});
