# De este repositorio a TestFlight

Lo que hay hecho y lo que falta, sin suponer nada que no se haya probado.

## Estado

- La app compila y se empaqueta para iOS (`npx expo export --platform ios`).
- **No se probó en iPhone ni en simulador** (no hay macOS en el entorno de desarrollo). Antes de subir una build, hacer una pasada manual completa con VoiceOver y con tamaños de texto grandes.
- `eas.json` define tres perfiles: `simulator` (para el simulador de iOS), `preview` (distribución interna, necesita registrar los iPhone) y `production` (TestFlight / App Store, con número de build automático).
- `app.json` tiene el ícono y el splash de marca, y la configuración de iOS.

## Antes de la primera build (lo decide el dueño)

1. **Bundle identifier.** `app.json → expo.ios.bundleIdentifier` está en `com.punto.app` como **valor provisorio**. Tiene que ser único y el que se registre en Apple. Cambiarlo antes de la primera build: después no se puede.
2. **Cuenta de Apple Developer** (USD 99 por año) y acceso a App Store Connect. No se compró ni se creó nada.
3. **Cuenta de Expo** (gratis) y `eas init`, que escribe el `projectId` en `app.json`.
4. **Proyecto de Supabase** creado y configurado: ver [`supabase.md`](supabase.md). Sin él la build corre en modo demo.
5. **Íconos y arte**: el ícono y el splash se reprodujeron a partir del tablero de marca (la «P.» y el logo «PUNTO.» con Sora ExtraBold y los colores de `design/tokens.json`). Si Diseño tiene los archivos finales, reemplazar `assets/icon.png` (1024×1024, sin transparencia) y `assets/splash-icon.png`.
6. Política de privacidad y datos de soporte (App Store Connect los pide). La app pide la baja de cuenta desde Ajustes, como exige Apple, pero la baja la procesa una persona: definir el plazo.

## Pasos

```bash
npm install -g eas-cli
eas login
eas init
```

Variables públicas de la app (las dos son públicas; **nunca** la service role):

```bash
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "https://<ref>.supabase.co" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon o publishable key>" --visibility plaintext
```

Build de prueba en el simulador (necesita macOS para abrirla) y build de TestFlight:

```bash
eas build --platform ios --profile simulator
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

En App Store Connect: agregar testers internos en TestFlight y esperar el procesamiento.

## Lista de revisión antes de invitar testers

- [ ] Ingreso por código con un mail real (llega el código, no un link).
- [ ] Crear cuenta, completar perfil, crear grupo, invitar a otra persona, aprobar su ingreso.
- [ ] Cargar, corregir y borrar un partido; ver ranking, duplas y cara a cara actualizados.
- [ ] Compartir el resultado: se abre el menú de iOS con la imagen de la tarjeta.
- [ ] VoiceOver recorre cada pantalla con etiquetas claras; «Reducir movimiento» apaga las animaciones.
- [ ] Cerrar sesión y pedir la baja de cuenta.
- [ ] iPhone chico (SE) y tamaños de texto grandes sin cortes.
