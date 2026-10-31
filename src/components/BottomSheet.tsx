import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { motion, palette, protoColors, radius } from '@/theme';

import { Icon, Txt, useReduceMotion } from './ui';

/**
 * Hoja modal crema que sube desde abajo (280 ms). Fondo navy al 60%: tocarlo cierra,
 * salvo mientras se guarda (`locked`). Respeta «reducir movimiento».
 */
export function BottomSheet({
  visible,
  title,
  onClose,
  locked = false,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  locked?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const [y] = useState(() => new Animated.Value(0));
  const h = Dimensions.get('window').height;

  useEffect(() => {
    if (!visible) return;
    if (reduce) {
      y.setValue(0);
      return;
    }
    y.setValue(h);
    Animated.timing(y, {
      toValue: 0,
      duration: motion.sheet.duration,
      easing: Easing.bezier(...motion.sheet.bezier),
      useNativeDriver: true,
    }).start();
  }, [visible, reduce, y, h]);

  const close = () => {
    if (!locked) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          disabled={locked}
          onPress={close}
          style={[StyleSheet.absoluteFill, { backgroundColor: protoColors.backdrop }]}
        />
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={title}
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 34), transform: [{ translateY: y }] },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Txt accessibilityRole="header" d w={700} s={22} style={{ flex: 1 }}>
              {title}
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              disabled={locked}
              onPress={close}
              style={styles.close}
            >
              <Icon name="close" size={22} color={palette.navy} />
            </Pressable>
          </View>
          <ScrollView
            bounces={false}
            contentContainerStyle={{ gap: 14 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: palette.cream,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: radius.chip,
    backgroundColor: protoColors.creamEdge,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  close: {
    width: 44,
    height: 44,
    marginRight: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
