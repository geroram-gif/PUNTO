import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { colors, palette, protoColors, radius } from '@/theme';

import { Txt } from './ui';

/**
 * Estado vacío. `card`: tarjeta blanca sobre crema; `dark`: sobre navy (pantalla o tarjeta).
 * Nunca inventa cifras: solo explica qué falta para que aparezcan.
 */
export function EmptyState({
  tone,
  title,
  text,
  titleSize,
  titleWeight,
  art,
  children,
  card = tone === 'card',
  center = false,
  style,
}: {
  tone: 'card' | 'dark';
  title: string;
  text?: string;
  titleSize?: number;
  titleWeight?: 700 | 800;
  art?: ReactNode;
  children?: ReactNode;
  /** Con fondo de tarjeta (navy en `dark`). */
  card?: boolean;
  /** Centrado (cara a cara sin cruces). */
  center?: boolean;
  style?: ViewStyle;
}) {
  const dark = tone === 'dark';
  return (
    <View
      style={[
        card
          ? dark
            ? {
                backgroundColor: palette.navy,
                borderRadius: 24,
                paddingVertical: 24,
                paddingHorizontal: 20,
              }
            : {
                backgroundColor: palette.white,
                borderWidth: 1,
                borderColor: palette.creamLine,
                borderRadius: radius.card,
                padding: 20,
              }
          : null,
        { gap: dark ? 14 : 8 },
        style,
      ]}
    >
      {art}
      <Txt
        accessibilityRole="header"
        d
        w={titleWeight ?? (dark ? 800 : 700)}
        s={titleSize ?? (dark ? 26 : 20)}
        lh={dark ? 1.1 : undefined}
        tr={dark ? -0.02 : undefined}
        c={dark ? colors.text.onDark : colors.text.onLight}
        align={center ? 'center' : undefined}
      >
        {title}
      </Txt>
      {text ? (
        <Txt
          s={dark ? 15 : 14}
          lh={1.45}
          c={dark ? protoColors.sand : colors.text.onLightSecondary}
          align={center ? 'center' : undefined}
          style={center ? { maxWidth: 300 } : undefined}
        >
          {text}
        </Txt>
      ) : null}
      {children}
    </View>
  );
}
