/**
 * Cifras del prototipo (design/logic/test.js). Cada valor que el test original
 * comprueba o imprime está fijado acá: si alguno cambia, el port dejó de coincidir.
 */
import { groups, matches as ms, players as P } from '@/lib/demo/seed';

import {
  duoStats,
  fmtMonthYear,
  fmtShort,
  groupRanking,
  h2h,
  h2hHeadline,
  newestFirst,
  partnersAndRivals,
  playerStats,
  relDay,
  winnerOf,
  type GroupRanking,
} from '..';

const [J, Pb] = groups;
const mj = ms.filter((m) => m.groupId === 'jueves');
const mp = ms.filter((m) => m.groupId === 'pibes');

/** Mismo formato que imprime design/logic/test.js. */
const fmtRanking = (r: GroupRanking) => ({
  qualified: r.qualified.map((x) => `${x.pos}${x.tied ? '=' : ''} ${x.id} ${x.pj}/${x.g} ${x.pct}`),
  provisional: r.provisional.map((x) => `${x.id} ${x.pj}/${x.g}`),
});

describe('perfil de Tomi', () => {
  const t = playerStats(ms, 'tomi');

  it('global: 22 PJ, 14 G, 8 P, 64%, sets 32-20 (62%), racha 3, mejor racha 5', () => {
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

  it('por grupo: Jueves 14/9 64%, Pibes 8/5 63%', () => {
    const tj = playerStats(mj, 'tomi');
    const tp = playerStats(mp, 'tomi');
    expect([tj.pj, tj.g, tj.pct, tp.pj, tp.g, tp.pct]).toEqual([14, 9, 64, 8, 5, 63]);
  });

  it('últimos 5 partidos y primer partido', () => {
    expect(
      newestFirst(t.matches)
        .slice(0, 5)
        .map((m) => m.date),
    ).toEqual(['2026-10-29', '2026-10-25', '2026-10-22', '2026-10-18', '2026-10-15']);
    expect(fmtMonthYear(t.first!)).toBe('julio 2026');
  });
});

describe('datos', () => {
  it('24 partidos en Los del Jueves y 12 en Los Pibes', () => {
    expect([mj.length, mp.length]).toEqual([24, 12]);
  });

  it('en el seed gana siempre la pareja A', () => {
    expect(ms.filter((m) => winnerOf(m) !== 'A').map((m) => m.id)).toEqual([]);
  });
});

describe('ranking de grupo', () => {
  it('Los del Jueves', () => {
    expect(fmtRanking(groupRanking(mj, J, P))).toEqual({
      qualified: [
        '1 fran 15/11 73',
        '2 tomi 14/9 64',
        '3 nico 16/8 50',
        '4 lean 13/6 46',
        '5 mati 14/6 43',
        '6 juani 12/5 42',
        '7 santi 8/2 25',
      ],
      provisional: ['pipo 4/1'],
    });
  });

  it('Los Pibes', () => {
    expect(fmtRanking(groupRanking(mp, Pb, P))).toEqual({
      qualified: [
        '1 bruno 6/5 83',
        '2 colo 5/4 80',
        '3 tomi 8/5 63',
        '4 tincho 5/3 60',
        '5 joaco 5/2 40',
        '6 agus 5/2 40',
        '7 gonza 6/2 33',
        '8 facu 5/0 0',
      ],
      provisional: ['fede 2/1', 'rama 1/0'],
    });
  });
});

describe('cara a cara', () => {
  it('Tomi vs Nico: 10 cruces, 8-2, nunca juntos', () => {
    const h = h2h(ms, 'tomi', 'nico');
    expect([h.total, h.aW, h.bW, h.together.n]).toEqual([10, 8, 2, 0]);
    expect(h.meetings.slice(0, 4).map((x) => x.m.date + (x.aWon ? 'W' : 'L'))).toEqual([
      '2026-10-29W',
      '2026-10-22W',
      '2026-10-08W',
      '2026-10-01L',
    ]);
    expect(h2hHeadline(h, 'Tomi', 'Nico')).toEqual({
      title: 'Hay historial.',
      sub: 'Tomi ganó 8 de los 10 cruces.',
      small: false,
    });
  });

  it('Tomi vs Fran: 3 cruces (1 ganado), 5 juntos con 4 ganados, muestra chica', () => {
    const hf = h2h(ms, 'tomi', 'fran');
    expect([hf.total, hf.aW, hf.together.n, hf.together.w]).toEqual([3, 1, 5, 4]);
    expect(h2hHeadline(hf, 'Tomi', 'Fran')).toEqual({
      title: 'Muestra chica.',
      sub: '3 cruces. Todavía no hay veredicto.',
      small: true,
    });
  });

  it('Tomi vs Pipo: 2-0 y una vez juntos', () => {
    const hp = h2h(ms, 'tomi', 'pipo');
    expect([hp.total, hp.aW, hp.bW, hp.together]).toEqual([2, 2, 0, { n: 1, w: 1 }]);
    expect(hp.meetings[0].m.id).toBe('m29');
  });

  it('en Los Pibes, Tomi nunca se cruzó con Fede (estado «sin cruces»)', () => {
    const never = Pb.memberIds.filter((x) => {
      if (x === 'tomi') return false;
      const r = h2h(mp, 'tomi', x);
      return !r.total && !r.together.n;
    });
    expect(never).toEqual(['fede']);
    expect(h2hHeadline(h2h(mp, 'tomi', 'fede'), 'Tomi', 'Fede')).toEqual({
      title: 'Todavía no se cruzaron.',
      sub: '',
      small: false,
    });
  });
});

describe('duplas', () => {
  const fmt = (d: { ids: string[]; n: number; w: number; pct: number }) =>
    `${d.ids.join('+')} ${d.n}/${d.w} ${d.pct}`;
  const fmtProv = (d: { ids: string[]; n: number; w: number }) =>
    `${d.ids.join('+')} ${d.n}/${d.w}`;

  it('Los del Jueves: destacadas y provisorias', () => {
    const dj = duoStats(mj);
    expect(dj.qualified.map(fmt)).toEqual([
      'fran+tomi 5/4 80',
      'fran+lean 4/3 75',
      'juani+nico 3/2 67',
      'mati+nico 3/2 67',
      'mati+tomi 3/2 67',
      'lean+nico 6/2 33',
      'juani+mati 3/1 33',
    ]);
    expect(dj.provisional.map(fmtProv)).toEqual([
      'fran+juani 1/1',
      'fran+nico 1/1',
      'nico+santi 1/1',
      'pipo+tomi 1/1',
      'fran+mati 2/1',
      'fran+santi 2/1',
      'juani+tomi 2/1',
      'lean+tomi 2/1',
      'juani+santi 2/0',
      'mati+santi 2/0',
      'nico+pipo 2/0',
      'juani+lean 1/0',
      'mati+pipo 1/0',
      'santi+tomi 1/0',
    ]);
  });

  it('Los Pibes: una sola dupla destacada', () => {
    expect(duoStats(mp).qualified.map(fmt)).toEqual(['bruno+tomi 4/3 75']);
  });
});

describe('compañeros y rivales de Tomi', () => {
  const pr = partnersAndRivals(ms, 'tomi');
  it('compañeros', () => {
    expect(pr.partners.slice(0, 4).map((x) => `${x.id} ${x.n}/${x.w}`)).toEqual([
      'fran 5/4',
      'bruno 4/3',
      'mati 3/2',
      'juani 2/1',
    ]);
  });
  it('rivales', () => {
    expect(pr.rivals.slice(0, 5).map((x) => `${x.id} ${x.n}/${x.w}`)).toEqual([
      'nico 10/8',
      'lean 5/4',
      'gonza 5/3',
      'mati 4/2',
      'colo 3/1',
    ]);
  });
});

describe('fechas', () => {
  it('formatos', () => {
    expect(fmtShort('2026-10-29')).toBe('Jue 29 oct');
    expect(relDay('2026-10-25', '2026-10-31')).toBe('hace 6 días');
  });
});
