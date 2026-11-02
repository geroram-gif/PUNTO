-- PUNTO. Funciones (Fase 3): helpers de permisos, alta de perfil y RPC de escritura.
--
-- Convenciones: toda función SECURITY DEFINER fija `search_path = ''` y califica los nombres.
-- Errores: 22023 dato inválido · 42501 sin permiso · P0002 no existe (o no lo podés ver).

-- ---------- Helpers de permisos (SECURITY DEFINER para no caer en recursión de RLS) ----------

create function public.my_player_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.players where profile_id = auth.uid()
$$;

create function public.is_group_member(p_group uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members gm
    join public.players p on p.id = gm.player_id
    where gm.group_id = p_group and p.profile_id = auth.uid()
  )
$$;

create function public.is_group_admin(p_group uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members gm
    join public.players p on p.id = gm.player_id
    where gm.group_id = p_group and gm.role = 'admin' and p.profile_id = auth.uid()
  )
$$;

create function public.shares_group_with(p_player uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members mine
    join public.players me on me.id = mine.player_id and me.profile_id = auth.uid()
    join public.group_members other on other.group_id = mine.group_id
    where other.player_id = p_player
  )
$$;

create function public.match_group_id(p_match uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select group_id from public.matches where id = p_match and public.is_group_member(group_id)
$$;

-- ---------- Utilidades ----------

-- Iniciales: primera letra de la primera y de la última palabra («Juan Ignacio Vega» → JV).
-- Con una sola palabra y p_words = false, sus dos primeras letras (invitados: «Pipo» → PI).
create function private.initials_of(p_name text, p_words boolean default true) returns text
language sql immutable set search_path = '' as $$
  select upper(case
    when p_words and array_length(regexp_split_to_array(btrim(p_name), '\s+'), 1) >= 2 then
      left((regexp_split_to_array(btrim(p_name), '\s+'))[1], 1)
      || left((regexp_split_to_array(btrim(p_name), '\s+'))[array_length(regexp_split_to_array(btrim(p_name), '\s+'), 1)], 1)
    else left(btrim(p_name), 2)
  end)
$$;

create function private.require_user() returns uuid
language plpgsql stable set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Necesitás iniciar sesión' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

-- ---------- Alta de usuario: perfil + jugador propio ----------

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  -- Nombre genérico hasta que la persona completa su perfil (no se filtra el mail a los demás).
  v_name text := 'Jugador';
begin
  insert into public.profiles (id) values (new.id);
  insert into public.players (profile_id, display_name, full_name, initials, avatar_color, created_by)
  values (new.id, v_name, v_name, private.initials_of(v_name, false), '#FF7855', new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------- Perfil ----------

create function public.update_profile(p_display_name text, p_full_name text, p_avatar_color text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_user();
  v_display text := btrim(coalesce(p_display_name, ''));
  v_full text := btrim(coalesce(p_full_name, ''));
begin
  if char_length(v_display) not between 1 and 24 then
    raise exception 'El nombre corto tiene que tener entre 1 y 24 letras' using errcode = '22023';
  end if;
  if char_length(v_full) not between 1 and 60 then
    raise exception 'El nombre completo tiene que tener entre 1 y 60 letras' using errcode = '22023';
  end if;
  if coalesce(upper(p_avatar_color), '') not in ('#FF7855', '#DCEB82', '#B9A6F2', '#F3EBDD', '#394457') then
    raise exception 'Color de avatar inválido' using errcode = '22023';
  end if;
  update public.players
     set display_name = v_display, full_name = v_full,
         initials = private.initials_of(v_full), avatar_color = upper(p_avatar_color)
   where profile_id = v_uid;
  update public.profiles set onboarding_completed_at = coalesce(onboarding_completed_at, now())
   where id = v_uid;
  return jsonb_build_object('ok', true);
end;
$$;

-- Pide la baja de la cuenta. La baja efectiva la procesa el equipo (service role) con
-- private.process_account_deletion; mientras tanto la cuenta sigue activa.
create function public.request_account_deletion() returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_user();
  v_at timestamptz;
begin
  update public.profiles set deletion_requested_at = coalesce(deletion_requested_at, now())
   where id = v_uid returning deletion_requested_at into v_at;
  return v_at;
end;
$$;

-- Solo service_role: anonimiza al jugador (sus partidos quedan para los demás) y borra la cuenta.
create function public.process_account_deletion(p_profile_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_group uuid;
begin
  if not exists (select 1 from public.profiles where id = p_profile_id and deletion_requested_at is not null) then
    raise exception 'La cuenta no pidió su baja' using errcode = '22023';
  end if;
  -- Si era admin, el grupo no puede quedarse sin nadie que lo administre: pasa al miembro con
  -- cuenta más antiguo. Si no queda nadie con cuenta, el grupo queda solo de lectura.
  for v_group in
    select gm.group_id from public.group_members gm
      join public.players p on p.id = gm.player_id
     where p.profile_id = p_profile_id and gm.role = 'admin'
  loop
    update public.group_members gm set role = 'member'
      from public.players p
     where gm.group_id = v_group and gm.player_id = p.id and p.profile_id = p_profile_id;
    if not exists (select 1 from public.group_members where group_id = v_group and role = 'admin') then
      update public.group_members set role = 'admin'
       where group_id = v_group
         and player_id = (
           select gm.player_id from public.group_members gm
             join public.players p on p.id = gm.player_id
            where gm.group_id = v_group and p.profile_id is not null and p.profile_id <> p_profile_id
            order by gm.joined_at, gm.player_id limit 1);
    end if;
  end loop;
  update public.players
     set profile_id = null, display_name = 'Ex jugador', full_name = 'Ex jugador',
         initials = 'EX', avatar_color = 'transparent'
   where profile_id = p_profile_id;
  delete from auth.users where id = p_profile_id; -- borra el perfil en cascada
end;
$$;

-- ---------- Grupos e invitaciones ----------

create function public.create_group(p_name text, p_color text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_user();
  v_name text := btrim(coalesce(p_name, ''));
  v_group uuid;
  v_player uuid := public.my_player_id();
begin
  if char_length(v_name) not between 1 and 40 then
    raise exception 'El nombre del grupo tiene que tener entre 1 y 40 letras' using errcode = '22023';
  end if;
  if coalesce(upper(p_color), '') not in ('#DCEB82', '#B9A6F2', '#F3EBDD', '#FF7855') then
    raise exception 'Color de grupo inválido' using errcode = '22023';
  end if;
  if (select count(*) from public.groups where created_by = v_uid) >= 10 then
    raise exception 'Llegaste al máximo de 10 grupos creados' using errcode = '22023';
  end if;
  insert into public.groups (name, initials, color, created_by)
  values (v_name, private.initials_of(v_name), upper(p_color), v_uid) returning id into v_group;
  insert into public.group_members (group_id, player_id, role) values (v_group, v_player, 'admin');
  return v_group;
end;
$$;

create function private.normalize_code(p_code text) returns text
language sql immutable set search_path = '' as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

-- Link de invitación vigente del grupo (lo crea si no hay). Cualquier miembro puede compartirlo.
create function public.get_group_invite(p_group_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
begin
  perform private.require_user();
  if not public.is_group_member(p_group_id) then
    raise exception 'Grupo no encontrado' using errcode = 'P0002';
  end if;
  select code into v_code from public.group_invites where group_id = p_group_id and revoked_at is null;
  if v_code is null then
    insert into public.group_invites (group_id, code, created_by)
    values (p_group_id, upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)), auth.uid())
    on conflict do nothing; -- otra llamada simultánea ya lo creó
    select code into v_code from public.group_invites where group_id = p_group_id and revoked_at is null;
  end if;
  return v_code;
end;
$$;

-- Admin: revoca el link actual y crea otro.
create function public.rotate_group_invite(p_group_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_user();
  if not public.is_group_member(p_group_id) then
    raise exception 'Grupo no encontrado' using errcode = 'P0002';
  end if;
  if not public.is_group_admin(p_group_id) then
    raise exception 'Solo un admin puede renovar el link' using errcode = '42501';
  end if;
  update public.group_invites set revoked_at = now() where group_id = p_group_id and revoked_at is null;
  return public.get_group_invite(p_group_id);
end;
$$;

-- Qué grupo es (nombre y miembros) antes de pedir entrar. No expone nada más.
create function public.preview_invite(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_user();
  v_group public.groups;
begin
  select g.* into v_group from public.group_invites i join public.groups g on g.id = i.group_id
   where i.code = private.normalize_code(p_code) and i.revoked_at is null;
  if not found then
    raise exception 'Ese link no es válido o ya no está vigente' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'groupName', v_group.name, 'initials', v_group.initials, 'color', v_group.color,
    'members', (select count(*) from public.group_members where group_id = v_group.id),
    'alreadyMember', public.is_group_member(v_group.id),
    'pending', exists (select 1 from public.join_requests
                        where group_id = v_group.id and requester_id = v_uid and status = 'pending'));
end;
$$;

create function public.request_join(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_user();
  v_group uuid;
begin
  select i.group_id into v_group from public.group_invites i
   where i.code = private.normalize_code(p_code) and i.revoked_at is null;
  if not found then
    raise exception 'Ese link no es válido o ya no está vigente' using errcode = 'P0002';
  end if;
  if public.is_group_member(v_group) then
    return jsonb_build_object('status', 'member', 'groupId', v_group);
  end if;
  -- Límites de abuso: pedidos pendientes por grupo y por persona, y espera tras un rechazo.
  if exists (select 1 from public.join_requests
              where group_id = v_group and requester_id = v_uid and status = 'rejected'
                and decided_at > now() - interval '7 days') then
    raise exception 'Un admin rechazó tu pedido hace poco. Probá de nuevo en unos días.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.join_requests
                  where group_id = v_group and requester_id = v_uid and status = 'pending') then
    if (select count(*) from public.join_requests where group_id = v_group and status = 'pending') >= 25 then
      raise exception 'Este grupo ya tiene muchos pedidos pendientes. Avisale a un admin.' using errcode = '22023';
    end if;
    if (select count(*) from public.join_requests where requester_id = v_uid and status = 'pending') >= 5 then
      raise exception 'Ya tenés 5 pedidos pendientes. Esperá a que los resuelvan.' using errcode = '22023';
    end if;
  end if;
  insert into public.join_requests (group_id, requester_id) values (v_group, v_uid)
  on conflict (group_id, requester_id) where status = 'pending' do nothing;
  return jsonb_build_object('status', 'pending', 'groupId', v_group);
end;
$$;

-- Pedidos de ingreso de los grupos que administro (con el nombre de quien pide).
create function public.pending_join_requests()
returns table (id uuid, group_id uuid, requester_name text, requester_initials text,
               requester_color text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.id, r.group_id, p.display_name, p.initials, p.avatar_color, r.created_at
    from public.join_requests r
    join public.players p on p.profile_id = r.requester_id
   where r.status = 'pending' and public.is_group_admin(r.group_id)
   order by r.created_at
$$;

create function public.decide_join_request(p_request_id uuid, p_approve boolean) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_user();
  v_req public.join_requests;
begin
  select * into v_req from public.join_requests where id = p_request_id for update;
  if not found or not public.is_group_member(v_req.group_id) then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;
  if not public.is_group_admin(v_req.group_id) then
    raise exception 'Solo un admin puede aprobar ingresos' using errcode = '42501';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'Ese pedido ya se resolvió' using errcode = '22023';
  end if;
  perform 1 from public.groups where id = v_req.group_id for update; -- serializa el tope de integrantes
  if p_approve then
    if (select count(*) from public.group_members where group_id = v_req.group_id) >= 40 then
      raise exception 'El grupo llegó al máximo de 40 integrantes' using errcode = '22023';
    end if;
    insert into public.group_members (group_id, player_id)
    select v_req.group_id, p.id from public.players p where p.profile_id = v_req.requester_id
    on conflict do nothing;
  end if;
  update public.join_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         decided_by = v_uid, decided_at = now()
   where id = p_request_id;
  return case when p_approve then 'approved' else 'rejected' end;
end;
$$;

-- Invitado: juega en el grupo sin cuenta. Nada lo une a un usuario por el nombre.
create function public.add_guest(p_group_id uuid, p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_user();
  v_name text := btrim(coalesce(p_name, ''));
  v_player uuid;
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'Grupo no encontrado' using errcode = 'P0002';
  end if;
  if char_length(v_name) not between 1 and 20 then
    raise exception 'El nombre del invitado tiene que tener entre 1 y 20 letras' using errcode = '22023';
  end if;
  perform 1 from public.groups where id = p_group_id for update; -- serializa nombre repetido y tope
  if exists (
    select 1 from public.group_members gm join public.players p on p.id = gm.player_id
     where gm.group_id = p_group_id and lower(p.display_name) = lower(v_name)
  ) then
    raise exception 'Ya hay alguien con ese nombre en el grupo' using errcode = '22023';
  end if;
  if (select count(*) from public.group_members where group_id = p_group_id) >= 40 then
    raise exception 'El grupo llegó al máximo de 40 integrantes' using errcode = '22023';
  end if;
  insert into public.players (display_name, full_name, initials, avatar_color, created_by)
  values (v_name, v_name, private.initials_of(v_name, false), 'transparent', v_uid)
  returning id into v_player;
  insert into public.group_members (group_id, player_id) values (p_group_id, v_player);
  return v_player;
end;
$$;

-- ---------- Partidos ----------

create function private.validate_match_input(
  p_group uuid, p_played_on date, p_format text, p_team_a uuid[], p_team_b uuid[], p_sets jsonb
) returns void language plpgsql stable set search_path = '' as $$
declare
  v_all uuid[];
begin
  if p_played_on is null or p_played_on > (now() at time zone 'utc')::date + 1 then
    raise exception 'La fecha del partido no puede ser futura' using errcode = '22023';
  end if;
  if p_team_a is null or p_team_b is null
     or coalesce(array_length(p_team_a, 1), 0) <> 2 or coalesce(array_length(p_team_b, 1), 0) <> 2 then
    raise exception 'Cada pareja tiene que tener 2 jugadores' using errcode = '22023';
  end if;
  v_all := p_team_a || p_team_b;
  if array_position(v_all, null) is not null
     or (select count(distinct x) from unnest(v_all) x) <> 4 then
    raise exception 'Los 4 jugadores tienen que ser distintos' using errcode = '22023';
  end if;
  if (select count(*) from public.group_members where group_id = p_group and player_id = any (v_all)) <> 4 then
    raise exception 'Todos los jugadores tienen que ser del grupo' using errcode = '22023';
  end if;
  perform private.match_result(p_format, p_sets);
end;
$$;

create function private.write_match_children(
  p_match uuid, p_team_a uuid[], p_team_b uuid[], p_sets jsonb
) returns void language plpgsql set search_path = '' as $$
begin
  insert into public.match_players (match_id, player_id, team, slot)
  select p_match, p_team_a[i], 'A', i from generate_series(1, 2) i
  union all
  select p_match, p_team_b[i], 'B', i from generate_series(1, 2) i;
  insert into public.match_sets (match_id, set_index, games_a, games_b)
  select p_match, ord::smallint, (s ->> 0)::smallint, (s ->> 1)::smallint
    from jsonb_array_elements(p_sets) with ordinality as t (s, ord);
end;
$$;

-- Todo en una transacción: o queda el partido completo o no queda nada.
create function public.record_match(
  p_group_id uuid, p_played_on date, p_format text, p_team_a uuid[], p_team_b uuid[], p_sets jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := private.require_user();
  v_id uuid;
  v_seq bigint;
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'Grupo no encontrado' using errcode = 'P0002';
  end if;
  perform private.validate_match_input(p_group_id, p_played_on, p_format, p_team_a, p_team_b, p_sets);
  insert into public.matches (group_id, played_on, format, created_by)
  values (p_group_id, p_played_on, p_format, v_uid) returning id, seq into v_id, v_seq;
  perform private.write_match_children(v_id, p_team_a, p_team_b, p_sets);
  return jsonb_build_object('id', v_id, 'seq', v_seq);
end;
$$;

-- Corrige o borra: el admin del grupo o quien cargó el partido. Quien no es del grupo ve
-- «no encontrado» (no se revela que el partido existe).
create function private.assert_can_edit_match(p_match uuid) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  v_group uuid;
  v_creator uuid;
begin
  perform private.require_user();
  select group_id, created_by into v_group, v_creator from public.matches where id = p_match;
  if not found or not public.is_group_member(v_group) then
    raise exception 'Partido no encontrado' using errcode = 'P0002';
  end if;
  -- coalesce: sin autor (su cuenta se dio de baja) `v_creator = uid` es NULL y NO debe habilitar a nadie.
  if not (coalesce(public.is_group_admin(v_group), false) or coalesce(v_creator = auth.uid(), false)) then
    raise exception 'Solo quien lo cargó o un admin del grupo puede modificarlo' using errcode = '42501';
  end if;
  return v_group;
end;
$$;

create function public.update_match(
  p_match_id uuid, p_played_on date, p_format text, p_team_a uuid[], p_team_b uuid[], p_sets jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_group uuid := private.assert_can_edit_match(p_match_id);
begin
  perform private.validate_match_input(v_group, p_played_on, p_format, p_team_a, p_team_b, p_sets);
  update public.matches set played_on = p_played_on, format = p_format, edited_at = now()
   where id = p_match_id;
  delete from public.match_players where match_id = p_match_id;
  delete from public.match_sets where match_id = p_match_id;
  perform private.write_match_children(p_match_id, p_team_a, p_team_b, p_sets);
  return jsonb_build_object('id', p_match_id);
end;
$$;

create function public.delete_match(p_match_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_can_edit_match(p_match_id);
  delete from public.matches where id = p_match_id;
end;
$$;

-- ---------- Lectura: todo lo que ve el usuario, con el mismo formato que el motor ----------
-- SECURITY INVOKER: la lectura pasa por RLS, o sea que solo devuelve lo de mis grupos.

create function public.app_snapshot() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Necesitás iniciar sesión' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'me', public.my_player_id(),
    'onboarded', coalesce((select onboarding_completed_at is not null from public.profiles where id = v_uid), false),
    'deletionRequested', coalesce((select deletion_requested_at is not null from public.profiles where id = v_uid), false),
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.display_name, 'fullName', p.full_name, 'initials', p.initials,
        'avatarColor', p.avatar_color, 'isGuest', p.is_guest) order by p.created_at, p.id)
        from public.players p), '[]'::jsonb),
    'groups', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'name', g.name, 'initials', g.initials, 'color', g.color,
        'adminIds', (select coalesce(jsonb_agg(gm.player_id order by gm.joined_at, gm.player_id), '[]'::jsonb)
                       from public.group_members gm where gm.group_id = g.id and gm.role = 'admin'),
        'memberIds', (select coalesce(jsonb_agg(gm.player_id order by gm.joined_at, gm.player_id), '[]'::jsonb)
                        from public.group_members gm where gm.group_id = g.id)) order by g.created_at, g.id)
        from public.groups g), '[]'::jsonb),
    'matches', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'groupId', m.group_id, 'date', m.played_on, 'seq', m.seq, 'format', m.format,
        'teamA', (select jsonb_agg(mp.player_id order by mp.slot) from public.match_players mp
                   where mp.match_id = m.id and mp.team = 'A'),
        'teamB', (select jsonb_agg(mp.player_id order by mp.slot) from public.match_players mp
                   where mp.match_id = m.id and mp.team = 'B'),
        'sets', (select jsonb_agg(jsonb_build_array(s.games_a, s.games_b) order by s.set_index)
                   from public.match_sets s where s.match_id = m.id),
        'createdBy', (select p.id from public.players p where p.profile_id = m.created_by),
        'edited', m.edited_at is not null) order by m.played_on, m.seq)
        from public.matches m), '[]'::jsonb),
    'pendingRequests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'groupId', r.group_id, 'name', r.requester_name, 'initials', r.requester_initials,
        'avatarColor', r.requester_color) order by r.created_at)
        from public.pending_join_requests() r), '[]'::jsonb)
  );
end;
$$;
