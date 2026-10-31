import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenPlaceholder
      title="Detalle del partido"
      detail={`Partido ${id}. Hoja modal de la Fase 2.`}
      surface="light"
    />
  );
}
