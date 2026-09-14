create table if not exists public.inventory_items (
  id bigint primary key,
  item_name text not null,
  room text,
  refrigerator text,
  temperature text,
  shelf text,
  storage_date date,
  expiry_date date,
  product_code text,
  price numeric,
  currency text default 'CNY',
  capacity text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory_items enable row level security;

drop policy if exists "Public can read inventory items" on public.inventory_items;
create policy "Public can read inventory items"
on public.inventory_items for select
using (true);

drop policy if exists "Public can insert inventory items" on public.inventory_items;
create policy "Public can insert inventory items"
on public.inventory_items for insert
with check (true);

drop policy if exists "Public can update inventory items" on public.inventory_items;
create policy "Public can update inventory items"
on public.inventory_items for update
using (true)
with check (true);

drop policy if exists "Public can delete inventory items" on public.inventory_items;
create policy "Public can delete inventory items"
on public.inventory_items for delete
using (true);
