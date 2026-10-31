import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MatchSheetHost, ToastHost } from '@/features/match/MatchSheetHost';
import { envDemoConfig, PuntoProvider } from '@/lib/store';
import { colors, fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const [config] = useState(envDemoConfig);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <PuntoProvider config={config}>
        <View style={{ flex: 1, backgroundColor: colors.surface.app }}>
          <StatusBar style="light" />
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
          </Stack>
          <MatchSheetHost />
          <ToastHost />
        </View>
      </PuntoProvider>
    </SafeAreaProvider>
  );
}
