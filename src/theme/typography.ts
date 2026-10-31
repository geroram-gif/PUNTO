import type { TextStyle } from 'react-native';

/**
 * Tipografía de PUNTO. Fuente: design/tokens.json (`type`).
 * En React Native cada peso de una fuente custom es una familia distinta,
 * por eso no se usa `fontWeight`: se elige la familia del peso.
 * Las unidades em del token se convierten a puntos (em × tamaño).
 */
export const fontFamily = {
  display: {
    600: 'Sora_600SemiBold',
    700: 'Sora_700Bold',
    800: 'Sora_800ExtraBold',
  },
  ui: {
    400: 'Inter_400Regular',
    500: 'Inter_500Medium',
    600: 'Inter_600SemiBold',
    700: 'Inter_700Bold',
  },
} as const;

/** Numerales tabulares para toda cifra (tokens.json → `type.numerals`). */
export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

const em = (value: number, size: number) => Math.round(value * size * 100) / 100;

/** Rango del número héroe (tokens.json → `type.scale.heroNumber.size`). */
export const heroNumberSize = { min: 84, max: 120 } as const;

/** Número héroe: Sora 800, tracking -0.05em, interlineado 0.85. */
export function heroNumber(size: number): TextStyle {
  const s = Math.min(heroNumberSize.max, Math.max(heroNumberSize.min, size));
  return {
    fontFamily: fontFamily.display[800],
    fontSize: s,
    letterSpacing: em(-0.05, s),
    lineHeight: em(0.85, s),
    ...tabularNums,
  };
}

export const typography = {
  screenTitle: {
    fontFamily: fontFamily.display[800],
    fontSize: 22,
    letterSpacing: em(-0.02, 22),
  },
  sectionTitle: {
    fontFamily: fontFamily.display[700],
    fontSize: 18,
  },
  cardTitle: {
    fontFamily: fontFamily.display[700],
    fontSize: 18,
  },
  body: {
    fontFamily: fontFamily.ui[500],
    fontSize: 15,
    lineHeight: em(1.45, 15),
  },
  secondary: {
    fontFamily: fontFamily.ui[400],
    fontSize: 13,
  },
  label: {
    fontFamily: fontFamily.ui[600],
    fontSize: 12,
    letterSpacing: em(0.08, 12),
    textTransform: 'uppercase',
  },
  tab: {
    fontFamily: fontFamily.ui[600],
    fontSize: 11,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
