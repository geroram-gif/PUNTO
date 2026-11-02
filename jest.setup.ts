// Demo sin esqueleto de carga en los tests (los que lo prueban lo activan a mano).
process.env.EXPO_PUBLIC_DEMO_CARGA = '0';

// AsyncStorage es un módulo nativo: en Jest se usa el mock oficial en memoria.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// react-native-view-shot es nativo: en Jest devuelve una imagen de mentira.
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(async () => 'file:///tmp/tarjeta.png'),
}));

// Los tests corren con «reducir movimiento» activo: las animaciones de entrada no esconden nada.
// (Los componentes de movimiento se prueban en ese modo; el de movimiento normal es solo visual.)
import { AccessibilityInfo } from 'react-native';
jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
