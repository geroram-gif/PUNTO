import { router, usePathname, type Href } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/components/AppTabBar';
import { useCtx } from '@/features/useCtx';
import { usePunto } from '@/lib/store';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { state } = usePunto();
  const c = useCtx();
  const pathname = usePathname();
  // En la pantalla de un grupo, «Partido» carga en ese grupo (como el prototipo).
  const onGroup = pathname === '/groups';
  const g = onGroup ? c.gById(state.groupId) : undefined;
  const label = 'Partido: registrar un partido' + (g ? ' en ' + c.gname(g) : '');

  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) =>
        state.loading ? null : (
          <AppTabBar
            {...props}
            registerAccessibilityLabel={label}
            onRegister={() => router.push((g ? `/match/new?group=${g.id}` : '/match/new') as Href)}
          />
        )
      }
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.surface.app } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
