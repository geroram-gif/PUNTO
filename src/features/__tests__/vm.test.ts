/** View-models: cada texto y cifra de los estados del prototipo. */
import { blankDraft, initialState, type DemoScenario, type Draft } from '@/lib/store';

import { groupVM } from '../group/vm';
import { h2hVM } from '../h2h/vm';
import { homeVM } from '../home/vm';
import { matchSheetVM } from '../match/vm';
import { profileVM } from '../profile/vm';
import {
  bumpScore,
  clearSlot,
  draftFromMatch,
  guestError,
  pickPlayer,
  registerVM,
  selectDate,
} from '../register/vm';
import { resultVM } from '../result/vm';
import { makeCtx } from '../shared/ctx';

const today = '2026-10-31';
const ctx = (scenario: DemoScenario = 'demo', longNames = false) =>
  makeCtx(initialState({ scenario, loading: false }), { me: 'tomi', today, longNames });

describe('Inicio', () => {
  it('demo', () => {
    const vm = homeVM(ctx());
    expect(vm.dateLabel).toBe('Sábado 31 de octubre');
    expect(vm.win).toMatchObject({ pct: 64, pj: 22, g: 14, p: 8, scopeLabel: 'Global · 2 grupos' });
    expect(vm.streak).toMatchObject({
      tone: 'win',
      big: '3',
      title: 'al hilo.',
      text: 'Ganaste tus últimos 3 partidos · mejor racha: 5',
    });
    expect(vm.rival).toMatchObject({
      group: 'Los del Jueves',
      title: 'Hay historial.',
      text: 'Le ganaste 8 de 10 cruces a Nico.',
      score: '8-2',
    });
    expect(vm.activity.map((a) => a.meta)).toEqual([
      'Los del Jueves · hace 2 días',
      'Los Pibes · hace 6 días',
      'Los del Jueves · hace 9 días',
    ]);
    expect(vm.groups.map((g) => [g.badge, g.badgeSub])).toEqual([
      ['#2', 'de 7'],
      ['#3', 'de 8'],
    ]);
  });
  it('usuario nuevo: sin cifras inventadas', () => {
    const vm = homeVM(ctx('usuario-nuevo'));
    expect([vm.hasData, vm.win, vm.streak, vm.rival, vm.groups]).toEqual([
      false,
      null,
      null,
      null,
      [],
    ]);
  });
  it('grupo sin partidos: aparece con «—» y «sin partidos»', () => {
    const g = homeVM(ctx('grupo-sin-partidos')).groups[0];
    expect([g.name, g.meta, g.badge, g.badgeSub]).toEqual([
      'Los del Martes',
      '5 miembros · sin partidos todavía',
      '—',
      'sin partidos',
    ]);
  });
});

describe('Grupo', () => {
  it('vacío: todos provisorios, sin ranking ni duplas', () => {
    const g = groupVM(ctx('grupo-sin-partidos'), 'martes')!;
    expect([g.isEmpty, g.place, g.duo, g.rivalry, g.ranking.length, g.showProvisional]).toEqual([
      true,
      null,
      null,
      null,
      0,
      true,
    ]);
    expect(g.provisional.map((r) => [r.name, r.meta, r.left])).toEqual([
      ['Bruno', 'Todavía no jugó', 'Faltan 5'],
      ['Caro', 'Todavía no jugó', 'Faltan 5'],
      ['Fran', 'Todavía no jugó', 'Faltan 5'],
      ['Mati', 'Todavía no jugó', 'Faltan 5'],
      ['Tomi', 'Todavía no jugó', 'Faltan 5'],
    ]);
    expect(g.emptyText).toBe(
      'Ya son 5. Cuando carguen el primer partido aparecen el ranking, las duplas y las rivalidades.',
    );
    expect(g.guestsLabel).toBe('1 invitado');
  });
  it('Los Pibes: provisorios con invitado y progreso', () => {
    const g = groupVM(ctx(), 'pibes')!;
    expect(g.provisional.map((r) => [r.name, r.guest, r.meta, r.left, r.played])).toEqual([
      ['Fede', true, '2 partidos · 1 ganado', 'Faltan 3', 2],
      ['Rama', false, '1 partido · 0 ganados', 'Faltan 4', 1],
    ]);
    expect(g.duos.map((d) => d.meta)).toEqual(['4 juntos · 3 G · 1 P · la del momento']);
    expect(g.more).toBe('+5');
  });
  it('sin grupo: null («Todavía no tenés grupos.»)', () => {
    expect(groupVM(ctx('usuario-nuevo'), null)).toBeNull();
  });
  it('nombres largos', () => {
    expect(groupVM(ctx('demo', true), 'jueves')!.name).toBe(
      'Los del Jueves de Olivos y alrededores',
    );
  });
});

