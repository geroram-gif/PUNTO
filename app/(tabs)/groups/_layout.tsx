import { Stack } from 'expo-router';

import { colors } from '@/theme';

/** Volver desde un cara a cara abierto desde otra pestaña cae en el grupo. */
export const unstable_settings = { initialRouteName: 'index' };

/** Grupo y cara a cara comparten la pestaña «Grupos» (en el prototipo H2H la deja activa). */
export default function GroupsLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface.app } }}
    />
  );
}
