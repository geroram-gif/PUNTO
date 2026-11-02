import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadErrorScreen } from '@/components/LoadErrorScreen';
import { LoadingState } from '@/components/LoadingState';
import { SignInScreen } from '@/features/auth/SignInScreen';
import { MatchSheetHost, ToastHost } from '@/features/match/MatchSheetHost';
import { ProfileSetupScreen } from '@/features/profile/ProfileSetupScreen';
import { createBackend } from '@/lib/backend';
import { envDemoConfig, PuntoProvider, usePunto } from '@/lib/store';
import { colors, fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const [config] = useState(envDemoConfig);
  // Con EXPO_PUBLIC_SUPABASE_URL/ANON_KEY: cuentas y datos reales. Sin ellas: demo del prototipo.
  const [backend] = useState(createBackend);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <PuntoProvider config={config} backend={backend}>
        <View style={{ flex: 1, backgroundColor: colors.surface.app }}>
          <StatusBar style="light" />
          <Navigator />
          <MatchSheetHost />
          <ToastHost />
        </View>
      </PuntoProvider>
    </SafeAreaProvider>
  );
}

/**
 * La sesión decide qué se ve, sin navegar: cargando, error, ingreso, armado de perfil, o la app.
 * El stack de la app solo existe con la sesión lista (y arranca siempre en Inicio).
 */
function Navigator() {
  const { state } = usePunto();
  switch (state.phase) {
    case 'loading':
      return <LoadingState />;
    case 'error':
      return <LoadErrorScreen />;
    case 'signedOut':
      return <SignInScreen />;
    case 'needsProfile':
      return <ProfileSetupScreen />;
    case 'ready':
      return (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.surface.app },
          }}
        >
          <Stack.Screen name="(tabs)" />
          {/* Registrar partido: pantalla completa, sin barra inferior, se cierra con «Cancelar». */}
          <Stack.Screen name="match/new" options={{ presentation: 'fullScreenModal' }} />
          {/* Resultado: reemplaza al registro al guardar; se sale con «Listo». */}
          <Stack.Screen
            name="result/[id]"
            options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
          />
          <Stack.Screen name="group/new" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="join" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="profile-edit" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
      );
  }
}
