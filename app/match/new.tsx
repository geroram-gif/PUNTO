import { router } from 'expo-router';

import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function RegisterMatchScreen() {
  return (
    <ScreenPlaceholder
      title="Registrar partido"
      detail="Pantalla de la Fase 2."
      surface="light"
      onClose={() => router.back()}
    />
  );
}
