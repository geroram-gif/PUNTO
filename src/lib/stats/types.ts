/** Modelo de datos (design/HANDOFF.md → «Modelo de datos»). */
export type PlayerId = string;
export type GroupId = string;
export type MatchId = string;
/** Fecha calendario en formato YYYY-MM-DD. */
export type ISODate = string;

export type Side = 'A' | 'B';
export type MatchFormat = 'one' | 'bo3' | 'st';
/** Games de un set, siempre en orden [pareja A, pareja B]. */
export type SetScore = [number, number];
export type Team = [PlayerId, PlayerId];

export interface Player {
  id: PlayerId;
  name: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  isGuest: boolean;
  linkedUserId?: string;
}

export interface Group {
  id: GroupId;
  name: string;
  initials: string;
  color: string;
  adminIds: PlayerId[];
  memberIds: PlayerId[];
}

/** El ganador no se guarda: se deriva de los sets (`analyze`). */
export interface Match {
  id: MatchId;
  groupId: GroupId;
  date: ISODate;
  seq: number;
  teamA: Team;
  teamB: Team;
  format: MatchFormat;
  sets: SetScore[];
  createdBy: PlayerId;
  edited: boolean;
}

/** Lo único que el ranking necesita de cada jugador. */
export type PlayerNames = Readonly<Record<PlayerId, Pick<Player, 'name'>>>;
/** Lo único que el ranking necesita del grupo. */
export type GroupRef = Pick<Group, 'id' | 'memberIds'>;
