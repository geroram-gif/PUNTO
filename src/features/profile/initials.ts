/**
 * Iniciales como las calcula el servidor (private.initials_of): primera letra de la primera y de
 * la última palabra («Juan Ignacio Vega» → JV). Con una palabra, sus dos primeras letras.
 */
export function initialsOf(name: string, byWords = true): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (byWords && words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}
