create extension if not exists pgcrypto;

create table if not exists public.app_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  username_norm text not null unique,
  password_hash text not null,
  display_name text not null default '',
  character_id text,
  faction_id text,
  last_map text not null default 'city',
  last_position_x integer not null default 120,
  last_position_y integer not null default 0,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.app_sessions (
  account_id uuid primary key references public.app_accounts(id) on delete cascade,
  session_token text not null unique,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_saves (
  account_id uuid primary key references public.app_accounts(id) on delete cascade,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_accounts enable row level security;
alter table public.app_sessions enable row level security;
alter table public.app_saves enable row level security;

revoke all on public.app_accounts from anon, authenticated;
revoke all on public.app_sessions from anon, authenticated;
revoke all on public.app_saves from anon, authenticated;

create or replace function public.app_profile_json(p_account public.app_accounts)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', p_account.id,
    'username', p_account.username,
    'isGuest', false,
    'displayName', p_account.display_name,
    'characterId', p_account.character_id,
    'factionId', p_account.faction_id,
    'lastMap', p_account.last_map,
    'lastPositionX', p_account.last_position_x,
    'lastPositionY', p_account.last_position_y,
    'createdAt', extract(epoch from p_account.created_at) * 1000,
    'lastLoginAt', extract(epoch from p_account.last_login_at) * 1000
  );
$$;

create or replace function public.app_create_account(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_username text := trim(coalesce(p_username, ''));
  v_password text := coalesce(p_password, '');
  v_account public.app_accounts;
  v_token text;
begin
  if v_username = '' then
    return jsonb_build_object('ok', false, 'reason', 'Informe um usuario.');
  end if;
  if length(v_username) < 3 or length(v_username) > 24 then
    return jsonb_build_object('ok', false, 'reason', 'O usuario precisa ter entre 3 e 24 caracteres.');
  end if;
  if v_username !~ '^[[:alnum:]_.-]+$' then
    return jsonb_build_object('ok', false, 'reason', 'Use letras, numeros, ponto, traco ou sublinhado.');
  end if;
  if length(v_password) < 4 then
    return jsonb_build_object('ok', false, 'reason', 'A senha precisa ter pelo menos 4 caracteres.');
  end if;

  insert into public.app_accounts (username, username_norm, password_hash)
  values (v_username, lower(v_username), crypt(v_password, gen_salt('bf')))
  returning * into v_account;

  v_token := 'sess-' || gen_random_uuid()::text;
  insert into public.app_sessions (account_id, session_token)
  values (v_account.id, v_token);

  return jsonb_build_object(
    'ok', true,
    'profile', public.app_profile_json(v_account),
    'sessionToken', v_token
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'Esse usuario ja existe.');
end;
$$;

create or replace function public.app_login(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_account public.app_accounts;
  v_token text;
begin
  select *
    into v_account
    from public.app_accounts
    where username_norm = lower(trim(coalesce(p_username, '')))
    limit 1;

  if v_account.id is null or v_account.password_hash <> crypt(coalesce(p_password, ''), v_account.password_hash) then
    return jsonb_build_object('ok', false, 'reason', 'Usuario ou senha invalido.');
  end if;

  update public.app_accounts
    set last_login_at = now(),
        last_seen_at = now()
    where id = v_account.id
    returning * into v_account;

  v_token := 'sess-' || gen_random_uuid()::text;
  insert into public.app_sessions (account_id, session_token, updated_at)
  values (v_account.id, v_token, now())
  on conflict (account_id) do update
    set session_token = excluded.session_token,
        updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'profile', public.app_profile_json(v_account),
    'sessionToken', v_token
  );
end;
$$;

create or replace function public.app_get_profile(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_account public.app_accounts;
begin
  select a.*
    into v_account
    from public.app_sessions s
    join public.app_accounts a on a.id = s.account_id
    where s.session_token = p_session_token
    limit 1;

  if v_account.id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'other_device',
      'reason', 'Conta acessada em outro dispositivo.'
    );
  end if;

  update public.app_accounts
    set last_seen_at = now()
    where id = v_account.id
    returning * into v_account;

  return jsonb_build_object('ok', true, 'profile', public.app_profile_json(v_account));
end;
$$;

create or replace function public.app_update_profile(p_session_token text, p_profile jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_account_id uuid;
  v_account public.app_accounts;
begin
  select account_id into v_account_id
    from public.app_sessions
    where session_token = p_session_token
    limit 1;

  if v_account_id is null then
    return jsonb_build_object('ok', false, 'code', 'other_device', 'reason', 'Conta acessada em outro dispositivo.');
  end if;

  update public.app_accounts
    set display_name = case when p_profile ? 'displayName' then left(coalesce(p_profile->>'displayName', ''), 16) else display_name end,
        character_id = case when p_profile ? 'characterId' then nullif(p_profile->>'characterId', '') else character_id end,
        faction_id = case when p_profile ? 'factionId' then nullif(p_profile->>'factionId', '') else faction_id end,
        last_map = case when p_profile ? 'lastMap' then coalesce(nullif(p_profile->>'lastMap', ''), 'city') else last_map end,
        last_position_x = case when p_profile ? 'lastPositionX' then coalesce((p_profile->>'lastPositionX')::integer, 120) else last_position_x end,
        last_position_y = case when p_profile ? 'lastPositionY' then coalesce((p_profile->>'lastPositionY')::integer, 0) else last_position_y end,
        last_seen_at = now()
    where id = v_account_id
    returning * into v_account;

  return jsonb_build_object('ok', true, 'profile', public.app_profile_json(v_account));
end;
$$;

create or replace function public.app_load_game(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_account_id uuid;
  v_save jsonb;
begin
  select account_id into v_account_id
    from public.app_sessions
    where session_token = p_session_token
    limit 1;

  if v_account_id is null then
    return jsonb_build_object('ok', false, 'code', 'other_device', 'reason', 'Conta acessada em outro dispositivo.');
  end if;

  select save_data into v_save
    from public.app_saves
    where account_id = v_account_id;

  return jsonb_build_object('ok', true, 'save', v_save);
end;
$$;

create or replace function public.app_save_game(p_session_token text, p_save_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_account_id uuid;
begin
  select account_id into v_account_id
    from public.app_sessions
    where session_token = p_session_token
    limit 1;

  if v_account_id is null then
    return jsonb_build_object('ok', false, 'code', 'other_device', 'reason', 'Conta acessada em outro dispositivo.');
  end if;

  insert into public.app_saves (account_id, save_data, updated_at)
  values (v_account_id, coalesce(p_save_data, '{}'::jsonb), now())
  on conflict (account_id) do update
    set save_data = excluded.save_data,
        updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.app_create_account(text, text) to anon, authenticated;
grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_get_profile(text) to anon, authenticated;
grant execute on function public.app_update_profile(text, jsonb) to anon, authenticated;
grant execute on function public.app_load_game(text) to anon, authenticated;
grant execute on function public.app_save_game(text, jsonb) to anon, authenticated;
