-- =============================================================================
-- Sekura — initial schema
-- Tablas + RLS + RPC verify_token + seed (3 productos, 2 lotes, 5 ítems)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tablas
-- -----------------------------------------------------------------------------

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  manufacturer text,
  category text
);

create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  manufactured_at date,
  origin_country text
);

create table if not exists items (
  token text primary key,
  prefix text not null,
  numeric_id bigint not null,
  country_code text not null,
  product_id uuid references products(id),
  batch_id uuid references batches(id),
  status text not null default 'active'
    check (status in ('active', 'revoked', 'claimed')),
  created_at timestamptz not null default now()
);

create table if not exists distributors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  country_code text,
  role text not null default 'distributor'
    check (role in ('distributor', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  token text references items(token),
  scanned_at timestamptz not null default now(),
  ip_hash text,
  country_geo text,
  user_agent text,
  user_id uuid references auth.users(id),
  result text not null
    check (result in ('authentic', 'suspicious', 'unknown', 'already_claimed'))
);

create index if not exists scans_token_scanned_at_idx
  on scans (token, scanned_at desc);

create table if not exists item_actions (
  id uuid primary key default gen_random_uuid(),
  token text references items(token),
  user_id uuid references auth.users(id),
  action text not null
    check (action in ('received', 'discrepancy', 'transferred')),
  notes text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- Estrategia: el rol service_role (usado por el API route server-side) saltea
-- RLS. anon/authenticated solo acceden vía la RPC verify_token (security
-- definer). Por eso no hay policies de SELECT en items/scans/products/batches.
-- -----------------------------------------------------------------------------

alter table products      enable row level security;
alter table batches       enable row level security;
alter table items         enable row level security;
alter table scans         enable row level security;
alter table distributors  enable row level security;
alter table item_actions  enable row level security;

-- distributors: el usuario solo ve y modifica su propia fila.
drop policy if exists distributors_self_select on distributors;
create policy distributors_self_select on distributors
  for select using (auth.uid() = user_id);

drop policy if exists distributors_self_update on distributors;
create policy distributors_self_update on distributors
  for update using (auth.uid() = user_id);

drop policy if exists distributors_self_insert on distributors;
create policy distributors_self_insert on distributors
  for insert with check (auth.uid() = user_id);

-- item_actions: solo el dueño lee y crea.
drop policy if exists item_actions_self_select on item_actions;
create policy item_actions_self_select on item_actions
  for select using (auth.uid() = user_id);

drop policy if exists item_actions_self_insert on item_actions;
create policy item_actions_self_insert on item_actions
  for insert with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- RPC: verify_token
-- Lectura pública del estado de un ítem. Devuelve uno de cuatro resultados:
-- authentic, suspicious, unknown, already_claimed. NO inserta el scan: eso lo
-- hace el API route con service_role tras chequear rate limit.
-- -----------------------------------------------------------------------------

create or replace function public.verify_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item items%rowtype;
  v_recent_scans int;
  v_result text;
begin
  select * into v_item from items where token = p_token;
  if not found then
    return jsonb_build_object('result', 'unknown');
  end if;

  -- Heurística simple: > 10 scans en 24h marca el ítem como sospechoso.
  -- Configurable subiéndolo a una settings table cuando haga falta.
  select count(*) into v_recent_scans
    from scans
   where token = p_token
     and scanned_at > now() - interval '24 hours';

  if v_recent_scans > 10 then
    v_result := 'suspicious';
  elsif v_item.status = 'claimed' then
    v_result := 'already_claimed';
  else
    v_result := 'authentic';
  end if;

  return jsonb_build_object(
    'result', v_result,
    'item', jsonb_build_object(
      'token', v_item.token,
      'country_code', v_item.country_code,
      'status', v_item.status
    ),
    'product', (select row_to_json(p) from products p where p.id = v_item.product_id),
    'batch',   (select row_to_json(b) from batches  b where b.id = v_item.batch_id)
  );
end;
$$;

grant execute on function public.verify_token(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Seed (idempotente: usa on conflict do nothing)
-- -----------------------------------------------------------------------------

insert into products (id, name, manufacturer, category) values
  ('11111111-1111-1111-1111-111111111111', 'Vinho Tinto Reserva 750ml', 'Vinícola Aurora', 'beverage'),
  ('22222222-2222-2222-2222-222222222222', 'Café Especial 250g',         'Fazenda Santa Inês', 'food'),
  ('33333333-3333-3333-3333-333333333333', 'Azeite Extra Virgem 500ml',  'Olivícola Sul', 'food')
on conflict (id) do nothing;

insert into batches (id, product_id, manufactured_at, origin_country) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '2026-01-15', 'BR'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '2026-02-20', 'BR')
on conflict (id) do nothing;

insert into items (token, prefix, numeric_id, country_code, product_id, batch_id, status) values
  -- authentic (token del spec)
  ('MT-5108402-A1B2C3D4E5F6789012345678ABCDEF01', 'MT', 5108402, 'BR',
   '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'active'),
  -- already_claimed (para probar ese estado)
  ('MT-5108403-B2C3D4E5F6789012345678ABCDEF0102', 'MT', 5108403, 'BR',
   '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'claimed'),
  -- 3 items extra active
  ('MT-5108404-C3D4E5F6789012345678ABCDEF010203', 'MT', 5108404, 'BR',
   '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'active'),
  ('MT-5108405-D4E5F6789012345678ABCDEF01020304', 'MT', 5108405, 'BR',
   '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'active'),
  ('MT-5108406-E5F6789012345678ABCDEF0102030405', 'MT', 5108406, 'BR',
   '33333333-3333-3333-3333-333333333333', null, 'active')
on conflict (token) do nothing;

-- Para probar 'unknown', escaneá cualquier token que cumpla el formato pero
-- no esté en esta tabla, ej:
--   MT-9999999-FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
