import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/components/AppTabBar';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} onRegister={() => router.push('/match/new')} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.surface.app } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
