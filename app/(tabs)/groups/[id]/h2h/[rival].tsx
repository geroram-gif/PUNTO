import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function HeadToHeadScreen() {
  const { id, rival } = useLocalSearchParams<{ id: string; rival: string }>();
  return (
    <ScreenPlaceholder
      title="Cara a cara"
      detail={`Con ${rival} en el grupo ${id}. Pantalla de la Fase 2.`}
    />
  );
}
