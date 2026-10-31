import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/theme';

/**
 * El prototipo mide el padding superior desde el borde del viewport de referencia
 * (safeTop 59). Esto lo traduce al inset real: `useTopInset(54)` = inset − 5.
 */
export function useTopInset(prototypePx: number = layout.safeTop): number {
  const { top } = useSafeAreaInsets();
  return Math.max(0, top + prototypePx - layout.safeTop);
}
