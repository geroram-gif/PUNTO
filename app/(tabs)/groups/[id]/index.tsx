import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ScreenPlaceholder title="Grupo" detail={`Grupo ${id}. Pantalla de la Fase 2.`} />;
}
