import { View } from 'react-native';

import { palette } from '@/theme';

import { Txt } from './Txt';

/** «PUNTO» con el punto coral. */
export function Wordmark({
  size = 24,
  color = palette.cream,
  dot = palette.coral,
}: {
  size?: number;
  color?: string;
  dot?: string;
}) {
  const d = size >= 24 ? 6 : 5;
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'flex-end' }}
      accessibilityLabel="PUNTO."
      accessible
    >
      <Txt d w={800} s={size} tr={size >= 24 ? -0.03 : -0.02} c={color}>
        PUNTO
      </Txt>
      <View
        style={{
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: dot,
          marginLeft: 2,
          marginBottom: size * 0.2,
        }}
      />
    </View>
  );
}
