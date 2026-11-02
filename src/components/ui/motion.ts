import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * «Reducir movimiento» del sistema. `known` es false hasta que iOS responde: mientras tanto no
 * se arranca ninguna animación (así quien pidió reducir el movimiento nunca ve una a medias).
 */
export function useReduceMotionState(): { reduce: boolean; known: boolean } {
  const [s, setS] = useState({ reduce: false, known: false });
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (v) => alive && setS({ reduce: v, known: true }),
      () => alive && setS({ reduce: false, known: true }),
    );
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) =>
      setS({ reduce: v, known: true }),
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return s;
}

export function useReduceMotion(): boolean {
  return useReduceMotionState().reduce;
}
