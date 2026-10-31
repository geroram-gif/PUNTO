# PUNTO. · Prototipo MVP (sprint 02)

Paquete de handoff. La fuente de verdad visual e interactiva es el Artifact de Design (canvas). Esta carpeta trae las fuentes de ese canvas y la lógica separada para que Claude Code implemente sin inventar decisiones.

## Contenido

```
design/prototype/   Fuentes del canvas (.dc.html). Se ven en el Artifact, no sueltas en un navegador.
  App.dc.html       Prototipo completo: 6 pantallas, estado compartido, datos + motor + navegación.
  Home/Grupo/Registrar/Resultado/Perfil/H2H.dc.html   Entradas al mismo prototipo, cada una arranca en su pantalla.
  Main.dc.html      Sistema de diseño (tokens, tipografía, componentes).
  Estados.dc.html   Referencia estática de estados límite.
  canvas.json       Disposición del canvas.
design/logic/
  seed.js           Datos demo (36 partidos). Única fuente de verdad.
  engine.js         Motor de estadísticas puro (sin UI). Portar a TypeScript.
  test.js           Verifica que el motor reproduce todas las cifras mostradas (node design/logic/test.js).
design/tokens.json  Tokens de diseño.
```

## Arquitectura del prototipo (y cómo mapearla a Expo)

| Prototipo | Producción sugerida |
|---|---|
| `PUNTO_SEED` (datos) | Tablas Supabase: `profiles`, `groups`, `group_members`, `matches`, `match_sets` |
| `PuntoStats` (cálculo) | `lib/stats/*.ts` puro + vistas o funciones SQL para ranking y rachas |
| Métodos `go/back/tab` | Expo Router: tabs `(tabs)/index`, `(tabs)/groups/[id]`, `(tabs)/profile`; modales `match/new`, `match/[id]`, `h2h/[rival]` |
| `renderVals()` | Hooks de view-model por pantalla (`useHomeVM`, `useGroupVM`…) |
| Markup `data-component="…"` | Componentes RN con el mismo nombre |

## Modelo de datos

```ts
type Player = { id: string; name: string; fullName: string; initials: string; avatarColor: string; isGuest: boolean; linkedUserId?: string };
type Group  = { id: string; name: string; initials: string; color: string; adminIds: string[]; memberIds: string[] };
type Match  = { id: string; groupId: string; date: string /* YYYY-MM-DD */; seq: number;
                teamA: [string, string]; teamB: [string, string];
                format: 'one' | 'bo3' | 'st'; sets: [number, number][] /* A-B */;
                createdBy: string; edited: boolean };
```
El ganador no se guarda: se deriva de los sets (`analyze`). Un partido pertenece a un solo grupo y nunca se cuenta dos veces en el perfil global.

## Reglas estadísticas (implementadas en engine.js)

- Redondeo único: .5 sube (`Math.floor(x*100 + 0.5)`).
- Orden cronológico determinista: fecha, luego `seq`, luego id.
- Ranking por grupo: mínimo 5 partidos; orden por % de victorias, desempate por ganados, luego % de sets, luego nombre. Empates totales comparten puesto ("=2").
- Provisorios: menos de 5 partidos, sin puesto, con progreso "n de 5".
- Duplas: mismo lado; se destacan desde 3 partidos juntos; menos de 3 = provisorias.
- Cara a cara: solo lados opuestos; con menos de 5 cruces no hay veredicto ("Muestra chica").
- Rachas: secuencia cronológica; editar o borrar un partido recalcula todo.
- Supertiebreak cuenta como set para el % de sets.
- Sets válidos: 6-0 a 6-4, 7-5, 7-6. Supertiebreak: a 10 o más con 2 de diferencia (si pasa de 10, diferencia exacta de 2).

## Permisos (MVP)

Admin del grupo: corrige o borra cualquier partido. Miembro: corrige los que cargó. En la demo Tomi es admin de Los del Jueves y miembro común de Los Pibes (los partidos cargados por Gonza no se pueden corregir).

## Estados y cómo verlos en el canvas

Ajustes (Tweaks) de cada artboard del prototipo:
- `escenario`: demo · usuario nuevo (sin grupos ni partidos) · grupo sin partidos (suma "Los del Martes", vacío).
- `simularErrorDeRed`: el primer guardado falla y conserva lo cargado.
- `nombresLargos`: nombres de grupo y jugador largos para probar truncado.
- `carga`: muestra el esqueleto de carga al abrir (solo App).
- En H2H: `rivalInicial` (fede = sin cruces, pipo = muestra chica, gonza = mano a mano).

## Mock vs. producto real

Simulado en el prototipo: fecha de hoy fija (31/10/2026), guardado con demora de 900 ms, compartir con el menú del navegador si existe, link de invitación de prueba, ajustes y "Primeros pasos" (próxima iteración), sin fotos reales. Real y ya definido: todas las reglas de cálculo, validaciones, permisos y la navegación.

## Notas para React Native

- `navigator.clipboard` → `expo-clipboard`; `navigator.share` → `Share` de RN o `expo-sharing` con la tarjeta exportada como imagen (`react-native-view-shot`).
- Hojas modales → `@gorhom/bottom-sheet` o presentación modal nativa de Expo Router.
- Selector de fecha → `@react-native-community/datetimepicker`.
- Animaciones → `react-native-reanimated`, respetando `AccessibilityInfo.isReduceMotionEnabled`.
- El cálculo es O(partidos); para grupos grandes conviene materializar ranking y rachas en Supabase y recalcular con trigger al insertar, editar o borrar.
- Fuentes: `@expo-google-fonts/sora` e `@expo-google-fonts/inter`. Numerales tabulares: `fontVariant: ['tabular-nums']`.

## Correcciones de datos respecto de la iteración 1

Dos cifras de la iteración 1 eran imposibles de reproducir con partidos reales y se corrigieron con el cambio mínimo:
- Nico tenía 9 victorias en 16, pero perdió 8 veces contra Tomi (máximo 8 victorias). Ahora 16 PJ, 8 G, 50%. Para mantener 24 partidos, Juani pasa de 4 a 5 victorias (42%). El orden del ranking no cambia.
- La dupla Nico y Lean pasa de 3 a 2 victorias en 6 (Lean no podía sumar más de 6 victorias en total).
- Pipo ya jugó contra Tomi el 8 de octubre (dato de la lista de partidos), así que su cara a cara es 2-0 y no "sin cruces". El estado sin cruces se ve con Fede en Los Pibes.
