import { Stack } from 'expo-router';

import { colors } from '@/theme';

/** Grupos y cara a cara comparten la pestaña «Grupos» (en el prototipo H2H la deja activa). */
export default function GroupsLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface.app } }}
    />
  );
}
