/**
 * Helpers de presentación compartidos por los view-models (port de los helpers de
 * `renderVals()` del prototipo). Arman textos y colores a partir del estado; los números
 * salen siempre del motor (`@/lib/stats`).
 */
import {
  analyze,
  FORMAT_LABEL,
  fmtShort,
  winnerOf,
  type Group,
  type GroupId,
  type ISODate,
  type Match,
  type Player,
  type PlayerId,
  type PlayerStats,
  type Side,
} from '@/lib/stats';
import { avatarTextColor, colors, palette } from '@/theme/colors';

export interface CtxInput {
  players: Readonly<Record<PlayerId, Player>>;
  groups: readonly Group[];
  matches: readonly Match[];
  resultId?: string | null;
}

export interface CtxOptions {
  me: PlayerId;
  today: ISODate;
  longNames?: boolean;
}

export interface AvatarVM {
  ini: string;
  bg: string;
  fg: string;
  /** Color del borde punteado (invitados); null si no tiene. */
  dashed: string | null;
}

export interface MatchCardVM {
  id: string;
  date: string;
  group: string;
  format: string;
  editedTag: string;
  /** Pareja ganadora (arriba) y perdedora (abajo). */
  top: string;
  bot: string;
  topGuest: boolean;
  botGuest: boolean;
  topSets: number[];
  botSets: number[];
  /** Recién cargado: borde navy en la lista. */
  highlighted: boolean;
  aria: string;
}

export interface StreakVM {
  /** 'win' = fondo lima; 'neutral' = crema. */
  tone: 'win' | 'neutral';
  hasBig: boolean;
  big: string;
  title: string;
  text: string;
}

export type Ctx = ReturnType<typeof makeCtx>;

const LONG_PLAYER = 'Juan Ignacio Vega Martínez';
const LONG_GROUP = 'Los del Jueves de Olivos y alrededores';

export function makeCtx(input: CtxInput, opts: CtxOptions) {
  const { me, today, longNames = false } = opts;
  const pl = (id: PlayerId): Player => {
    const p = input.players[id] ?? {
      id,
      name: id,
      fullName: id,
      initials: '?',
      avatarColor: palette.cream2,
      isGuest: false,
    };
    if (longNames && id === 'juani') return { ...p, name: LONG_PLAYER };
    return p;
  };
  const gname = (g: Pick<Group, 'id' | 'name'>) =>
    longNames && g.id === 'jueves' ? LONG_GROUP : g.name;
  const gById = (id: GroupId | null | undefined) => input.groups.find((g) => g.id === id);
  const meFirst = (ids: readonly PlayerId[]): PlayerId[] =>
    ids.indexOf(me) > 0 ? [me, ...ids.filter((i) => i !== me)] : [...ids];
  const names = (ids: readonly PlayerId[]) =>
    meFirst(ids)
      .map((i) => pl(i).name)
      .join(' y ');
  const av = (id: PlayerId, dark: boolean): AvatarVM => {
    const p = pl(id);
    if (p.isGuest)
      return {
        ini: p.initials,
        bg: 'transparent',
        fg: dark ? colors.text.onDark : colors.text.onLight,
        dashed: dark ? colors.guest.borderOnDark : colors.guest.borderOnLight,
      };
    return { ini: p.initials, bg: p.avatarColor, fg: avatarTextColor(p.avatarColor), dashed: null };
  };
  const gm = (gid: GroupId) => input.matches.filter((m) => m.groupId === gid);
  const myGroups = input.groups.filter((g) => g.memberIds.indexOf(me) >= 0);
  const myMatches = input.matches.filter((m) => myGroups.some((g) => g.id === m.groupId));

  const visibleSets = (m: Match) => m.sets.slice(0, analyze(m.format, m.sets).visible);

  const card = (m: Match): MatchCardVM => {
    const w = winnerOf(m);
    const top = w === 'B' ? m.teamB : m.teamA;
    const bot = w === 'B' ? m.teamA : m.teamB;
    const sets = visibleSets(m);
    const g = gById(m.groupId);
    return {
      id: m.id,
      date: fmtShort(m.date),
      group: g ? gname(g) : '',
      format: FORMAT_LABEL[m.format],
      editedTag: m.edited ? ' · corregido' : '',
      top: names(top),
      bot: names(bot),
      topGuest: top.some((i) => pl(i).isGuest),
      botGuest: bot.some((i) => pl(i).isGuest),
      topSets: sets.map((x) => (w === 'B' ? x[1] : x[0])),
      botSets: sets.map((x) => (w === 'B' ? x[0] : x[1])),
      highlighted: m.id === input.resultId,
      aria:
        names(top) +
        ' ganaron a ' +
        names(bot) +
        ', ' +
        sets.map((x) => (w === 'B' ? x[1] + '-' + x[0] : x[0] + '-' + x[1])).join(', ') +
        ', ' +
        fmtShort(m.date) +
        '. Ver detalle.',
    };
  };

  /** Marcador visto desde un lado («6-4 3-6»). */
  const scoreFor = (m: Match, side: Side | null) =>
    visibleSets(m)
      .map((x) => (side === 'B' ? x[1] + '-' + x[0] : x[0] + '-' + x[1]))
      .join(' ');

  const streakVM = (ps: PlayerStats): StreakVM => {
    if (ps.streak.type === 'W')
      return {
        tone: 'win',
        hasBig: ps.streak.n >= 2,
        big: String(ps.streak.n),
        title: ps.streak.n >= 2 ? 'al hilo.' : 'Ganaste el último.',
        text:
          ps.streak.n >= 2
            ? 'Ganaste tus últimos ' + ps.streak.n + ' partidos · mejor racha: ' + ps.best
            : 'Tu mejor racha fue de ' + ps.best + '.',
      };
    return {
      tone: 'neutral',
      hasBig: false,
      big: '',
      title: 'Se viene revancha.',
      text:
        ps.streak.n === 1
          ? 'Perdiste el último partido. Tu mejor racha fue de ' + ps.best + '.'
          : 'Perdiste los últimos ' + ps.streak.n + '. Tu mejor racha fue de ' + ps.best + '.',
    };
  };

  return {
    me,
    today,
    players: input.players,
    groups: input.groups,
    matches: input.matches,
    resultId: input.resultId ?? null,
    pl,
    gname,
    gById,
    meFirst,
    names,
    av,
    gm,
    myGroups,
    myMatches,
    card,
    scoreFor,
    streakVM,
  };
}

/** Primera letra en mayúscula («jueves 29…» → «Jueves 29…»). */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
