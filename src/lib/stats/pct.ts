/** Redondeo único de la app: .5 sube. */
export function pct(w: number, n: number): number {
  return n ? Math.floor((w / n) * 100 + 0.5) : 0;
}
