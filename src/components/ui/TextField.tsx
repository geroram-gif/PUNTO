import { forwardRef, type ComponentRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { colors, palette, protoColors } from '@/theme';

import { fontFor, Txt } from './Txt';

/** Campo de texto con etiqueta y error. `dark` para pantallas navy, `light` para crema. */
export const TextField = forwardRef<
  ComponentRef<typeof TextInput>,
  TextInputProps & { label: string; error?: string; tone?: 'light' | 'dark'; hint?: string }
>(function TextField({ label, error, hint, tone = 'light', style, ...rest }, ref) {
  const dark = tone === 'dark';
  return (
    <View style={{ gap: 6 }}>
      <Txt w={600} s={13} c={dark ? colors.text.onDarkSecondary : colors.text.onLightSecondary}>
        {label}
      </Txt>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={dark ? palette.mist : palette.slate}
        selectionColor={palette.coral}
        style={[
          {
            minHeight: 52,
            borderWidth: 1.5,
            borderRadius: 14,
            paddingHorizontal: 14,
            fontSize: 16,
            fontFamily: fontFor(false, 500),
            backgroundColor: dark ? palette.navy2 : palette.white,
            borderColor: error ? palette.coral : dark ? palette.navyLine : protoColors.creamEdge,
            color: dark ? palette.cream : palette.navy,
          },
          style,
        ]}
        {...rest}
      />
      {hint && !error ? (
        <Txt s={12} c={dark ? colors.text.onDarkSecondary : palette.slate}>
          {hint}
        </Txt>
      ) : null}
      {error ? (
        <Txt accessibilityRole="alert" w={600} s={13} c={dark ? palette.cream : palette.navy}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
});
