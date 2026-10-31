/**
 * Ajustes de la demo (equivalen a los «Tweaks» del prototipo). Se eligen al arrancar con
 * variables de entorno públicas de Expo, sin UI propia:
 *   EXPO_PUBLIC_DEMO_ESCENARIO=demo | usuario-nuevo | grupo-sin-partidos
 *   EXPO_PUBLIC_DEMO_ERROR_DE_RED=1     el primer guardado falla y conserva lo cargado
 *   EXPO_PUBLIC_DEMO_NOMBRES_LARGOS=1   nombres de grupo y jugador largos
 *   EXPO_PUBLIC_DEMO_CARGA=0            sin esqueleto de carga al abrir
 */
export type DemoScenario = 'demo' | 'usuario-nuevo' | 'grupo-sin-partidos';

export interface DemoConfig {
  scenario: DemoScenario;
  netError: boolean;
  longNames: boolean;
  loading: boolean;
  /** Demora simulada de la carga inicial y del guardado (ms). */
  loadingMs: number;
  saveMs: number;
}

export const defaultDemoConfig: DemoConfig = {
  scenario: 'demo',
  netError: false,
  longNames: false,
  loading: true,
  loadingMs: 800,
  saveMs: 900,
};

const SCENARIOS: readonly DemoScenario[] = ['demo', 'usuario-nuevo', 'grupo-sin-partidos'];

export function demoConfigFromEnv(env: Record<string, string | undefined>): DemoConfig {
  const scenario = env.EXPO_PUBLIC_DEMO_ESCENARIO as DemoScenario | undefined;
  return {
    ...defaultDemoConfig,
    scenario: scenario && SCENARIOS.includes(scenario) ? scenario : 'demo',
    netError: env.EXPO_PUBLIC_DEMO_ERROR_DE_RED === '1',
    longNames: env.EXPO_PUBLIC_DEMO_NOMBRES_LARGOS === '1',
    loading: env.EXPO_PUBLIC_DEMO_CARGA !== '0',
  };
}
