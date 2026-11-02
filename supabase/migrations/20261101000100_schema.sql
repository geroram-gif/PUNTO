-- PUNTO. Esquema base (Fase 3).
--
-- Modelo (design/HANDOFF.md): un JUGADOR es global. Es un usuario con cuenta (vinculado a un
-- perfil) o un invitado sin cuenta. Un grupo se arma con `group_members`. Así la misma persona
-- es la misma en todos sus grupos y cada partido cuenta una sola vez en su perfil global.
-- (Ajusta la propuesta de docs/PLAN.md, que ponía `players.group_id`.)
--
-- Seguridad: los clientes NO escriben tablas. Todas las escrituras pasan por funciones RPC
-- (supabase/migrations/..._functions.sql) que validan permisos y datos en una sola transacción.
-- Las políticas RLS (..._security.sql) limitan además lo que se puede leer.

create schema if not exists private;

-- ---------- Perfiles y jugadores ----------

-- Cuenta de usuario (1:1 con auth.users). La identidad pública vive en `players`.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  onboarding_completed_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 24),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 60),
  initials text not null check (char_length(initials) between 1 and 2),
  avatar_color text not null default 'transparent'
    check (avatar_color ~ '^(#[0-9A-Fa-f]{6}|transparent)$'),
  -- Sin cuenta = invitado. Los invitados se dibujan con borde punteado.
  is_guest boolean generated always as (profile_id is null) stored,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Grupos ----------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  initials text not null check (char_length(initials) between 1 and 2),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, player_id)
);
create index group_members_player_idx on public.group_members (player_id);

-- Un link de invitación activo por grupo; rotarlo revoca el anterior.
create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  code text not null unique check (code ~ '^[0-9A-F]{12}$'),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index group_invites_one_active on public.group_invites (group_id) where revoked_at is null;

-- Quien usa un link pide entrar; un admin aprueba cada ingreso.
create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz
);
create unique index join_requests_one_pending
  on public.join_requests (group_id, requester_id) where status = 'pending';

-- ---------- Partidos ----------