describe('Cara a cara', () => {
  it('sin cruces (Fede en Los Pibes)', () => {
    const vm = h2hVM(ctx(), 'pibes', 'fede')!;
    expect([vm.hasHistory, vm.rvGuest, vm.emptyText]).toEqual([
      false,
      true,
      'Todavía no compartieron cancha en Los Pibes. Cuando jueguen en lados opuestos, acá aparece el historial.',
    ]);
  });
  it('muestra chica (Pipo)', () => {
    const vm = h2hVM(ctx(), 'jueves', 'pipo')!;
    expect([vm.score, vm.title, vm.sub, vm.small, vm.together]).toEqual([
      '2-0',
      'Muestra chica.',
      '2 cruces. Todavía no hay veredicto.',
      true,
      'Como dupla: 1 juntos, 1 ganados.',
    ]);
  });
  it('mano a mano (Gonza en Los Pibes) y tarjeta para compartir', () => {
    const vm = h2hVM(ctx(), 'pibes', 'gonza')!;
    expect([vm.score, vm.title]).toEqual(['3-2', 'Mano a mano.']);
    expect(vm.share.text).toBe('Tomi vs Gonza: 3-2 en Los Pibes. Mano a mano. PUNTO.');
  });
  it('sin grupos: null («Sin rivales todavía.»)', () => {
    expect(h2hVM(ctx('usuario-nuevo'), null, 'nico')).toBeNull();
  });
});

describe('Perfil', () => {
  it('demo', () => {
    const vm = profileVM(ctx());
    expect([vm.scope, vm.since, vm.setsPct]).toEqual([
      'Perfil global · 2 grupos',
      'Tomi · juega en PUNTO desde julio 2026',
      62,
    ]);
    expect(vm.recent[3]).toMatchObject({
      won: false,
      title: 'Con Facu vs Bruno y Gonza',
      score: '3-6 4-6',
    });
  });
  it('usuario nuevo', () => {
    const vm = profileVM(ctx('usuario-nuevo'));
    expect([vm.hasData, vm.since, vm.scope]).toEqual([
      false,
      'Tomi · todavía sin partidos',
      'Perfil global · 0 grupos',
    ]);
  });
});

describe('Registrar', () => {
  const c = ctx();
  it('borrador vacío: pide jugadores y sets', () => {
    const vm = registerVM(c, blankDraft('jueves', today), false)!;
    expect([vm.title, vm.countLabel, vm.ok, vm.helper]).toEqual([
      'Nuevo partido',
      '0 de 4',
      false,
      'Para seguir: faltan 4 jugadores, falta el set 1, falta el set 2.',
    ]);
    expect(vm.thirdHint).toBe('Si quedan 1 a 1 en sets, aparece el tercero.');
    expect(vm.slotsA.map((s) => s.text)).toEqual(['Elegí abajo', 'Jugador 2']);
  });
  it('lleno: «Ya están los 4.»; repetido: aviso', () => {
    let d = blankDraft('jueves', today);
    for (const p of ['tomi', 'fran', 'nico', 'lean']) d = pickPlayer(c, d, p);
    expect(pickPlayer(c, d, 'mati').notice).toBe('Ya están los 4. Tocá un lugar para liberarlo.');
    expect(pickPlayer(c, d, 'nico').notice).toBe(
      'Nico ya está en la Pareja B. Un jugador no puede estar dos veces: tocá su lugar para cambiarlo.',
    );
    expect(clearSlot(d, 1).slots).toEqual(['tomi', null, 'nico', 'lean']);
  });
  it('súper tie-break: tope 25, tercera fila «Súper»', () => {
    let d: Draft = {
      ...blankDraft('jueves', today),
      format: 'st',
      sets: [
        [6, 3],
        [4, 6],
        [0, 0],
      ],
    };
    for (let i = 0; i < 30; i++) d = bumpScore(d, 2, 0, 1);
    const vm = registerVM(c, d, false)!;
    expect(vm.setRows.map((r) => r.label)).toEqual(['Set 1', 'Set 2', 'Súper']);
    expect(vm.setRows[2].a).toBe(25);
    expect(vm.setRows[2].err).toBe(
      '25-0 no cierra el súper tie-break. Se gana llegando a 10 con 2 de diferencia.',
    );
  });
  it('fechas e invitados', () => {
    expect(selectDate(blankDraft('jueves', today), 'ayer', today).date).toBe('2026-10-30');
    expect(guestError(c, 'jueves', ' ')).toBe('Escribí un nombre.');
    expect(guestError(c, 'jueves', 'pipo')).toBe('Ya hay alguien con ese nombre en el grupo.');
    expect(guestError(c, 'jueves', 'Lucho')).toBe('');
  });
  it('corregir: bloquea el cambio de grupo', () => {
    const vm = registerVM(c, draftFromMatch(c, 'm36'), true)!;
    expect([vm.title, vm.ok, vm.groups.map((g) => g.locked)]).toEqual([
      'Corregir partido',
      true,
      [false, true],
    ]);
    expect(vm.review!.meta).toBe('Jue 29 oct · Los del Jueves · Mejor de 3');
  });
});

