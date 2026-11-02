-- PUNTO. Seguridad (Fase 3): RLS + permisos mínimos.
--
-- Regla de oro: los clientes (anon / authenticated) NO escriben ninguna tabla. Solo pueden
-- LEER lo que RLS les permite (lo de sus propios grupos) y llamar a las RPC autorizadas.
-- El rol service_role (solo servidor, nunca en la app) es el único que procesa bajas de cuenta.

alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.join_requests enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.match_sets enable row level security;

-- ---------- Lectura ----------
-- group_invites y join_requests no tienen política: solo se tocan con RPC (nadie los lee suelto).

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid());

create policy players_select on public.players for select to authenticated
  using (profile_id = auth.uid() or public.shares_group_with(id));

create policy groups_select on public.groups for select to authenticated
  using (public.is_group_member(id));

create policy group_members_select on public.group_members for select to authenticated
  using (public.is_group_member(group_id));

create policy matches_select on public.matches for select to authenticated
  using (public.is_group_member(group_id));

create policy match_players_select on public.match_players for select to authenticated
  using (public.is_group_member(public.match_group_id(match_id)));

create policy match_sets_select on public.match_sets for select to authenticated
  using (public.is_group_member(public.match_group_id(match_id)));

-- ---------- Permisos ----------

-- Supabase otorga permisos amplios por defecto: se sacan y se vuelve a dar lo justo.
revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from public, anon, authenticated;
alter default privileges in schema public revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
-- Postgres le da EXECUTE a PUBLIC a toda función nueva; eso solo se saca SIN `in schema`.
-- Así una función futura nace cerrada y hay que abrirla a propósito con un grant.
alter default privileges revoke execute on functions from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_admin') then
    execute 'alter default privileges for role supabase_admin revoke execute on functions from public';
    execute 'alter default privileges for role supabase_admin in schema public revoke execute on functions from anon, authenticated';
  end if;
end $$;

grant select on public.profiles, public.players, public.groups, public.group_members,
  public.matches, public.match_players, public.match_sets to authenticated;

-- Helpers que usan las políticas (devuelven datos del propio usuario) y RPC de la app.
grant execute on function
  public.my_player_id(), public.is_group_member(uuid), public.is_group_admin(uuid),
  public.shares_group_with(uuid), public.match_group_id(uuid),
  public.update_profile(text, text, text), public.request_account_deletion(),
  public.create_group(text, text), public.get_group_invite(uuid), public.rotate_group_invite(uuid),
  public.preview_invite(text), public.request_join(text), public.pending_join_requests(),
  public.decide_join_request(uuid, boolean), public.add_guest(uuid, text),
  public.record_match(uuid, date, text, uuid[], uuid[], jsonb),
  public.update_match(uuid, date, text, uuid[], uuid[], jsonb), public.delete_match(uuid),
  public.app_snapshot()
  to authenticated;

-- Baja de cuenta: solo servidor.
grant execute on function public.process_account_deletion(uuid) to service_role;

-- El esquema `private` (validaciones y triggers) no es accesible desde la API.
revoke all on schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
