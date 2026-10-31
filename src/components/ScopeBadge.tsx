import { View } from 'react-native';

import { palette, radius } from '@/theme';

import { Txt } from './ui';

/** Distingue lo global de lo de cada grupo («Perfil global · 2 grupos»). */
export function ScopeBadge({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: palette.cream,
        borderRadius: radius.chip,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignSelf: 'flex-start',
      }}
    >
      <Txt w={700} s={12}>
        {label}
      </Txt>
    </View>
  );
}
