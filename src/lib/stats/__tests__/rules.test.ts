/** Reglas de CLAUDE.md y HANDOFF.md expresadas como casos concretos. */
import { analyze, groupRanking, h2hHeadline, pct, validSet, validSuper, winnerOf } from '..';
import type { Match } from '..';

const m = (
  id: string,
  date: string,
  a: [string, string],
  b: [string, string],
  aWins = true,
): Match => ({
  id,
  groupId: 'g',
  date,
  seq: 0,
  teamA: a,
  teamB: b,
  format: 'one',
  sets: [aWins ? [6, 2] : [2, 6]],
  createdBy: a[0],
  edited: false,
});

describe('redondeo único: .5 sube', () => {
  it.each([
    [1, 8, 13], // 12,5
    [3, 8, 38], // 37,5
    [1, 3, 33],
    [2, 3, 67],
    [0, 0, 0],
  ])('pct(%i, %i) = %i', (w, n, expected) => expect(pct(w, n)).toBe(expected));
});

describe('sets válidos', () => {
  it('6-0 a 6-4, 7-5 y 7-6', () => {
    for (const [a, b] of [
      [6, 0],
      [6, 4],
      [4, 6],
      [7, 5],
      [7, 6],
      [6, 7],
    ])
      expect(validSet(a, b)).toBe(true);
    for (const [a, b] of [
      [6, 5],
      [6, 6],
      [7, 4],
      [8, 6],
      [5, 3],
      [0, 0],
    ])
      expect(validSet(a, b)).toBe(false);
  });

  it('súper tie-break: a 10 con 2 de diferencia; si pasa de 10, diferencia exacta de 2', () => {
    for (const [a, b] of [
      [10, 0],
      [10, 8],
      [12, 10],
      [9, 11],
    ])
      expect(validSuper(a, b)).toBe(true);
    for (const [a, b] of [
      [10, 9],
      [9, 7],
      [12, 9],
      [11, 10],
    ])
      expect(validSuper(a, b)).toBe(false);
  });
});

describe('analyze', () => {
  it('el ganador se calcula desde los sets', () => {
    expect(
      winnerOf({
        format: 'bo3',
        sets: [
          [3, 6],
          [6, 4],
          [7, 5],
        ],
      }),
    ).toBe('A');
    expect(
      winnerOf({
        format: 'st',
        sets: [
          [6, 3],
          [4, 6],
          [8, 10],
        ],
      }),
    ).toBe('B');
  });

  it('pide el tercer set solo si los dos primeros quedan 1-1', () => {
    expect(
      analyze('bo3', [
        [6, 3],
        [6, 4],
      ]).visible,
    ).toBe(2);
    expect(
      analyze('bo3', [
        [6, 3],
        [4, 6],
      ]).visible,
    ).toBe(3);
  });

  it('mensajes de faltantes y errores', () => {
    const r = analyze(
      'st',
      [
        [6, 3],
        [4, 6],
        [10, 9],
      ],
      ['tomi', null, 'nico', ''],
    );
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(['faltan 2 jugadores', 'el súper tie-break no es válido']);
    expect(r.setErrs[2]).toBe(
      '10-9 no cierra el súper tie-break. Se gana llegando a 10 con 2 de diferencia.',
    );
    expect(analyze('one', [[6, 5]]).setErrs[0]).toBe(
      '6-5 no cierra un set. Valen 6-0 a 6-4, 7-5 o 7-6.',
    );
    expect(analyze('one', []).missing).toEqual(['falta el set 1']);
  });
});

describe('ranking', () => {
  const players = {
    a: { name: 'Ana' },
    b: { name: 'Bea' },
    c: { name: 'Cata' },
    d: { name: 'Dani' },
  };
  const group = { id: 'g', memberIds: ['a', 'b', 'c', 'd'] };

  it('menos de 5 partidos: provisorio, sin puesto', () => {
    const ms = [1, 2, 3, 4].map((i) => m('x' + i, '2026-01-0' + i, ['a', 'b'], ['c', 'd']));
    const r = groupRanking(ms, group, players);
    expect(r.qualified).toEqual([]);
    expect(r.provisional.map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('empate total comparte puesto («=1»)', () => {
    const ms = [1, 2, 3, 4, 5].map((i) =>
      m('x' + i, '2026-01-0' + i, ['a', 'b'], ['c', 'd'], i % 2 === 0),
    );
    const r = groupRanking(ms, group, players);
    expect(r.qualified.map((x) => [x.id, x.pos, x.tied])).toEqual([
      ['c', 1, true],
      ['d', 1, true],
      ['a', 3, true],
      ['b', 3, true],
    ]);
  });
});

describe('cara a cara sin veredicto con muestra chica', () => {
  it.each([
    [{ total: 4, aW: 4, bW: 0 }, 'Muestra chica.'],
    [{ total: 5, aW: 3, bW: 2 }, 'Mano a mano.'],
    [{ total: 6, aW: 4, bW: 2 }, 'Viene ganando Ana.'],
    [{ total: 5, aW: 1, bW: 4 }, 'Hay historial.'],
  ])('%o → %s', (r, title) => expect(h2hHeadline(r, 'Ana', 'Bea').title).toBe(title));
});
