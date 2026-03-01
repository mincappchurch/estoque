-- Supabase initialization script for church inventory app
-- Decision set: UUID IDs, no RLS in this phase, with seed data

begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'volunteer', 'team_leader');
  end if;

  if not exists (select 1 from pg_type where typname = 'movement_type') then
    create type movement_type as enum ('entry', 'withdrawal');
  end if;

  if not exists (select 1 from pg_type where typname = 'service_time') then
    create type service_time as enum ('08:30', '11:00', '17:00', '19:30');
  end if;
end $$;

create or replace function public.fn_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  open_id text unique,
  name text,
  email text,
  login_method text not null default 'access_code',
  role user_role not null default 'volunteer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_signed_in timestamptz
);

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  code_hash text not null unique,
  role user_role not null,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  abbreviation text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category_id uuid not null references public.categories(id) on delete restrict,
  unit_id uuid not null references public.units(id) on delete restrict,
  current_quantity numeric(12, 2) not null default 0,
  minimum_stock numeric(12, 2) not null default 0,
  unit_cost numeric(12, 2),
  max_withdrawal_limit numeric(12, 2),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_current_quantity_non_negative check (current_quantity >= 0),
  constraint products_minimum_stock_non_negative check (minimum_stock >= 0),
  constraint products_unit_cost_non_negative check (unit_cost is null or unit_cost >= 0),
  constraint products_max_withdrawal_limit_non_negative check (max_withdrawal_limit is null or max_withdrawal_limit >= 0)
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  type movement_type not null,
  quantity numeric(12, 2) not null,
  volunteer_name text,
  team_id uuid references public.teams(id) on delete set null,
  service_time service_time,
  notes text,
  user_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint movements_quantity_positive check (quantity > 0),
  constraint movements_withdrawal_fields_required check (
    type <> 'withdrawal'
    or (
      volunteer_name is not null
      and team_id is not null
      and service_time is not null
    )
  )
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists trg_users_touch_updated_at on public.users;
create trigger trg_users_touch_updated_at
before update on public.users
for each row
execute function public.fn_touch_updated_at();

drop trigger if exists trg_access_codes_touch_updated_at on public.access_codes;
create trigger trg_access_codes_touch_updated_at
before update on public.access_codes
for each row
execute function public.fn_touch_updated_at();

drop trigger if exists trg_categories_touch_updated_at on public.categories;
create trigger trg_categories_touch_updated_at
before update on public.categories
for each row
execute function public.fn_touch_updated_at();

drop trigger if exists trg_teams_touch_updated_at on public.teams;
create trigger trg_teams_touch_updated_at
before update on public.teams
for each row
execute function public.fn_touch_updated_at();

drop trigger if exists trg_units_touch_updated_at on public.units;
create trigger trg_units_touch_updated_at
before update on public.units
for each row
execute function public.fn_touch_updated_at();

drop trigger if exists trg_products_touch_updated_at on public.products;
create trigger trg_products_touch_updated_at
before update on public.products
for each row
execute function public.fn_touch_updated_at();

create index if not exists idx_products_name on public.products(name);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_unit_id on public.products(unit_id);

create index if not exists idx_movements_created_at on public.movements(created_at desc);
create index if not exists idx_movements_product_created on public.movements(product_id, created_at desc);
create index if not exists idx_movements_team_created on public.movements(team_id, created_at desc);
create index if not exists idx_movements_type_created on public.movements(type, created_at desc);

create index if not exists idx_access_codes_active_expires on public.access_codes(is_active, expires_at);
create index if not exists idx_users_role on public.users(role);

create or replace function public.fn_record_movement(
  p_product_id uuid,
  p_type movement_type,
  p_quantity numeric,
  p_user_id uuid,
  p_volunteer_name text default null,
  p_team_id uuid default null,
  p_service_time service_time default null,
  p_notes text default null
)
returns uuid
language plpgsql
as $$
declare
  v_product products%rowtype;
  v_new_quantity numeric(12,2);
  v_movement_id uuid;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade inválida';
  end if;

  select *
    into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Produto não encontrado';
  end if;

  if p_type = 'withdrawal' then
    if p_volunteer_name is null or p_team_id is null or p_service_time is null then
      raise exception 'Retirada exige volunteer_name, team_id e service_time';
    end if;

    if v_product.max_withdrawal_limit is not null and p_quantity > v_product.max_withdrawal_limit then
      raise exception 'Limite máximo de retirada excedido';
    end if;

    if v_product.current_quantity < p_quantity then
      raise exception 'Estoque insuficiente';
    end if;

    v_new_quantity := v_product.current_quantity - p_quantity;
  else
    v_new_quantity := v_product.current_quantity + p_quantity;
  end if;

  insert into public.movements (
    product_id,
    type,
    quantity,
    volunteer_name,
    team_id,
    service_time,
    notes,
    user_id
  ) values (
    p_product_id,
    p_type,
    p_quantity,
    p_volunteer_name,
    p_team_id,
    p_service_time,
    p_notes,
    p_user_id
  )
  returning id into v_movement_id;

  update public.products
  set current_quantity = v_new_quantity
  where id = p_product_id;

  insert into public.audit_logs (actor_user_id, action, entity, entity_id, details)
  values (
    p_user_id,
    case when p_type = 'entry' then 'movement.entry' else 'movement.withdrawal' end,
    'products',
    p_product_id,
    jsonb_build_object(
      'movement_id', v_movement_id,
      'type', p_type,
      'quantity', p_quantity,
      'previous_quantity', v_product.current_quantity,
      'new_quantity', v_new_quantity
    )
  );

  return v_movement_id;
