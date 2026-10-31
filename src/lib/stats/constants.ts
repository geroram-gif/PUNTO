import type { MatchFormat } from './types';

/** Umbrales (design/tokens.json → `thresholds`). */
export const MIN_RANK = 5;
export const MIN_DUO = 3;
export const MIN_H2H = 5;

export const FORMAT_LABEL: Readonly<Record<MatchFormat, string>> = {
  one: '1 set',
  bo3: 'Mejor de 3',
  st: '2 sets + súper',
};
