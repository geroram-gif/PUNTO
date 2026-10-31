import { View } from 'react-native';

import { colors, palette, protoColors, radius } from '@/theme';

import { Txt } from './ui';

/** Dato destacado del Resultado: racha y cambios en tu % y tu puesto. */
export function StatHighlight({
  big,
  title,
  text,
  lines,
}: {
  big: string | null;
  title: string;
  text: string;
  lines: string[];
}) {
  return (
    <View
      accessible
      accessibilityLabel={[big, title, text, ...lines].filter(Boolean).join('. ')}
      style={{
        backgroundColor: palette.navy,
        borderRadius: radius.card,
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {big ? (
        <Txt d w={800} s={56} lh={0.9} c={palette.lime} num>
          {big}
        </Txt>
      ) : null}
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Txt d w={700} s={20} c={palette.cream}>
          {title}
        </Txt>
        <Txt s={14} c={protoColors.sand}>
          {text}
        </Txt>
        {lines.map((l, i) => (
          <Txt key={i} s={13} c={colors.text.onDarkSecondary} num>
            {l}
          </Txt>
        ))}
      </View>
    </View>
  );
}