-- El ganador NO se guarda: se deriva de los sets (private.match_result).
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  played_on date not null check (played_on >= date '2020-01-01'),
  -- Desempate cronológico determinista (fecha, seq, id), igual que el motor de estadísticas.
  seq bigint generated always as identity unique,
  format text not null check (format in ('one', 'bo3', 'st')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index matches_group_idx on public.matches (group_id, played_on, seq);

create table public.match_players (
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  team text not null check (team in ('A', 'B')),
  slot smallint not null check (slot in (1, 2)),
  primary key (match_id, player_id),
  unique (match_id, team, slot)
);
create index match_players_player_idx on public.match_players (player_id);

create table public.match_sets (
  match_id uuid not null references public.matches (id) on delete cascade,
  set_index smallint not null check (set_index between 1 and 3),
  games_a smallint not null check (games_a between 0 and 99),
  games_b smallint not null check (games_b between 0 and 99),
  primary key (match_id, set_index)
);

-- ---------- Validación de resultados (misma regla que src/lib/stats/results.ts) ----------

-- Set válido: 6-0 a 6-4, 7-5 o 7-6.
create function private.is_valid_set(a int, b int) returns boolean
language sql immutable parallel safe set search_path = '' as $$
  select (greatest(a, b) = 6 and least(a, b) <= 4)
      or (greatest(a, b) = 7 and least(a, b) in (5, 6))
$$;

-- Súper tie-break: a 10 o más con 2 de diferencia (si pasa de 10, diferencia exacta de 2).
create function private.is_valid_super(a int, b int) returns boolean
language sql immutable parallel safe set search_path = '' as $$
  select greatest(a, b) >= 10
     and greatest(a, b) - least(a, b) >= 2
     and (greatest(a, b) = 10 or greatest(a, b) - least(a, b) = 2)
$$;

-- Devuelve el ganador ('A' o 'B') o levanta una excepción si el resultado no es válido.
-- p_sets: [[a,b], ...] con exactamente los sets que el formato necesita (el tercero solo si 1-1).
create function private.match_result(p_format text, p_sets jsonb) returns text
language plpgsql immutable set search_path = '' as $$
declare
  v_base int;
  v_n int;
  v_wa int := 0;
  v_wb int := 0;
  v_target int;
  v_expected int;
  v_a int;
  v_b int;
  v_ok boolean;
  i int;
begin
  if p_format is null or p_format not in ('one', 'bo3', 'st') then
    raise exception 'Formato de partido inválido' using errcode = '22023';
  end if;
  if p_sets is null or jsonb_typeof(p_sets) <> 'array' then
    raise exception 'Los sets tienen que ser una lista' using errcode = '22023';
  end if;
  v_n := jsonb_array_length(p_sets);
  for i in 0 .. v_n - 1 loop
    if jsonb_typeof(p_sets -> i) <> 'array' or jsonb_array_length(p_sets -> i) <> 2
       or jsonb_typeof(p_sets -> i -> 0) <> 'number' or jsonb_typeof(p_sets -> i -> 1) <> 'number'
       or (p_sets -> i ->> 0) !~ '^[0-9]{1,2}$' or (p_sets -> i ->> 1) !~ '^[0-9]{1,2}$' then
      raise exception 'El set % no tiene un marcador válido', i + 1 using errcode = '22023';
    end if;
  end loop;

  v_base := case when p_format = 'one' then 1 else 2 end;
  v_target := v_base;
  for i in 1 .. v_base loop
    if i > v_n then
      raise exception 'Falta el set %', i using errcode = '22023';
    end if;
    v_a := (p_sets -> (i - 1) ->> 0)::int;
    v_b := (p_sets -> (i - 1) ->> 1)::int;
    if not private.is_valid_set(v_a, v_b) then
      raise exception 'El set % (%-%) no es válido', i, v_a, v_b using errcode = '22023';
    end if;
    if v_a > v_b then v_wa := v_wa + 1; else v_wb := v_wb + 1; end if;
  end loop;

  v_expected := v_base + case when p_format <> 'one' and v_wa = 1 and v_wb = 1 then 1 else 0 end;
  if v_n <> v_expected then
    raise exception 'Cantidad de sets inválida: se esperaban % y llegaron %', v_expected, v_n
      using errcode = '22023';
  end if;
  if v_expected = 3 then
    v_a := (p_sets -> 2 ->> 0)::int;
    v_b := (p_sets -> 2 ->> 1)::int;
    v_ok := case when p_format = 'st' then private.is_valid_super(v_a, v_b)
                 else private.is_valid_set(v_a, v_b) end;
    if not v_ok then
      raise exception '% (%-%) no es válido',
        case when p_format = 'st' then 'El súper tie-break' else 'El set 3' end, v_a, v_b
        using errcode = '22023';
    end if;
    if v_a > v_b then v_wa := v_wa + 1; else v_wb := v_wb + 1; end if;
  end if;

  return case when v_wa >= v_target then 'A' else 'B' end;
end;
$$;

-- ---------- Integridad de partidos (respaldo de las RPC) ----------
-- Se evalúa al cerrar la transacción: 4 jugadores distintos de ESE grupo, 2 por pareja,
-- sets contiguos y resultado válido. Protege aunque alguien escriba sin pasar por las RPC.

create function private.check_match_integrity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_row jsonb := coalesce(to_jsonb(new), to_jsonb(old));
  v_id uuid := (case when tg_table_name = 'matches' then v_row ->> 'id' else v_row ->> 'match_id' end)::uuid;
  v_format text;
  v_group uuid;
  v_sets jsonb;
  v_idx int[];
begin
  select format, group_id into v_format, v_group from public.matches where id = v_id;
  if not found then
    return null; -- el partido se borró (en cascada)
  end if;

  if (select count(*) from public.match_players where match_id = v_id) <> 4
     or (select count(*) from public.match_players where match_id = v_id and team = 'A') <> 2
     or (select count(*) from public.match_players where match_id = v_id and team = 'B') <> 2 then
    raise exception 'Un partido necesita 4 jugadores distintos, 2 por pareja' using errcode = '23514';
  end if;
  if exists (
    select 1 from public.match_players mp
    where mp.match_id = v_id
      and not exists (
        select 1 from public.group_members gm
        where gm.group_id = v_group and gm.player_id = mp.player_id
      )
  ) then
    raise exception 'Todos los jugadores tienen que ser del grupo del partido' using errcode = '23514';
  end if;

  select jsonb_agg(jsonb_build_array(games_a, games_b) order by set_index),
         array_agg(set_index::int order by set_index)
    into v_sets, v_idx
    from public.match_sets where match_id = v_id;
  if v_sets is null or v_idx <> (select array_agg(g) from generate_series(1, jsonb_array_length(v_sets)) g) then
    raise exception 'Los sets del partido tienen que ser contiguos desde el 1' using errcode = '23514';
  end if;
  perform private.match_result(v_format, v_sets);
  return null;
end;
$$;

create constraint trigger matches_integrity after insert or update on public.matches
  deferrable initially deferred for each row execute function private.check_match_integrity();
create constraint trigger match_players_integrity after insert or update or delete on public.match_players
  deferrable initially deferred for each row execute function private.check_match_integrity();
create constraint trigger match_sets_integrity after insert or update or delete on public.match_sets
  deferrable initially deferred for each row execute function private.check_match_integrity();

-- Un invitado no puede ser admin (no tiene cuenta con la que administrar).
create function private.check_admin_has_account() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'admin' and not exists (
    select 1 from public.players where id = new.player_id and profile_id is not null
  ) then
    raise exception 'Solo un usuario con cuenta puede ser admin' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger group_members_admin_needs_account before insert or update on public.group_members
  for each row execute function private.check_admin_has_account();
