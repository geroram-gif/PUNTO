# PUNTO.

App social de pádel amateur para iPhone (Argentina). Los grupos de amigos cargan sus partidos y la app arma estadísticas, rankings por grupo, duplas, cara a cara y un perfil global. Tagline: «Cada partido cuenta.»

## Stack

React Native + Expo (SDK estable más reciente) + TypeScript estricto + Expo Router + Supabase (auth por email, Postgres, RLS). iOS primero. No agregar otras librerías grandes sin justificarlo en el PR.

## Fuentes de verdad (leer antes de programar)

1. `design/prototype/App.dc.html`: prototipo aprobado de las 6 pantallas. El markup muestra layout, colores, tamaños y textos exactos; cada bloque tiene `data-component="Nombre"`, que es el nombre del componente a crear. Se ve navegable en el Artifact: https://claude.ai/artifact/835hXvMMJhTmtwzko2dW26
2. `design/HANDOFF.md`: arquitectura, modelo de datos, reglas estadísticas, permisos, estados y notas para React Native.
3. `design/tokens.json`: colores, tipografía, espaciado, radios. No hardcodear valores fuera de `src/theme`.
4. `design/logic/engine.js` y `seed.js`: motor de estadísticas probado y datos demo. Portarlos a TypeScript sin cambiar el comportamiento; `design/logic/test.js` lista las cifras que tienen que coincidir.
5. `docs/brief-maestro.md` y `docs/sprint-02.md`: producto, alcance y reglas funcionales. `design/brand-board.png`: identidad visual.
6. `docs/PLAN.md`: orden de trabajo por fases.

Si algo del brief contradice al prototipo, manda el prototipo (ya incorpora correcciones de la revisión). Si falta una decisión de diseño, preguntá en vez de inventarla.

## Reglas que no se negocian

- Las estadísticas se derivan siempre de los partidos. Nunca guardar ni mostrar cifras escritas a mano. El ganador se calcula desde los sets.
- Un partido pertenece a un solo grupo y cuenta una sola vez en el perfil global.
- Umbrales: ranking desde 5 partidos, dupla destacada desde 3, veredicto de cara a cara desde 5. Redondeo único: .5 sube.
- Una sola acción principal para cargar partidos: el botón coral «Partido» de la barra inferior.
- Copy en español rioplatense natural, igual al del prototipo. Sin emojis en la UI.
- Accesibilidad: toques de 44 pt mínimo, contraste AA, `accessibilityLabel` en todo lo tocable, respetar «reducir movimiento». Nunca comunicar victoria o derrota solo con color.
- Fuera de alcance: reservas, pagos, chat, feeds públicos, rankings globales, torneos, Elo, IA, Android específico.

## Convenciones

- Estructura: `app/` (rutas de Expo Router), `src/components/`, `src/features/<pantalla>/`, `src/lib/stats/` (motor puro + tests), `src/lib/supabase/`, `src/theme/`, `supabase/migrations/`.
- Lógica pura en `src/lib/stats` con tests (Jest o Vitest). La UI no calcula estadísticas: consume view-models.
- Componentes con los nombres de `data-component` del prototipo (`MatchCard`, `RankingRow`, `SectionTabs`, `BottomSheet`…).
- Antes de cada PR: `npx tsc --noEmit`, lint y tests en verde.
- Commits chicos y en español. Trabajar en ramas y abrir PR; no pushear directo a `main`.
