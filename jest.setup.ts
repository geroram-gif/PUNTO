// Demo sin esqueleto de carga en los tests (los que lo prueban lo activan a mano).
process.env.EXPO_PUBLIC_DEMO_CARGA = '0';

// AsyncStorage es un módulo nativo: en Jest se usa el mock oficial en memoria.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
