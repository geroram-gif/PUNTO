import { View } from 'react-native';

import type { StreakVM } from '@/features/shared/ctx';
import { colors, palette, radius } from '@/theme';

import { Txt } from './ui';

/** Racha actual. Lima si viene ganando; crema si no. */
export function StreakCard({ s, size = 'home' }: { s: StreakVM; size?: 'home' | 'profile' }) {
  const home = size === 'home';
  return (
    <View
      accessible
      accessibilityLabel={(s.hasBig ? s.big + ' ' : '') + s.title + ' ' + s.text}
      style={{
        backgroundColor: s.tone === 'win' ? colors.stat.win : colors.state.provisional,
        borderRadius: radius.card,
        paddingVertical: home ? 18 : 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: home ? 18 : 16,
      }}
    >
      {s.hasBig ? (
        <Txt d w={800} s={home ? 64 : 52} lh={0.9} tr={home ? -0.04 : undefined} num>
          {s.big}
        </Txt>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt d w={700} s={home ? 20 : 18} c={palette.navy}>
          {s.title}
        </Txt>
        <Txt s={14} c={palette.navy}>
          {s.text}
        </Txt>
      </View>
    </View>
  );
}
