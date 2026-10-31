import { analyze, fmtShort, type GroupId, type PlayerId } from '@/lib/stats';
import type { Draft } from '@/lib/store/draft';

import type { AvatarVM, Ctx } from '../shared/ctx';

export interface SlotVM {
  index: number;
  filled: boolean;
  isNext: boolean;
  av: AvatarVM | null;
  text: string;
  aria: string;
}

export interface SetRowVM {
  index: number;
  label: string;
  a: number;
  b: number;
  err: string;
  ariaIncA: string;
  ariaDecA: string;
  ariaIncB: string;
  ariaDecB: string;
}

export interface RegisterVM {
  title: string;
  editing: boolean;
  groups: {
    id: GroupId;
    name: string;
    ini: string;
    bg: string;
    selected: boolean;
    locked: boolean;
  }[];
  dates: { mode: Draft['dateMode']; label: string; selected: boolean }[];
  showDateInput: boolean;
  slotsA: SlotVM[];
  slotsB: SlotVM[];
  picker: { id: PlayerId; name: string; av: AvatarVM; taken: boolean; tag: string; aria: string }[];
  countLabel: string;
  formats: { format: Draft['format']; label: string; selected: boolean }[];
  teamALabel: string;
  teamBLabel: string;
  setRows: SetRowVM[];
  thirdHint: string;
  helper: string;
  ok: boolean;
  review: {
    meta: string;
    a: string;
    b: string;
    winA: boolean;
    winB: boolean;
    setsA: number[];
    setsB: number[];
  } | null;
}

/** Día anterior a `today` (YYYY-MM-DD). */
export function yesterdayOf(today: string): string {
  const p = today.split('-');
  return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] - 1)).toISOString().slice(0, 10);
}

/** Registrar o corregir partido (prototipo: «03 REGISTRAR»). Sin grupo válido: null. */
export function registerVM(c: Ctx, dr: Draft | null, editing: boolean): RegisterVM | null {
  const rg = dr ? c.gById(dr.groupId) : undefined;
  if (!dr || !rg) return null;
  const an = analyze(dr.format, dr.sets, dr.slots);
  const nextIdx = dr.slots.indexOf(null);
  const slotVM = (i: number): SlotVM => {
    const id = dr.slots[i];
    const pair = i < 2 ? 'A' : 'B';
    if (id) {
      const p = c.pl(id);
      return {
        index: i,
        filled: true,
        isNext: false,
        av: c.av(id, true),
        text: p.name,
        aria: p.fullName + ', en Pareja ' + pair + '. Tocá para sacarlo.',
      };
    }
    const isNext = i === nextIdx;
    return {
      index: i,
      filled: false,
      isNext,
      av: null,
      text: isNext ? 'Elegí abajo' : 'Jugador ' + ((i % 2) + 1),
      aria: 'Lugar vacío en Pareja ' + pair,
    };
  };
  const teamALabel = dr.slots[0] && dr.slots[1] ? c.names([dr.slots[0], dr.slots[1]]) : 'Pareja A';
  const teamBLabel = dr.slots[2] && dr.slots[3] ? c.names([dr.slots[2], dr.slots[3]]) : 'Pareja B';
  const setRows: SetRowVM[] = [];
  for (let i = 0; i < an.visible; i++) {
    const isSuper = dr.format === 'st' && i === 2;
    const label = isSuper ? 'Súper' : 'Set ' + (i + 1);
    setRows.push({
      index: i,
      label,
      a: dr.sets[i][0],
      b: dr.sets[i][1],
      err: an.setErrs[i] || '',
      ariaIncA: 'Sumar un game a ' + teamALabel + ' en ' + label,
      ariaDecA: 'Restar un game a ' + teamALabel + ' en ' + label,
      ariaIncB: 'Sumar un game a ' + teamBLabel + ' en ' + label,
      ariaDecB: 'Restar un game a ' + teamBLabel + ' en ' + label,
    });
  }
  let thirdHint = '';
  if (dr.format !== 'one' && !an.needThird)
    thirdHint =
      dr.format === 'st'
        ? 'Si quedan 1 a 1 en sets, aparece el súper tie-break.'
        : 'Si quedan 1 a 1 en sets, aparece el tercero.';
  const vs = dr.sets.slice(0, an.visible);
  return {
    title: editing ? 'Corregir partido' : 'Nuevo partido',
    editing,
    groups: c.myGroups.map((x) => ({
      id: x.id,
      name: c.gname(x),
      ini: x.initials,
      bg: x.color,
      selected: x.id === dr.groupId,
      locked: editing && x.id !== dr.groupId,
    })),
    dates: (
      [
        ['hoy', 'Hoy'],
        ['ayer', 'Ayer'],
        ['otra', 'Otra fecha'],
      ] as const
    ).map(([mode, label]) => {
      const on = dr.dateMode === mode;
      return { mode, label: mode === 'otra' && on ? fmtShort(dr.date) : label, selected: on };
    }),
    showDateInput: dr.dateMode === 'otra',
    slotsA: [slotVM(0), slotVM(1)],
    slotsB: [slotVM(2), slotVM(3)],
    picker: rg.memberIds.map((id) => {
      const p = c.pl(id);
      const at = dr.slots.indexOf(id);
      const taken = at >= 0;
      return {
        id,
        name: p.name,
        av: c.av(id, false),
        taken,
        tag: at < 2 ? 'A' : 'B',
        aria:
          p.fullName +
          (p.isGuest ? ', invitado' : '') +
          (taken ? ', ya está en Pareja ' + (at < 2 ? 'A' : 'B') : ''),
      };
    }),
    countLabel: dr.slots.filter(Boolean).length + ' de 4',
    formats: (
      [
        ['one', '1 set'],
        ['bo3', 'Mejor de 3'],
        ['st', '2 + súper'],
      ] as const
    ).map(([format, label]) => ({ format, label, selected: dr.format === format })),
    teamALabel,
    teamBLabel,
    setRows,
    thirdHint,
    helper: an.ok
      ? 'Todo listo. Ganan ' + (an.winner === 'A' ? teamALabel : teamBLabel) + '.'
      : 'Para seguir: ' + an.missing.join(', ') + '.',
    ok: an.ok,
    review: an.ok
      ? {
          meta:
            (dr.dateMode === 'hoy' ? 'Hoy' : fmtShort(dr.date)) +
            ' · ' +
            c.gname(rg) +
            ' · ' +
            { one: '1 set', bo3: 'Mejor de 3', st: '2 sets + súper' }[dr.format],
          a: teamALabel,
          b: teamBLabel,
          winA: an.winner === 'A',
          winB: an.winner === 'B',
          setsA: vs.map((x) => x[0]),
          setsB: vs.map((x) => x[1]),
        }
      : null,
  };
}

