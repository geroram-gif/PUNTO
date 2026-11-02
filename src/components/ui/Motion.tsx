import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';

import { motion, palette } from '@/theme';

import { useReduceMotionState } from './motion';

/** Entra con un «pop» (0.6 → 1.06 → 1, 550 ms). Con «reducir movimiento» aparece quieto. */
export function Pop({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: ViewStyle;
}) {
  const { reduce, known } = useReduceMotionState();
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!known) return;
    if (reduce) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, {
      toValue: 1,
      duration: motion.celebration.popDuration,
      delay,
      easing: Easing.bezier(0.2, 0.9, 0.25, 1.2),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [known, reduce, delay, v]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
          transform: [
            { scale: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 1.06, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Aparece subiendo 6 pt (panel del sistema: 220 ms, ease-out). */
export function FadeUp({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: ViewStyle;
}) {
  const { reduce, known } = useReduceMotionState();
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!known) return;
    if (reduce) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, {
      toValue: 1,
      duration: motion.panel.duration,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [known, reduce, delay, v]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [motion.panel.offsetY, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const DOTS = [
  { dx: -60, dy: -50, size: 14, color: palette.navy, left: '60%', top: 40 },
  { dx: 70, dy: -30, size: 10, color: palette.lime, left: '62%', top: 44 },
  { dx: 40, dy: 60, size: 18, color: palette.cream, left: '58%', top: 50 },
  { dx: -40, dy: 70, size: 8, color: palette.lilac, left: '60%', top: 46 },
  { dx: 100, dy: 30, size: 12, color: palette.navy, left: '61%', top: 48 },
] as const;

/** Puntos de la celebración (1,2 s). Decorativos: no se muestran con «reducir movimiento». */
export function CelebrationDots() {
  const { reduce, known } = useReduceMotionState();
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!known || reduce) return;
    const a = Animated.timing(v, {
      toValue: 1,
      duration: motion.celebration.dotsDuration,
      delay: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [known, reduce, v]);
  if (!known || reduce) return null;
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 160 }}
    >
      {DOTS.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            borderRadius: d.size / 2,
            backgroundColor: d.color,
            opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, d.dx] }) },
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, d.dy] }) },
              { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