end;
$$;

create or replace function public.fn_use_access_code(
  p_plain_code text
)
returns table (
  access_code_id uuid,
  role user_role,
  label text
)
language plpgsql
as $$
declare
  v_code public.access_codes%rowtype;
begin
  if p_plain_code is null or length(trim(p_plain_code)) = 0 then
    return;
  end if;

  select *
    into v_code
  from public.access_codes
  where is_active = true
    and (expires_at is null or expires_at > now())
    and code_hash = crypt(p_plain_code, code_hash)
  limit 1;

  if not found then
    return;
  end if;

  update public.access_codes
  set last_used_at = now()
  where id = v_code.id;

  return query
  select v_code.id, v_code.role, v_code.label;
end;
$$;

create or replace view public.vw_stock_status as
select
  p.id,
  p.name,
  p.description,
  p.current_quantity,
  p.minimum_stock,
  p.unit_cost,
  p.max_withdrawal_limit,
  p.photo_url,
  p.created_at,
  p.updated_at,
  c.id as category_id,
  c.name as category_name,
  u.id as unit_id,
  u.name as unit_name,
  u.abbreviation as unit_abbreviation,
  (p.current_quantity <= p.minimum_stock) as is_low_stock
from public.products p
join public.categories c on c.id = p.category_id
join public.units u on u.id = p.unit_id;

create or replace view public.vw_dashboard_stats as
select
  (select count(*) from public.products) as total_products,
  (select count(*) from public.products where current_quantity <= minimum_stock) as low_stock_count,
  (
    select count(*)
    from public.movements
    where type = 'withdrawal'
      and created_at >= date_trunc('day', now())
  ) as today_withdrawals;

create or replace view public.vw_movements_by_service_time as
select
  date_trunc('day', m.created_at) as movement_day,
  m.service_time,
  m.type,
  count(*) as movement_count,
  coalesce(sum(m.quantity), 0)::numeric(12,2) as total_quantity
from public.movements m
where m.service_time is not null
group by 1, 2, 3
order by 1 desc, 2, 3;

create or replace view public.vw_movements_by_team_period as
select
  date_trunc('day', m.created_at) as movement_day,
  t.id as team_id,
  t.name as team_name,
  m.type,
  count(*) as movement_count,
  coalesce(sum(m.quantity), 0)::numeric(12,2) as total_quantity
from public.movements m
left join public.teams t on t.id = m.team_id
group by 1, 2, 3, 4
order by 1 desc, 3 nulls last, 4;

insert into public.categories (name, description)
values
  ('Alimentos', 'Itens de alimentação'),
  ('Limpeza', 'Produtos de limpeza'),
  ('Descartáveis', 'Copos, pratos e similares')
on conflict (name) do nothing;

insert into public.units (name, abbreviation)
values
  ('Unidade', 'un'),
  ('Quilograma', 'kg'),
  ('Litro', 'L'),
  ('Pacote', 'pct'),
  ('Caixa', 'cx')
on conflict (name) do nothing;

insert into public.teams (name, description)
values
  ('Recepção', 'Equipe de recepção e apoio de culto'),
  ('Cozinha', 'Equipe de cozinha e preparo'),
  ('Apoio', 'Equipe de apoio geral')
on conflict (name) do nothing;

insert into public.access_codes (label, code_hash, role, is_active)
values
  ('Admin inicial', crypt('ADMIN2026', gen_salt('bf')), 'admin', true),
  ('Voluntário inicial', crypt('VOLUNTARIO2026', gen_salt('bf')), 'volunteer', true),
  ('Líder inicial', crypt('LIDER2026', gen_salt('bf')), 'team_leader', true)
on conflict (label) do nothing;

commit;

-- Smoke test snippets (execute manually after script, if desired)
-- select * from public.vw_dashboard_stats;
-- select * from public.fn_use_access_code('ADMIN2026');
