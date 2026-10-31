import { View } from 'react-native';

import { radius } from '@/theme';

/** Barra de proporción (decorativa: el valor siempre está escrito al lado). */
export function Bar({
  ratio,
  height,
  width,
  track,
  fill,
}: {
  ratio: number;
  height: number;
  width?: number;
  track: string;
  fill: string;
}) {
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        height,
        width,
        borderRadius: radius.chip,
        backgroundColor: track,
        overflow: 'hidden',
        flexDirection: 'row',
      }}
    >
      <View
        style={{
          width: `${Math.round(ratio * 1000) / 10}%`,
          backgroundColor: fill,
          borderRadius: radius.chip,
        }}
      />
    </View>
  );
}
