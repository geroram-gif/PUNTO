import { Pressable, View } from 'react-native';

import type { HomeVM } from '@/features/home/vm';
import { colors, palette, radius } from '@/theme';

import { Bar } from './Bar';
import { Txt } from './ui';

/** % de victorias global en Inicio. Toca para ir al perfil. */
export function WinRateCard({
  win,
  onPress,
}: {
  win: NonNullable<HomeVM['win']>;
  onPress: () => void;
}) {
  const sub = colors.text.onLightSecondary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={win.aria}
      onPress={onPress}
      style={{
        backgroundColor: palette.cream,
        borderRadius: radius.hero,
        paddingTop: 22,
        paddingHorizontal: 22,
        paddingBottom: 20,
        gap: 16,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt w={600} s={14}>
          Tu % de victorias
        </Txt>
        <View
          style={{
            backgroundColor: palette.navy,
            borderRadius: radius.chip,
            paddingVertical: 5,
            paddingHorizontal: 10,
          }}
        >
          <Txt w={600} s={12} c={palette.cream}>
            {win.scopeLabel}
          </Txt>
        </View>
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}
      >
        <Txt d w={800} s={104} lh={0.85} tr={-0.05} num>
          {win.pct}%
        </Txt>
        <View style={{ alignItems: 'flex-end', gap: 2, paddingBottom: 4 }}>
          <Txt d w={700} s={22} num>
            {win.pj}
          </Txt>
          <Txt s={13} c={sub}>
            partidos
          </Txt>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Bar ratio={win.barRatio} height={10} track={palette.creamLine} fill={palette.navy} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt s={13} c={sub} num>
            <Txt w={700} s={13} num>
              {win.g}
            </Txt>{' '}
            ganados
          </Txt>
          <Txt s={13} c={sub} num>
            <Txt w={700} s={13} num>
              {win.p}
            </Txt>{' '}
            perdidos
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}
