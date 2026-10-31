# Plan de implementación

Cada fase termina en un PR revisable. No avanzar a la siguiente sin aprobar la anterior.

## Fase 0 · Base del proyecto
- Expo + TypeScript estricto + Expo Router, ESLint, Prettier, Jest o Vitest.
- `src/theme` desde `design/tokens.json`; fuentes Sora e Inter con `@expo-google-fonts`.
- Barra de tabs (Inicio, Grupos, Partido, Perfil) con el diseño de `AppTabBar` y áreas seguras.

## Fase 1 · Motor de estadísticas
- Portar `design/logic/engine.js` a `src/lib/stats/*.ts` con tipos del modelo (`design/HANDOFF.md`).
- Portar `seed.js` a `src/lib/demo/seed.ts`.
- Tests que reproduzcan todas las cifras de `design/logic/test.js` (Tomi 22/14/8, 64%, racha 3, sets 32-20, ranking de ambos grupos, Nico 8-2, duplas).

## Fase 2 · Pantallas con datos demo (sin backend)
- Un store local (Zustand o Context + reducer) con los partidos del seed; acciones: agregar, corregir, borrar partido; sumar invitado.
- Componentes base del sistema: `PlayerAvatar`, `MatchCard`, `RankingRow`, `SectionTabs`, `StatHighlight`, `BottomSheet`, `Toast`, `EmptyState`.
- Pantallas en este orden: Inicio, Grupo (4 pestañas), Registrar partido, Resultado, Perfil global, Cara a cara, más el detalle de partido como hoja modal.
- Replicar el recorrido del prototipo: registrar un partido actualiza ranking, duplas, cara a cara, racha y perfil.
- Estados: usuario nuevo, grupo sin partidos, provisorios, invitados, sin cruces, resultado inválido, error de red, carga, corrección y borrado con confirmación.

## Fase 3 · Supabase
- Esquema propuesto (ajustar si hace falta):
  - `profiles` (id = auth.users.id, name, initials, avatar_color)
  - `players` (id, group_id, profile_id null si es invitado, display_name, is_guest)
  - `groups` (id, name, initials, color, created_by)
  - `group_members` (group_id, player_id, role: admin | member)
  - `matches` (id, group_id, played_on date, seq, format, created_by, edited_at)
  - `match_players` (match_id, player_id, team: A | B) con restricción de 4 jugadores distintos, 2 por equipo
  - `match_sets` (match_id, set_index, games_a, games_b)
- RLS: solo miembros ven y cargan partidos de su grupo; corrige o borra el admin o quien lo cargó; el historial global de un jugador es privado.
- Auth por email (magic link). Reemplazar el store demo por queries, con el seed como datos de desarrollo.
- Validación de sets también en la base (función o check), no solo en la app.

## Fase 4 · Pulido
- Compartir tarjeta como imagen (`react-native-view-shot` + `Share`).
- Animación de celebración en Resultado con `react-native-reanimated`.
- Revisión de accesibilidad con VoiceOver y tamaños de texto grandes.
