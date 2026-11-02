import { forwardRef, useState, type ComponentRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { colors, palette } from '@/theme';

import { useAnnounce } from './announce';
import { fontFor, Txt } from './Txt';

/**
 * Campo de texto con etiqueta, ayuda y error. `dark` para pantallas navy, `light` para crema.
 * Borde en reposo con contraste >= 3:1 (WCAG 1.4.11) y borde más grueso al tener el foco.
 */
export const TextField = forwardRef<
  ComponentRef<typeof TextInput>,
  TextInputProps & { label: string; error?: string; tone?: 'light' | 'dark'; hint?: string }
>(function TextField({ label, error, hint, tone = 'light', style, onFocus, onBlur, ...rest }, ref) {
  const dark = tone === 'dark';
  const [focused, setFocused] = useState(false);
  useAnnounce(error);
  const rest_ = dark ? palette.mist : palette.slate;
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
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          {
            minHeight: 52,
            borderWidth: focused || error ? 2.5 : 1.5,
            borderRadius: 14,
            paddingHorizontal: focused || error ? 12.5 : 14,
            fontSize: 16,
            fontFamily: fontFor(false, 500),
            backgroundColor: dark ? palette.navy2 : palette.white,
            borderColor: error
              ? palette.coral
              : focused
                ? dark
                  ? palette.cream
                  : palette.navy
                : rest_,
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
