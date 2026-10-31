import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** «Reducir movimiento» del sistema: con esto activo no se anima nada. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (v) => alive && setReduce(v),
      () => {},
    );
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}
