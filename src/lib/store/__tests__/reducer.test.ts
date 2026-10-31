import { blankDraft, initialState, reducer, type Draft } from '..';
import { demoConfigFromEnv } from '../config';

const today = '2026-10-31';
const s0 = () => initialState({ scenario: 'demo', loading: false });
const valid = (): Draft => ({
  ...blankDraft('jueves', today),
  slots: ['tomi', 'fran', 'nico', 'lean'],
  sets: [
    [6, 4],
    [3, 6],
    [7, 5],
  ],
});

describe('estado inicial por escenario', () => {
  it('demo: 2 grupos, 36 partidos, Los del Jueves abierto', () => {
    const s = s0();
    expect([s.groups.length, s.matches.length, s.groupId]).toEqual([2, 36, 'jueves']);
  });
  it('usuario nuevo: sin grupos ni partidos', () => {
    const s = initialState({ scenario: 'usuario-nuevo', loading: false });
    expect([s.groups.length, s.matches.length, s.groupId]).toEqual([0, 0, null]);
  });
  it('grupo sin partidos: suma Los del Martes primero', () => {
    const s = initialState({ scenario: 'grupo-sin-partidos', loading: false });
    expect(s.groups.map((g) => g.id)).toEqual(['martes', 'jueves', 'pibes']);
  });
  it('config desde variables de entorno', () => {
    expect(
      demoConfigFromEnv({
        EXPO_PUBLIC_DEMO_ESCENARIO: 'usuario-nuevo',
        EXPO_PUBLIC_DEMO_ERROR_DE_RED: '1',
        EXPO_PUBLIC_DEMO_CARGA: '0',
      }),
    ).toMatchObject({
      scenario: 'usuario-nuevo',
      netError: true,
      loading: false,
      longNames: false,
    });
    expect(demoConfigFromEnv({ EXPO_PUBLIC_DEMO_ESCENARIO: 'otro' }).scenario).toBe('demo');
  });
});

describe('reducer', () => {
  it('agregar: guarda solo los sets visibles, seq siguiente, cargado por Tomi', () => {
    const s = reducer(s0(), {
      type: 'addMatch',
      id: 'n1',
      draft: {
        ...valid(),
        sets: [
          [6, 4],
          [6, 3],
          [5, 5],
        ],
      },
    });
    const m = s.matches.at(-1)!;
    expect(m).toEqual({
      id: 'n1',
      groupId: 'jueves',
      date: today,
      seq: 37,
      teamA: ['tomi', 'fran'],
      teamB: ['nico', 'lean'],
      format: 'bo3',
      sets: [
        [6, 4],
        [6, 3],
      ],
      createdBy: 'tomi',
      edited: false,
    });
    expect(s.resultId).toBe('n1');
  });
  it('agregar un borrador inválido no cambia nada', () => {
    const s = s0();
    expect(reducer(s, { type: 'addMatch', id: 'n1', draft: blankDraft('jueves', today) })).toBe(s);
  });
  it('corregir marca el partido como corregido', () => {
    const s = reducer(s0(), { type: 'editMatch', id: 'm36', draft: valid() });
    const m = s.matches.find((x) => x.id === 'm36')!;
    expect([m.edited, m.sets.length, m.createdBy, m.seq]).toEqual([true, 3, 'tomi', 36]);
  });
  it('borrar saca el partido y cierra la hoja', () => {
    const s = reducer(reducer(s0(), { type: 'openSheet', mode: 'delete', matchId: 'm36' }), {
      type: 'deleteMatch',
      id: 'm36',
    });
    expect([s.matches.length, s.sheet]).toEqual([35, null]);
  });
  it('invitado: jugador sin cuenta, miembro del grupo', () => {
    const s = reducer(s0(), { type: 'addGuest', id: 'g1', groupId: 'pibes', name: '  Lucho ' });
    expect(s.players.g1).toEqual({
      id: 'g1',
      name: 'Lucho',
      fullName: 'Lucho',
      initials: 'LU',
      avatarColor: 'transparent',
      isGuest: true,
    });
    expect(s.groups.find((g) => g.id === 'pibes')!.memberIds.at(-1)).toBe('g1');
  });
});
