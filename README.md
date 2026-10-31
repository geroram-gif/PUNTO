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

Escaneá el QR con la cámara del iPhone (Expo Go) o apretá `i` para abrir el simulador de iOS. No hace falta ningún `.env` todavía: la app corre sin backend.

## Verificaciones

| Comando | Qué hace |
|---|---|
| `npm run typecheck` | `tsc --noEmit` con TypeScript estricto |
| `npm run lint` | ESLint (`eslint-config-expo` + Prettier) |
| `npm run format` / `npm run format:check` | Prettier |
| `npm test` | Jest (`jest-expo`): motor de estadísticas, tokens y navegación |
| `npm run test:engine-original` | El script original `design/logic/test.js` |
| `npm run check` | Todo lo anterior salvo el script original, en orden |

CI (GitHub Actions) corre lo mismo en cada PR.

## Estructura

```
app/                      Rutas de Expo Router
  _layout.tsx             Raíz: fuentes Sora + Inter, áreas seguras, Stack
  (tabs)/                 Barra inferior (AppTabBar): Inicio, Grupos, Perfil
    index.tsx             Inicio
    groups/               Grupos y su Stack
      [id]/index.tsx      Grupo
      [id]/h2h/[rival].tsx  Cara a cara (deja activa la pestaña Grupos, como el prototipo)
    profile.tsx           Perfil global
  match/new.tsx           Registrar partido (modal a pantalla completa; lo abre «Partido»)
  match/[id].tsx          Detalle de partido (modal)
src/
  components/             Componentes con los nombres de data-component (AppTabBar…)
  features/<pantalla>/    View-models y piezas por pantalla (desde la Fase 2)
  lib/stats/              Motor de estadísticas puro + tests (port de design/logic/engine.js)
  lib/demo/seed.ts        Datos demo (port de design/logic/seed.js)
  theme/                  Tokens de design/tokens.json (colores, tipografía, espaciado, radios…)
design/                   Handoff original de diseño. Referencia: no se modifica.
```

Las pantallas de `app/` todavía son provisorias (`ScreenPlaceholder`): el diseño real llega en la Fase 2.

## Motor de estadísticas

`src/lib/stats` es un port 1:1 de `design/logic/engine.js`. Además de las cifras del prototipo (`engine.test.ts`), `parity.test.ts` corre el motor original y el port sobre las mismas entradas (seed completo, borrados, correcciones, partidos aleatorios y todos los marcadores posibles) y exige resultados idénticos. Si cambia una regla, cambia primero en `design/` (con aprobación de diseño) y después acá.
