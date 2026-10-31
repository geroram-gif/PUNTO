/**
 * Espaciado, layout, radios, sombras y movimiento.
 * Fuente: design/tokens.json (`space`, `layout`, `radius`, `shadow`, `motion`).
 */
export const space = [4, 8, 12, 16, 20, 24, 32, 48] as const;

export const layout = {
  screenGutter: 20,
  /** Valores del viewport de referencia (390×844). En el dispositivo usar los insets reales. */
  safeTop: 59,
  safeBottom: 34,
  tabBarHeight: 86,
  minTouch: 44,
  referenceViewport: { width: 390, height: 844 },
} as const;

export const radius = {
  chip: 999,
  input: 14,
  card: 20,
  hero: 28,
  sheet: 28,
  avatar: 999,
  groupBadge: 14,
} as const;

/** Sombras como `boxShadow` CSS (soportado por React Native en la nueva arquitectura). */
export const shadow = {
  card: '0 1px 0 rgba(25,40,59,.06), 0 10px 24px -14px rgba(25,40,59,.35)',
  sheet: '0 24px 48px -20px rgba(25,40,59,.45)',
  /** Sobre fondos oscuros no hay sombra. */
  onDark: 'none',
} as const;

/**
 * Movimiento. Con «reducir movimiento» activo no se anima (AccessibilityInfo.isReduceMotionEnabled).
 */
export const motion = {
  panel: { duration: 220, easing: 'ease-out', offsetY: 6 },
  sheet: { duration: 280, bezier: [0.2, 0.8, 0.2, 1] },
  celebration: { popDuration: 550, dotsDuration: 1200 },
} as const;

/** Sombras del prototipo que no figuran en tokens.json. */
export const protoShadow = {
  toast: '0 16px 32px -16px rgba(0,0,0,0.5)',
} as const;
