import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, palette, radius } from '@/theme';

import { Txt } from './Txt';

export type ButtonTone =
  'primary' | 'dark' | 'outline' | 'outlineLight' | 'soft' | 'lilac' | 'disabled';

const TONES: Record<ButtonTone, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.action.primary, fg: colors.action.primaryText },
  dark: { bg: palette.navy, fg: palette.cream },
  outline: { bg: 'transparent', fg: palette.navy, border: palette.navy },
  outlineLight: { bg: 'transparent', fg: palette.cream, border: palette.cream },
  soft: { bg: palette.cream2, fg: palette.navy },
  lilac: { bg: palette.lilac, fg: palette.navy },
  disabled: { bg: palette.creamLine, fg: palette.slate },
};

/** Botón píldora del prototipo (alto 50-56). */
export function Button({
  label,
  onPress,
  tone = 'primary',
  height = 54,
  size = 16,
  weight,
  disabled,
  loading,
  icon,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress?: () => void;
  tone?: ButtonTone;
  height?: number;
  size?: number;
  weight?: 600 | 700;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  style?: ViewStyle;
}) {
  const t = TONES[tone];
  const w =
    weight ??
    (tone === 'outline' || tone === 'outlineLight' || tone === 'soft' || tone === 'lilac'
      ? 600
      : 700);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        { height, backgroundColor: t.bg },
        t.border ? { borderWidth: 1.5, borderColor: t.border } : null,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={t.fg} /> : icon}
        <Txt w={w} s={size} c={t.fg}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
