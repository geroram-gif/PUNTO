import { Pressable, View } from 'react-native';

import type { RegisterVM } from '@/features/register/vm';
import type { MatchFormat } from '@/lib/stats';
import { palette, radius } from '@/theme';

import { Txt } from './ui';

/** 1 set · Mejor de 3 · 2 + súper */
export function MatchFormatSelector({
  formats,
  onPick,
}: {
  formats: RegisterVM['formats'];
  onPick: (f: MatchFormat) => void;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Formato del partido"
      style={{
        flexDirection: 'row',
        gap: 4,
        backgroundColor: palette.cream2,
        borderRadius: radius.chip,
        padding: 4,
      }}
    >
      {formats.map((f) => (
        <Pressable
          key={f.format}
          accessibilityRole="radio"
          accessibilityState={{ checked: f.selected }}
          accessibilityLabel={f.label}
          onPress={() => onPick(f.format)}
          style={{
            flex: 1,
            height: 44,
            borderRadius: radius.chip,
            backgroundColor: f.selected ? palette.navy : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt w={600} s={13} c={f.selected ? palette.cream : palette.navy}>
            {f.label}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}