/* ---------- Operaciones del borrador (puras) ---------- */

/** Elegir un jugador del selector: va al primer lugar libre; avisa duplicados o lleno. */
export function pickPlayer(c: Ctx, dr: Draft, id: PlayerId): Draft {
  const at = dr.slots.indexOf(id);
  if (at >= 0)
    return {
      ...dr,
      notice:
        c.pl(id).name +
        ' ya está en la Pareja ' +
        (at < 2 ? 'A' : 'B') +
        '. Un jugador no puede estar dos veces: tocá su lugar para cambiarlo.',
    };
  const idx = dr.slots.indexOf(null);
  if (idx < 0) return { ...dr, notice: 'Ya están los 4. Tocá un lugar para liberarlo.' };
  const slots = dr.slots.slice();
  slots[idx] = id;
  return { ...dr, slots, notice: '' };
}

/** Tocar un lugar ocupado lo libera. */
export function clearSlot(dr: Draft, i: number): Draft {
  if (!dr.slots[i]) return dr;
  const slots = dr.slots.slice();
  slots[i] = null;
  return { ...dr, slots, notice: '' };
}

/** Sumar o restar un game (0 a 7 en sets, 0 a 25 en el súper tie-break). */
export function bumpScore(dr: Draft, i: number, team: 0 | 1, delta: 1 | -1): Draft {
  const max = dr.format === 'st' && i === 2 ? 25 : 7;
  const sets = dr.sets.map((x) => [x[0], x[1]] as [number, number]);
  sets[i][team] = Math.max(0, Math.min(max, sets[i][team] + delta));
  return { ...dr, sets };
}

export function selectGroup(dr: Draft, groupId: GroupId, editing: boolean): Draft {
  if (groupId === dr.groupId || editing) return dr;
  return { ...dr, groupId, slots: [null, null, null, null], notice: '', addingGuest: false };
}

export function selectDate(dr: Draft, mode: Draft['dateMode'], today: string): Draft {
  const date = mode === 'hoy' ? today : mode === 'ayer' ? yesterdayOf(today) : dr.date;
  return { ...dr, dateMode: mode, date };
}

/** Validación del nombre de invitado; devuelve el error o '' si se puede sumar. */
export function guestError(c: Ctx, groupId: GroupId, name: string): string {
  const nm = name.trim();
  if (!nm) return 'Escribí un nombre.';
  const g = c.gById(groupId);
  const dup = !!g && g.memberIds.some((i) => c.pl(i).name.toLowerCase() === nm.toLowerCase());
  return dup ? 'Ya hay alguien con ese nombre en el grupo.' : '';
}

/** Borrador para corregir un partido existente. */
export function draftFromMatch(c: Ctx, matchId: string): Draft | null {
  const m = c.matches.find((x) => x.id === matchId);
  if (!m) return null;
  return {
    groupId: m.groupId,
    dateMode: m.date === c.today ? 'hoy' : 'otra',
    date: m.date,
    slots: [...m.teamA, ...m.teamB],
    format: m.format,
    sets: [0, 1, 2].map(
      (i) => (m.sets[i] ? [m.sets[i][0], m.sets[i][1]] : [0, 0]) as [number, number],
    ),
    notice: '',
    addingGuest: false,
    guestName: '',
    guestErr: '',
  };
}
