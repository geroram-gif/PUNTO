import { useEffect, useState } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';

import { palette, radius } from '@/theme';

import { useReduceMotion, useTopInset, Wordmark } from './ui';

function Bone({
  style,
  color = palette.navyLine,
  o,
}: {
  style: ViewStyle;
  color?: string;
  o: Animated.Value;
}) {
  return <Animated.View style={[{ backgroundColor: color, opacity: o }, style]} />;
}

/** Esqueleto de carga de Inicio (sin spinner a pantalla completa). */
export function LoadingState() {
  const top = useTopInset();
  const reduce = useReduceMotion();
  const [o] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduce) return;
    o.setValue(0.55);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(o, {
          toValue: 0.55,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [o, reduce]);
  return (
    <View
      accessible
      accessibilityLabel="Cargando"
      accessibilityState={{ busy: true }}
      style={{
        flex: 1,
        backgroundColor: palette.navy,
        paddingTop: top,
        paddingHorizontal: 20,
        paddingBottom: 30,
        gap: 14,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 44,
        }}
      >
        <Wordmark />
        <Bone o={o} style={{ width: 44, height: 44, borderRadius: 22 }} />
      </View>
      <Bone o={o} style={{ width: 140, height: 14, borderRadius: radius.chip, marginTop: 6 }} />
      <Bone o={o} style={{ width: 200, height: 30, borderRadius: 10 }} />
      <Bone o={o} color={palette.navy2} style={{ height: 214, borderRadius: radius.hero }} />
      <Bone o={o} color={palette.navy2} style={{ height: 96, borderRadius: radius.card }} />
      <Bone o={o} color={palette.navy2} style={{ height: 108, borderRadius: radius.card }} />
    </View>
  );
}
