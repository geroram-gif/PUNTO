/**
 * Colores de PUNTO. Fuente: design/tokens.json (`color` y `semantic`).
 * No hardcodear hex fuera de src/theme: usar `palette` o, mejor, `colors`.
 */
export const palette = {
  navy: '#19283B',
  coral: '#FF7855',
  cream: '#FFF8ED',
  lime: '#DCEB82',
  lilac: '#B9A6F2',
  graphite: '#394457',
  navy2: '#22344B',
  navyLine: '#2E3F55',
  mist: '#B7B6B1',
  cream2: '#F3EBDD',
  creamLine: '#EDE3D3',
  slate: '#5E6878',
  white: '#FFFFFF',
} as const;

export type PaletteColor = keyof typeof palette;

/** Roles semánticos (tokens.json → `semantic`). */
export const colors = {
  surface: {
    app: palette.navy,
    read: palette.cream,
    card: palette.white,
    raised: palette.navy2,
  },
  text: {
    onDark: palette.cream,
    onDarkSecondary: palette.mist,
    onLight: palette.navy,
    onLightSecondary: palette.graphite,
    onLightTertiary: palette.slate,
  },
  action: {
    primary: palette.coral,
    primaryText: palette.navy,
  },
  stat: {
    win: palette.lime,
    social: palette.lilac,
  },
  state: {
    provisional: palette.cream2,
  },
  border: {
    onLight: palette.creamLine,
    onDark: palette.navyLine,
  },
  /** Invitado: borde punteado de 1.5 px, slate sobre claro y mist sobre oscuro. */
  guest: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderOnLight: palette.slate,
    borderOnDark: palette.mist,
  },
} as const;

/**
 * Color del texto (iniciales) sobre un avatar. Regla del seed del prototipo:
 * crema sobre grafito, navy sobre cualquier otro fondo.
 */
export function avatarTextColor(background: string): string {
  return background === palette.graphite ? palette.cream : palette.navy;
}
