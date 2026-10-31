import { Pressable, View } from 'react-native';

import { palette, protoColors } from '@/theme';

import { Txt } from './ui';

/** Fila del historial: G (lima) o P (borde), con texto además del color. */
export function MatchHistoryRow({
  won,
  title,
  meta,
  score,
  aria,
  onPress,
}: {
  won: boolean;
  title: string;
  meta: string;
  score: string;
  aria: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={aria}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 60,
        borderBottomWidth: 1,
        borderBottomColor: protoColors.creamRule,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: won ? palette.lime : 'transparent',
          borderWidth: won ? 0 : 1.5,
          borderColor: palette.navy,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt w={800} s={13}>
          {won ? 'G' : 'P'}
        </Txt>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt w={600} s={14} ell>
          {title}
        </Txt>
        <Txt s={12} c={palette.slate} ell>
          {meta}
        </Txt>
      </View>
      <Txt d w={700} s={13} num>
        {score}
      </Txt>
    </Pressable>
  );
}