describe('Resultado', () => {
  it('derrota: se corta la racha y baja el %', () => {
    const s = initialState({ scenario: 'demo', loading: false });
    s.matches.push({
      id: 'n1',
      groupId: 'jueves',
      date: today,
      seq: 99,
      teamA: ['nico', 'lean'],
      teamB: ['tomi', 'fran'],
      format: 'one',
      sets: [[6, 2]],
      createdBy: 'tomi',
      edited: false,
    });
    const vm = resultVM(makeCtx(s, { me: 'tomi', today }), 'n1')!;
    expect([vm.meta, vm.winnerNames, vm.loserNames, vm.sets, vm.scoreSize]).toEqual([
      'Los del Jueves · Hoy',
      'Nico y Lean',
      'Tomi y Fran',
      ['6-2'],
      104,
    ]);
    expect([vm.title, vm.text, vm.lines]).toEqual([
      'Se cortó la racha.',
      'Venías de 3 al hilo. Se viene revancha.',
      ['Tu % global: 64% → 61% · 23 partidos'],
    ]);
    expect(vm.h2h!.label).toBe('Cara a cara con Nico · 8-3');
  });
  it('partido sin Tomi', () => {
    const s = initialState({ scenario: 'demo', loading: false });
    s.matches.push({
      id: 'n1',
      groupId: 'jueves',
      date: '2026-10-30',
      seq: 99,
      teamA: ['nico', 'lean'],
      teamB: ['mati', 'fran'],
      format: 'one',
      sets: [[6, 2]],
      createdBy: 'tomi',
      edited: false,
    });
    const vm = resultVM(makeCtx(s, { me: 'tomi', today }), 'n1')!;
    expect([vm.meta, vm.title, vm.text, vm.h2h]).toEqual([
      'Los del Jueves · Vie 30 oct',
      'Ya quedó en el historial.',
      'Es el partido 25 de Los del Jueves.',
      null,
    ]);
  });
});

describe('Detalle de partido', () => {
  it('permisos: miembro común no corrige lo que cargó otro', () => {
    const vm = matchSheetVM(ctx(), 'm33')!;
    expect([vm.canEdit, vm.permNote]).toEqual([
      false,
      'Solo quien lo cargó (Gonza) o un admin del grupo puede corregirlo.',
    ]);
  });
  it('borrado: texto e impacto', () => {
    const vm = matchSheetVM(ctx(), 'm36')!;
    expect(vm.meta).toBe('Jueves 29 de octubre · Los del Jueves');
    expect(vm.del.text).toBe(
      'Tomi y Fran 6-4 6-3 a Nico y Lean, jueves 29 de octubre. Se recalculan el ranking, las rachas, las duplas y los cara a cara de los 4 jugadores. No se puede deshacer.',
    );
    expect(vm.del.impact).toBe(
      'En Los del Jueves pasarías de 64% a 62%. Tu racha actual quedaría en 2 ganados.',
    );
  });
  it('sin Tomi en la cancha: no muestra impacto', () => {
    expect(matchSheetVM(ctx(), 'm01')!.del.impact).toBeNull();
  });
});
