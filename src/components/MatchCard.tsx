import { Pressable, View } from 'react-native';

import type { MatchCardVM } from '@/features/shared/ctx';
import { colors, palette, radius } from '@/theme';

import { GuestTag, Txt, WinTag } from './ui';

/**
 * Tarjeta de partido. `light` (lista del grupo, blanca) o `dark` (Inicio, sobre navy).
 * La pareja ganadora va arriba, en negrita y con «GANARON».
 */
export function MatchCard({
  m,
  variant = 'light',
  onPress,
}: {
  m: MatchCardVM;
  variant?: 'light' | 'dark';
  onPress?: () => void;
}) {
  const dark = variant === 'dark';
  const setW = dark ? 24 : 26;
  const sub = dark ? colors.text.onDarkSecondary : colors.text.onLightSecondary;
  const fg = dark ? colors.text.onDark : colors.text.onLight;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={m.aria}
      onPress={onPress}
      style={{
        backgroundColor: dark ? palette.navy2 : palette.white,
        borderWidth: dark ? 0 : 1,
        borderColor: m.highlighted ? palette.navy : palette.creamLine,
        borderRadius: radius.card,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 8,
      }}
    >
      {dark ? (
        <Txt s={13} c={sub} ell>
          {m.date} · {m.group} · {m.format}
        </Txt>
      ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Txt s={13} c={sub}>
            {m.date}
            {m.editedTag}
          </Txt>
          <Txt s={13} c={sub}>
            {m.format}
          </Txt>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Txt w={700} s={15} c={fg} ell style={{ flex: 1 }}>
          {m.top}
        </Txt>
        {!dark && m.topGuest ? <GuestTag /> : null}
        <WinTag />
        {m.topSets.map((v, i) => (
          <Txt key={i} d w={700} s={17} c={fg} num align="center" style={{ width: setW }}>
            {v}
          </Txt>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Txt s={15} c={sub} ell style={{ flex: 1 }}>
          {m.bot}
        </Txt>
        {!dark && m.botGuest ? <GuestTag /> : null}
        {m.botSets.map((v, i) => (
          <Txt key={i} d w={600} s={17} c={sub} num align="center" style={{ width: setW }}>
            {v}
          </Txt>
        ))}
      </View>
    </Pressable>
  );
}
