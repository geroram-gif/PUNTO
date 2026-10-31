import {
  analyze,
  type GroupId,
  type ISODate,
  type MatchFormat,
  type PlayerId,
  type SetScore,
} from '@/lib/stats';

/** Borrador de partido mientras se registra o corrige. */
export interface Draft {
  groupId: GroupId;
  dateMode: 'hoy' | 'ayer' | 'otra';
  date: ISODate;
  /** [A1, A2, B1, B2]; null = lugar vacío. */
  slots: (PlayerId | null)[];
  format: MatchFormat;
  /** Siempre 3 filas; se usan las visibles según `analyze`. */
  sets: SetScore[];
  notice: string;
  addingGuest: boolean;
  guestName: string;
  guestErr: string;
}

export function blankDraft(groupId: GroupId, today: ISODate): Draft {
  return {
    groupId,
    dateMode: 'hoy',
    date: today,
    slots: [null, null, null, null],
    format: 'bo3',
    sets: [
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    notice: '',
    addingGuest: false,
    guestName: '',
    guestErr: '',
  };
}

/** Lo que se guarda a partir de un borrador válido; `null` si el resultado no es válido. */
export function matchFromDraft(d: Draft) {
  const an = analyze(d.format, d.sets, d.slots);
  if (!an.ok) return null;
  const sets = d.sets.slice(0, an.visible).map((x) => [x[0], x[1]] as SetScore);
  return {
    date: d.date,
    teamA: [d.slots[0], d.slots[1]] as [PlayerId, PlayerId],
    teamB: [d.slots[2], d.slots[3]] as [PlayerId, PlayerId],
    format: d.format,
    sets,
  };
}
