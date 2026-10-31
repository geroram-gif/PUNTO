import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { colors, layout, space, typography } from '@/theme';

/**
 * Pantalla provisoria de la Fase 0: solo marca la ruta. Se reemplaza por la pantalla
 * real del prototipo en la Fase 2. No es un componente del diseño.
 */
export function ScreenPlaceholder({
  title,
  detail,
  surface = 'dark',
  onClose,
}: {
  title: string;
  detail?: string;
  surface?: 'dark' | 'light';
  /** Muestra la X («Cancelar») de las pantallas modales. */
  onClose?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const dark = surface === 'dark';
  const fg = dark ? colors.text.onDark : colors.text.onLight;
  const fg2 = dark ? colors.text.onDarkSecondary : colors.text.onLightSecondary;

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: dark ? colors.surface.app : colors.surface.read,
          paddingTop: insets.top + space[1],
        },
      ]}
    >
      {onClose && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
          onPress={onClose}
          style={styles.close}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" aria-hidden>
            <Path d="M6 6l12 12M18 6 6 18" stroke={fg} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>
      )}
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: fg }]}>
        {title}
      </Text>
      {detail ? <Text style={[typography.secondary, { color: fg2 }]}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: layout.screenGutter,
    gap: space[1],
  },
  close: {
    width: layout.minTouch,
    height: layout.minTouch,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
