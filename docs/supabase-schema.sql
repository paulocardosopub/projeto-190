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

create table if not exists public.app_player_shops (
  shop_id text primary key,
  account_id uuid not null references public.app_accounts(id) on delete cascade,
  owner_player_id text not null,
  shop_data jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_player_shop_payouts (
  account_id uuid primary key references public.app_accounts(id) on delete cascade,
  amount integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.app_accounts enable row level security;
alter table public.app_sessions enable row level security;
alter table public.app_saves enable row level security;
alter table public.app_player_shops enable row level security;
alter table public.app_player_shop_payouts enable row level security;

revoke all on public.app_accounts from anon, authenticated;
revoke all on public.app_sessions from anon, authenticated;
revoke all on public.app_saves from anon, authenticated;
revoke all on public.app_player_shops from anon, authenticated;
revoke all on public.app_player_shop_payouts from anon, authenticated;

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

create or replace function public.app_shop_has_stock(p_shop jsonb)
returns boolean
language sql
immutable
as $$
  select exists (
    select 1
      from jsonb_array_elements(coalesce(p_shop->'listings', '[]'::jsonb)) as elem(value)
      where coalesce((elem.value->>'quantity')::integer, 0) > 0
        and coalesce((elem.value->>'pricePerUnit')::integer, 0) > 0
  );
$$;

create or replace function public.app_player_shop_public_json(p_shop public.app_player_shops)
returns jsonb
language sql
stable
as $$
  select p_shop.shop_data || jsonb_build_object(
    'ownerPlayerId', p_shop.owner_player_id,
    'active', p_shop.active,
    'updatedAt', floor(extract(epoch from p_shop.updated_at) * 1000),
    'remoteOnline', false,
    'remoteLastSeen', floor(extract(epoch from p_shop.updated_at) * 1000)
  );
$$;

create or replace function public.app_merge_player_shop_snapshot(p_existing jsonb, p_incoming jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  v_listing jsonb;
  v_existing_listing jsonb;
  v_listings jsonb := '[]'::jsonb;
  v_quantity integer;
  v_original integer;
  v_reserved_stock integer;
  v_reserved_inventory integer;
begin
  for v_listing in
    select elem.value from jsonb_array_elements(coalesce(p_incoming->'listings', '[]'::jsonb)) as elem(value)
  loop
    v_existing_listing := null;
    select elem.value into v_existing_listing
      from jsonb_array_elements(coalesce(p_existing->'listings', '[]'::jsonb)) as elem(value)
      where elem.value->>'drugType' = v_listing->>'drugType'
      limit 1;

    if v_existing_listing is not null then
      v_quantity := least(
        greatest(0, coalesce((v_listing->>'quantity')::integer, 0)),
        greatest(0, coalesce((v_existing_listing->>'quantity')::integer, 0))
      );
      v_original := greatest(
        v_quantity,
        greatest(0, coalesce((v_listing->>'originalQuantity')::integer, 0)),
        greatest(0, coalesce((v_existing_listing->>'originalQuantity')::integer, 0))
      );
      v_reserved_stock := least(
        v_quantity,
        greatest(0, least(
          coalesce((v_listing->>'reservedStock')::integer, v_quantity),
          coalesce((v_existing_listing->>'reservedStock')::integer, v_quantity)
        ))
      );
      v_reserved_inventory := least(
        greatest(0, v_quantity - v_reserved_stock),
        greatest(0, least(
          coalesce((v_listing->>'reservedInventory')::integer, 0),
          coalesce((v_existing_listing->>'reservedInventory')::integer, 0)
        ))
      );

      v_listing := v_listing || jsonb_build_object(
        'quantity', v_quantity,
        'originalQuantity', v_original,
        'soldQuantity', greatest(
          greatest(0, coalesce((v_listing->>'soldQuantity')::integer, 0)),
          greatest(0, coalesce((v_existing_listing->>'soldQuantity')::integer, 0)),
          greatest(0, v_original - v_quantity)
        ),
        'reservedStock', v_reserved_stock,
        'reservedInventory', v_reserved_inventory
      );
    end if;

    v_listings := v_listings || jsonb_build_array(v_listing);
  end loop;

  return jsonb_set(p_incoming, '{listings}', v_listings, true)
    || jsonb_build_object(
      'grossSales', greatest(
        greatest(0, coalesce((p_incoming->>'grossSales')::integer, 0)),
        greatest(0, coalesce((p_existing->>'grossSales')::integer, 0))
      ),
      'sellerRevenue', greatest(
        greatest(0, coalesce((p_incoming->>'sellerRevenue')::integer, 0)),
        greatest(0, coalesce((p_existing->>'sellerRevenue')::integer, 0))
      ),
      'salesCount', greatest(
        greatest(0, coalesce((p_incoming->>'salesCount')::integer, 0)),
        greatest(0, coalesce((p_existing->>'salesCount')::integer, 0))
      )
    );
end;
$$;

create or replace function public.app_upsert_player_shop(p_session_token text, p_shop jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_account_id uuid;
  v_shop_id text;
  v_shop jsonb;
  v_active boolean;
  v_row public.app_player_shops;
  v_existing public.app_player_shops;
  v_now_ms numeric := floor(extract(epoch from clock_timestamp()) * 1000);
begin
  select account_id into v_account_id
    from public.app_sessions
    where session_token = p_session_token
    limit 1;

  if v_account_id is null then
    return jsonb_build_object('ok', false, 'code', 'other_device', 'reason', 'Conta acessada em outro dispositivo.');
  end if;

  if p_shop is null or not public.app_shop_has_stock(p_shop) then
    update public.app_player_shops
      set active = false,
          shop_data = shop_data || jsonb_build_object('active', false, 'updatedAt', v_now_ms),
          updated_at = clock_timestamp()
      where account_id = v_account_id
        and active;
    return jsonb_build_object('ok', true);
  end if;

  v_shop_id := nullif(p_shop->>'shopId', '');
  if v_shop_id is null then
    return jsonb_build_object('ok', false, 'reason', 'Loja invalida.');
  end if;

  v_active := public.app_shop_has_stock(p_shop);
  v_shop := p_shop || jsonb_build_object(
    'shopId', v_shop_id,
    'ownerPlayerId', v_account_id::text,
    'active', v_active,
    'updatedAt', v_now_ms
  );

  select * into v_existing
    from public.app_player_shops
    where shop_id = v_shop_id
      and account_id = v_account_id;

  if v_existing.shop_id is not null then
    v_shop := public.app_merge_player_shop_snapshot(v_existing.shop_data, v_shop)
      || jsonb_build_object('updatedAt', v_now_ms);
    v_active := v_existing.active and public.app_shop_has_stock(v_shop);
    v_shop := v_shop || jsonb_build_object('active', v_active);
  end if;

  insert into public.app_player_shops (shop_id, account_id, owner_player_id, shop_data, active, updated_at)
  values (v_shop_id, v_account_id, v_account_id::text, v_shop, v_active, clock_timestamp())
  on conflict (shop_id) do update
    set shop_data = excluded.shop_data,
        active = excluded.active,
        updated_at = clock_timestamp()
    where public.app_player_shops.account_id = v_account_id
  returning * into v_row;

  if v_row.shop_id is null then
    return jsonb_build_object('ok', false, 'reason', 'Loja pertence a outro jogador.');
  end if;

  return jsonb_build_object('ok', true, 'shop', public.app_player_shop_public_json(v_row));
end;
$$;

create or replace function public.app_list_player_shops()
returns jsonb
language sql
security definer
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'ok', true,
    'shops', coalesce(jsonb_agg(public.app_player_shop_public_json(s) order by s.updated_at desc), '[]'::jsonb)
  )
  from public.app_player_shops s
  where s.active
    and public.app_shop_has_stock(s.shop_data);
$$;

create or replace function public.app_buy_player_shop(p_session_token text, p_shop_id text, p_drug_type text, p_quantity integer)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_buyer_account_id uuid;
  v_row public.app_player_shops;
  v_listing jsonb;
  v_listings jsonb := '[]'::jsonb;
  v_found boolean := false;
  v_amount integer := greatest(1, coalesce(p_quantity, 1));
  v_quantity integer;
  v_price integer;
  v_total integer;
  v_seller_gets integer;
  v_reserved_stock integer;
  v_reserved_inventory integer;
  v_stock_take integer;
  v_remaining_take integer;
  v_shop jsonb;
  v_active boolean;
  v_now_ms numeric := floor(extract(epoch from clock_timestamp()) * 1000);
begin
  select account_id into v_buyer_account_id
    from public.app_sessions
    where session_token = p_session_token
    limit 1;

  if v_buyer_account_id is null then
    return jsonb_build_object('ok', false, 'code', 'other_device', 'reason', 'Conta acessada em outro dispositivo.');
  end if;

  select * into v_row
    from public.app_player_shops
    where shop_id = p_shop_id
      and active
    for update;

  if v_row.shop_id is null or not public.app_shop_has_stock(v_row.shop_data) then
    return jsonb_build_object('ok', false, 'reason', 'Loja indisponivel.');
  end if;

  if v_row.account_id = v_buyer_account_id then
    return jsonb_build_object('ok', false, 'reason', 'Tu nao pode comprar da tua propria loja.');
  end if;

  for v_listing in
    select elem.value from jsonb_array_elements(coalesce(v_row.shop_data->'listings', '[]'::jsonb)) as elem(value)
  loop
    if v_listing->>'drugType' = p_drug_type and not v_found then
      v_found := true;
      v_quantity := coalesce((v_listing->>'quantity')::integer, 0);
      v_price := coalesce((v_listing->>'pricePerUnit')::integer, 0);
      if v_quantity < v_amount or v_price <= 0 then
        return jsonb_build_object('ok', false, 'reason', 'Estoque indisponivel.');
      end if;

      v_total := v_price * v_amount;
      v_seller_gets := floor(v_total * 0.95)::integer;
      v_reserved_stock := greatest(0, coalesce((v_listing->>'reservedStock')::integer, v_quantity));
      v_reserved_inventory := greatest(0, coalesce((v_listing->>'reservedInventory')::integer, 0));
      v_stock_take := least(v_reserved_stock, v_amount);
      v_remaining_take := v_amount - v_stock_take;
      v_reserved_stock := greatest(0, v_reserved_stock - v_stock_take);
      v_reserved_inventory := greatest(0, v_reserved_inventory - least(v_reserved_inventory, v_remaining_take));

      v_listing := v_listing || jsonb_build_object(
        'quantity', v_quantity - v_amount,
        'soldQuantity', greatest(0, coalesce((v_listing->>'soldQuantity')::integer, 0)) + v_amount,
        'reservedStock', v_reserved_stock,
        'reservedInventory', v_reserved_inventory
      );
    end if;

    v_listings := v_listings || jsonb_build_array(v_listing);
  end loop;

  if not v_found then
    return jsonb_build_object('ok', false, 'reason', 'Produto indisponivel.');
  end if;

  v_shop := jsonb_set(v_row.shop_data, '{listings}', v_listings, true)
    || jsonb_build_object(
      'grossSales', greatest(0, coalesce((v_row.shop_data->>'grossSales')::integer, 0)) + v_total,
      'sellerRevenue', greatest(0, coalesce((v_row.shop_data->>'sellerRevenue')::integer, 0)) + v_seller_gets,
      'salesCount', greatest(0, coalesce((v_row.shop_data->>'salesCount')::integer, 0)) + v_amount,
      'updatedAt', v_now_ms
    );
  v_active := public.app_shop_has_stock(v_shop);
  v_shop := v_shop || jsonb_build_object('active', v_active);

  update public.app_player_shops
    set shop_data = v_shop,
        active = v_active,
        updated_at = clock_timestamp()
    where shop_id = v_row.shop_id
    returning * into v_row;

  insert into public.app_player_shop_payouts (account_id, amount, updated_at)
  values (v_row.account_id, v_seller_gets, clock_timestamp())
  on conflict (account_id) do update
    set amount = public.app_player_shop_payouts.amount + excluded.amount,
        updated_at = clock_timestamp();

  return jsonb_build_object(
    'ok', true,
    'shop', public.app_player_shop_public_json(v_row),
    'purchase', jsonb_build_object(
      'drugType', p_drug_type,
      'quantity', v_amount,
      'total', v_total,
      'sellerGets', v_seller_gets
    )
  );
end;
$$;

create or replace function public.app_claim_player_shop_payouts(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_account_id uuid;
  v_amount integer := 0;
begin
  select account_id into v_account_id
    from public.app_sessions
    where session_token = p_session_token
    limit 1;

  if v_account_id is null then
    return jsonb_build_object('ok', false, 'code', 'other_device', 'reason', 'Conta acessada em outro dispositivo.');
  end if;

  select amount into v_amount
    from public.app_player_shop_payouts
    where account_id = v_account_id
    for update;

  v_amount := greatest(0, coalesce(v_amount, 0));
  if v_amount > 0 then
    update public.app_player_shop_payouts
      set amount = 0,
          updated_at = clock_timestamp()
      where account_id = v_account_id;
  end if;

  return jsonb_build_object('ok', true, 'amount', v_amount);
end;
$$;

grant execute on function public.app_create_account(text, text) to anon, authenticated;
grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_get_profile(text) to anon, authenticated;
grant execute on function public.app_update_profile(text, jsonb) to anon, authenticated;
grant execute on function public.app_load_game(text) to anon, authenticated;
grant execute on function public.app_save_game(text, jsonb) to anon, authenticated;
grant execute on function public.app_upsert_player_shop(text, jsonb) to anon, authenticated;
grant execute on function public.app_list_player_shops() to anon, authenticated;
grant execute on function public.app_buy_player_shop(text, text, text, integer) to anon, authenticated;
grant execute on function public.app_claim_player_shop_payouts(text) to anon, authenticated;
