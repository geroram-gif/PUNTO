import { Pressable, View } from 'react-native';

import type { SlotVM } from '@/features/register/vm';
import { colors, palette, protoColors, radius } from '@/theme';

import { PlayerAvatar } from './PlayerAvatar';
import { Icon, Label, Txt } from './ui';

function Slot({ s, onPress }: { s: SlotVM; onPress: () => void }) {
  const borderColor = s.filled ? palette.navyLine : s.isNext ? palette.coral : protoColors.steel;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={s.aria}
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 0,
        height: 52,
        borderRadius: radius.input,
        borderWidth: 1.5,
        borderStyle: s.filled ? 'solid' : 'dashed',
        borderColor,
        backgroundColor: s.filled ? palette.navy2 : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
      }}
    >
      {s.av ? <PlayerAvatar av={s.av} size={30} fontSize={11} /> : null}
      <Txt
        w={s.filled ? 600 : 500}
        s={14}
        c={s.filled || s.isNext ? palette.cream : colors.text.onDarkSecondary}
        ell
        style={{ flex: 1 }}
      >
        {s.text}
      </Txt>
      {s.filled ? <Icon name="close" size={16} color={palette.mist} /> : null}
    </Pressable>
  );
}

/** Lugares de Pareja A y Pareja B. Tocar uno ocupado lo libera. */
export function TeamAssignment({
  a,
  b,
  onClear,
}: {
  a: SlotVM[];
  b: SlotVM[];
  onClear: (i: number) => void;
}) {
  const row = (slots: SlotVM[]) => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {slots.map((s) => (
        <Slot key={s.index} s={s} onPress={() => onClear(s.index)} />
      ))}
    </View>
  );
  return (
    <View style={{ backgroundColor: palette.navy, borderRadius: radius.card, padding: 12, gap: 8 }}>
      <Label c={colors.text.onDarkSecondary} style={{ paddingHorizontal: 4 }}>
        Pareja A
      </Label>
      {row(a)}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 2,
          paddingHorizontal: 4,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: palette.navyLine }} />
        <Txt d w={800} s={14} c={palette.coral}>
          VS
        </Txt>
        <View style={{ flex: 1, height: 1, backgroundColor: palette.navyLine }} />
      </View>
      <Label c={colors.text.onDarkSecondary} style={{ paddingHorizontal: 4 }}>
        Pareja B
      </Label>
      {row(b)}
    </View>
  );
}
