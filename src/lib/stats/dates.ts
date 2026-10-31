import type { ISODate } from './types';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** Fechas calendario en UTC para que la zona horaria del dispositivo no corra el día. */
function parse(d: ISODate): Date {
  const p = d.split('-');
  return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
}

/** «Jue 29 oct» */
export function fmtShort(d: ISODate): string {
  const x = parse(d);
  return DAYS[x.getUTCDay()] + ' ' + x.getUTCDate() + ' ' + MONTHS[x.getUTCMonth()];
}

/** «jueves 29 de octubre» */
export function fmtLong(d: ISODate): string {
  const x = parse(d);
  return DAYS_LONG[x.getUTCDay()] + ' ' + x.getUTCDate() + ' de ' + MONTHS_LONG[x.getUTCMonth()];
}

/** «julio 2026» */
export function fmtMonthYear(d: ISODate): string {
  const x = parse(d);
  return MONTHS_LONG[x.getUTCMonth()] + ' ' + x.getUTCFullYear();
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
}

/** «hoy», «ayer», «hace n días» */
export function relDay(d: ISODate, today: ISODate): string {
  const n = daysBetween(d, today);
  if (n <= 0) return 'hoy';
  if (n === 1) return 'ayer';
  return 'hace ' + n + ' días';
}
