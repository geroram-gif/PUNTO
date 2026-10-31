# PUNTO.

**Cada partido cuenta.** App social de pádel amateur para iPhone: tu grupo carga los partidos y PUNTO arma el historial, los rankings, las duplas y los cara a cara.

- Prototipo navegable: https://claude.ai/artifact/835hXvMMJhTmtwzko2dW26
- Diseño y handoff: [`design/`](design/HANDOFF.md)
- Producto y alcance: [`docs/brief-maestro.md`](docs/brief-maestro.md) · [`docs/sprint-02.md`](docs/sprint-02.md)
- Plan de implementación: [`docs/PLAN.md`](docs/PLAN.md)
- Instrucciones para Claude Code: [`CLAUDE.md`](CLAUDE.md)

Stack: React Native · Expo SDK 58 · TypeScript estricto · Expo Router · Supabase (Fase 3).

## Cómo arrancar

Requisitos: Node 22 LTS y npm. Para probar en el iPhone, la app Expo Go (SDK 58) o un simulador de iOS (macOS con Xcode).

```bash
npm install
```

```bash
npm start
```

Escaneá el QR con la cámara del iPhone (Expo Go) o apretá `i` para abrir el simulador de iOS. No hace falta ningún `.env`: la app corre sin backend, con los datos demo del prototipo (Tomi, «Los del Jueves» y «Los Pibes», 36 partidos) y el «hoy» fijo del prototipo (31/10/2026).

### Estados de la demo

Equivalen a los ajustes (Tweaks) del prototipo. Se eligen al arrancar con variables públicas de Expo (ver `.env.example`):

```bash
EXPO_PUBLIC_DEMO_ESCENARIO=usuario-nuevo npm start
```

| Variable | Valores | Qué muestra |
|---|---|---|
| `EXPO_PUBLIC_DEMO_ESCENARIO` | `demo` · `usuario-nuevo` · `grupo-sin-partidos` | Datos completos, usuario sin grupos ni partidos, o «Los del Martes» vacío |
| `EXPO_PUBLIC_DEMO_ERROR_DE_RED` | `1` | El primer guardado falla y conserva lo cargado |
| `EXPO_PUBLIC_DEMO_NOMBRES_LARGOS` | `1` | Nombres largos para probar truncado |
| `EXPO_PUBLIC_DEMO_CARGA` | `0` | Sin esqueleto de carga al abrir (por defecto se ve 800 ms) |

Los cara a cara de referencia: Nico (historial), Pipo (muestra chica), Gonza en Los Pibes (mano a mano), Fede en Los Pibes (sin cruces).

## Verificaciones

| Comando | Qué hace |
|---|---|
| `npm run typecheck` | `tsc --noEmit` con TypeScript estricto |
| `npm run lint` | ESLint (`eslint-config-expo` + Prettier) |
| `npm run format` / `npm run format:check` | Prettier |
| `npm test` | Jest (`jest-expo`): motor, tokens, view-models, store, navegación y el recorrido completo |
| `npm run test:engine-original` | El script original `design/logic/test.js` |
| `npm run check` | Todo lo anterior salvo el script original, en orden |

CI (GitHub Actions) corre lo mismo en cada PR.

## Estructura

```
app/                        Rutas de Expo Router (solo importan la pantalla de src/features)
  _layout.tsx               Raíz: fuentes, áreas seguras, store demo, hoja de detalle y toast globales
  (tabs)/                   Barra inferior (AppTabBar): Inicio, Grupos, Perfil
    index.tsx               01 Inicio
    groups/index.tsx        02 Grupo (el grupo abierto vive en el store, como en el prototipo)
    groups/h2h.tsx          06 Cara a cara (?rival=&group=; deja activa la pestaña Grupos)
    profile.tsx             05 Perfil global
  match/new.tsx             03 Registrar partido (?group= o ?edit=<id> para corregir)
  result/[id].tsx           04 Resultado
src/
  components/               Componentes con los nombres de data-component (MatchCard, RankingRow, BottomSheet…)
  components/ui/            Primitivas: Txt, Icon, Button, etiquetas, Wordmark
  features/<pantalla>/      Pantalla + view-model puro (vm.ts) por pantalla
  features/shared/ctx.ts    Helpers de presentación compartidos (port de renderVals)
  lib/stats/                Motor de estadísticas puro + tests (port de design/logic/engine.js)
  lib/store/                Store local (Context + reducer): agregar, corregir, borrar, invitados
  lib/demo/seed.ts          Datos demo (port de design/logic/seed.js)
  theme/                    Tokens de design/tokens.json + tonos del prototipo que no están ahí
design/                     Handoff original de diseño. Referencia: no se modifica.
```

La UI no calcula: cada pantalla arma su view-model con `src/features/<pantalla>/vm.ts`, que solo usa el motor. Todas las cifras se recalculan a partir de `state.matches`.

## Motor de estadísticas

`src/lib/stats` es un port 1:1 de `design/logic/engine.js`. Además de las cifras del prototipo (`engine.test.ts`), `parity.test.ts` corre el motor original y el port sobre las mismas entradas (seed completo, borrados, correcciones, partidos aleatorios y todos los marcadores posibles) y exige resultados idénticos. Si cambia una regla, cambia primero en `design/` (con aprobación de diseño) y después acá.
