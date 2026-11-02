# Supabase

Backend de PUNTO: Postgres con RLS + RPC, y Auth por email. Todo el código vive en `supabase/`.

## Estado

| | |
|---|---|
| Esquema, RLS y RPC | Escritos y **probados** en un Postgres embebido (PGlite) con las migraciones reales: `npm test` |
| Proyecto en la nube | **No existe todavía.** Hay que crearlo (ver abajo). No se creó ni se tocó ningún proyecto de Supabase |
| Auth por email | Implementada en la app y probada con un doble de Auth; **falta probarla contra un Supabase real** |
| App contra Supabase real | Sin probar: los tests usan las mismas migraciones y las mismas RPC, pero no la red ni PostgREST |

## Qué requiere credenciales o acciones externas

1. Crear el proyecto (Dashboard de Supabase; región sa-east-1 por cercanía). Es un servicio con costo posible: lo decide el dueño.
2. Aplicar las migraciones: `supabase link --project-ref <ref>` y `supabase db push` (o pegar los `.sql` de `supabase/migrations/` en orden en el SQL Editor).
3. Auth → Providers → Email: activar, **desactivar «Confirm email»**, longitud de OTP **6**.
4. Auth → Email Templates: en «Confirm signup» y «Magic Link» usar el contenido de `supabase/templates/*.html`. **Tienen que incluir `{{ .Token }}`**: sin eso el mail llega con un link y no con el código que pide la app.
5. Auth → Rate Limits: ajustar los envíos de mail (el SMTP por defecto de Supabase es muy limitado: para producción configurar un SMTP propio).
6. Copiar `Project URL` y la clave **anon / publishable** a `.env.local` (`EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
7. Verificar en el panel que las tablas de `public` tengan RLS activado (Advisors → Security).

**Nunca** poner la `service_role` key en la app, en `EXPO_PUBLIC_*`, ni en el repositorio.

## Modelo

`players` es global (vinculado a un perfil, o invitado sin cuenta); los grupos se arman con `group_members`. Así la misma persona es la misma en todos sus grupos y cada partido cuenta una sola vez en su perfil global. Esto ajusta la propuesta de `docs/PLAN.md` (que ponía `players.group_id`), y coincide con el modelo de `design/HANDOFF.md`.

El ganador no se guarda: se deriva de los sets. Las estadísticas tampoco: la app lee los partidos (`public.app_snapshot`) y los calcula con el motor de `src/lib/stats`.

## Seguridad

- **Los clientes no escriben tablas.** `anon` y `authenticated` solo tienen `SELECT` (con RLS, limitado a los grupos propios) y `EXECUTE` sobre una lista corta de RPC. Un test falla si alguna función nueva de `public` queda abierta.
- Las escrituras son RPC `SECURITY DEFINER` (`search_path = ''`) que validan permisos y datos y escriben todo en una transacción: o queda el partido completo o no queda nada. Un trigger diferido revalida cada partido al cerrar la transacción.
- Corregir o borrar un partido: admin del grupo o quien lo cargó. Quien no es del grupo recibe el mismo error que si el partido no existiera.
- Validación del resultado en la base, idéntica a la del motor (test de paridad sobre ~12 000 combinaciones).
- Límites de abuso: 10 grupos creados por persona, 40 integrantes por grupo, 25 pedidos pendientes por grupo, 5 por persona, 7 días de espera tras un rechazo.
- Las invitaciones son códigos de 64 bits que un admin puede renovar. Un admin aprueba cada ingreso.
- Revisión de seguridad de las migraciones por un agente independiente: ver el historial del PR (se corrigieron autor nulo en permisos, herencia de admin al darse de baja, privilegios por defecto y límites de abuso).

## Baja de cuenta

La app **pide** la baja (`request_account_deletion`). La procesa el equipo, con la service role y fuera de la app:

```sql
select public.process_account_deletion('<uuid del usuario>');
```

Reemplaza su nombre por «Ex jugador» (sus partidos quedan en el historial de los demás), hereda la administración de sus grupos a otro miembro con cuenta y borra la cuenta. Falta definir el plazo y el proceso operativo.

## Límites conocidos

- Sin throttling de intentos fallidos de invitación más allá del rate limit de la API.
- Los invitados no se pueden vincular a un usuario que se registre después (el texto del prototipo lo menciona; queda para después del MVP).
- Sin tiempo real: la app se actualiza al abrirla, al volver a primer plano y después de cada cambio propio.
- Sin recuperación de acceso si se pierde el mail (el ingreso es solo por código al mail).
