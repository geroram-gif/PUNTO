import { router, type Href } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, fontFamily, layout, palette, radius, typography } from '@/theme';

/**
 * Barra inferior (prototipo: `data-component="AppTabBar"`).
 * Inicio, Grupos y Perfil son tabs. «Partido» no es una pantalla: es la única acción
 * principal para cargar partidos y abre el registro como modal, sin barra.
 */

type RouteItem = { kind: 'route'; route: 'index' | 'groups' | 'profile'; label: string };

const HREF: Record<RouteItem['route'], Href> = {
  index: '/',
  groups: '/groups',
  profile: '/profile',
};
type ActionItem = { kind: 'register'; label: string };

const ITEMS: readonly (RouteItem | ActionItem)[] = [
  { kind: 'route', route: 'index', label: 'Inicio' },
  { kind: 'route', route: 'groups', label: 'Grupos' },
  { kind: 'register', label: 'Partido' },
  { kind: 'route', route: 'profile', label: 'Perfil' },
];

/** Medidas del prototipo: alto 86 = 6 arriba + 46 de contenido + 34 de área segura. */
const PADDING_TOP = 6;
const CONTENT_HEIGHT = layout.tabBarHeight - layout.safeBottom - PADDING_TOP;
const ICON_SIZE = 24;

export type AppTabBarProps = BottomTabBarProps & {
  /** Abre el registro de partido. */
  onRegister: () => void;
  /** Etiqueta accesible del botón «Partido» (p. ej. con el grupo actual). */
  registerAccessibilityLabel?: string;
};

export function AppTabBar({
  state,
  emitter,
  insets,
  onRegister,
  registerAccessibilityLabel = 'Partido: registrar un partido',
}: AppTabBarProps) {
  const focusedName = state.routes[state.index]?.name;

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Navegación principal"
      style={[styles.bar, { paddingBottom: insets.bottom }]}
    >
      {ITEMS.map((item) => {
        if (item.kind === 'register') {
          return (
            <Pressable
              key="register"
              accessibilityRole="button"
              accessibilityLabel={registerAccessibilityLabel}
              onPress={onRegister}
              style={styles.item}
            >
              <View style={styles.registerPill}>
                <PlusIcon />
              </View>
              <Text style={[styles.label, styles.labelStrong]}>{item.label}</Text>
            </Pressable>
          );
        }

        const route = state.routes.find((r) => r.name === item.route);
        if (!route) return null;
        const focused = focusedName === item.route;
        const color = focused ? colors.text.onDark : colors.text.onDarkSecondary;

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          // Como `tab()` del prototipo: cada pestaña vuelve a su pantalla raíz.
          if (!event.defaultPrevented) router.navigate(HREF[item.route]);
        };
        const onLongPress = () => emitter.emit({ type: 'tabLongPress', target: route.key });

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.item}
          >
            <TabIcon route={item.route} color={color} />
            <Text style={[styles.label, focused && styles.labelStrong, { color }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIcon({ route, color }: { route: RouteItem['route']; color: string }) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" aria-hidden>
      {route === 'index' && (
        <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" {...stroke} />
      )}
      {route === 'groups' && (
        <>
          <Circle cx={9} cy={8} r={3.5} {...stroke} />
          <Path
            d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.1 2.5 3.5 5.2"
            {...stroke}
          />
        </>
      )}
      {route === 'profile' && (
        <>
          <Circle cx={12} cy={8} r={4} {...stroke} />
          <Path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" {...stroke} />
        </>
      )}
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
      <Path
        d="M12 5v14M5 12h14"
        stroke={colors.action.primaryText}
        strokeWidth={2.25}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: PADDING_TOP,
    paddingHorizontal: 12,
    backgroundColor: palette.navy,
    borderTopWidth: 1,
    borderTopColor: colors.border.onDark,
  },
  item: {
    flex: 1,
    height: CONTENT_HEIGHT,
    minHeight: layout.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  registerPill: {
    width: 52,
    height: 32,
    borderRadius: radius.chip,
    backgroundColor: colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.tab,
    fontFamily: fontFamily.ui[500],
    color: colors.text.onDark,
  },
  labelStrong: {
    fontFamily: fontFamily.ui[600],
  },
});
