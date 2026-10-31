import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fontFamily } from '@/theme';

type Weight = 400 | 500 | 600 | 700 | 800;

export interface TxtProps extends TextProps {
  /** Sora (display). Por defecto Inter (UI). */
  d?: boolean;
  w?: Weight;
  /** Tamaño en pt. */
  s?: number;
  c?: string;
  /** Tracking en em (como en el prototipo). */
  tr?: number;
  /** Interlineado como múltiplo del tamaño. */
  lh?: number;
  /** Numerales tabulares. */
  num?: boolean;
  upper?: boolean;
  align?: TextStyle['textAlign'];
  /** Una línea con «…» (clase pa-ell del prototipo). */
  ell?: boolean;
}

/** Familia de un peso: Sora 600-800, Inter 400-700 (lo que se carga en el layout raíz). */
export function fontFor(display: boolean, w: Weight): string {
  if (display) return fontFamily.display[w <= 600 ? 600 : w === 700 ? 700 : 800];
  return fontFamily.ui[w >= 700 ? 700 : (w as 400 | 500 | 600)];
}

/** Texto con la tipografía del sistema. Traduce el CSS inline del prototipo. */
export function Txt({
  d = false,
  w = 400,
  s = 15,
  c = colors.text.onLight,
  tr,
  lh,
  num,
  upper,
  align,
  ell,
  style,
  ...rest
}: TxtProps) {
  return (
    <Text
      numberOfLines={ell ? 1 : rest.numberOfLines}
      {...rest}
      style={[
        {
          fontFamily: fontFor(d, w),
          fontSize: s,
          color: c,
          letterSpacing: tr ? Math.round(tr * s * 100) / 100 : undefined,
          lineHeight: lh ? Math.round(lh * s * 100) / 100 : undefined,
          fontVariant: num ? ['tabular-nums'] : undefined,
          textTransform: upper ? 'uppercase' : undefined,
          textAlign: align,
          flexShrink: ell ? 1 : undefined,
        },
        style,
      ]}
    />
  );
}

/** Rótulo en mayúsculas (12 pt, 600, tracking 0.08em). */
export function Label(props: TxtProps) {
  return <Txt w={600} s={12} tr={0.08} upper {...props} />;
}
