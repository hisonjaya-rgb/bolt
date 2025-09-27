-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- Utility function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Buyers (Vendors)
create table if not exists public.buyers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  contact text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.buyers enable row level security;

-- RLS policies for buyers
create policy if not exists "buyers_select_authenticated"
  on public.buyers for select
  to authenticated
  using (true);

create policy if not exists "buyers_insert_authenticated"
  on public.buyers for insert
  to authenticated
  with check (true);

create policy if not exists "buyers_update_authenticated"
  on public.buyers for update
  to authenticated
  using (true);

create policy if not exists "buyers_delete_authenticated"
  on public.buyers for delete
  to authenticated
  using (true);

-- Articles
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  buyer_id uuid not null references public.buyers(id) on delete restrict,
  style text,
  pic text,
  application1 text,
  application2 text,
  order_date date,
  delivery_date date,
  due_date date,
  notes text,
  sizes text[] not null default '{}',
  status_sample_pattern text not null default 'To Do',
  status_ppm text not null default 'To Do',
  garment_sheet_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_articles_buyer_id on public.articles(buyer_id);

alter table public.articles enable row level security;

-- RLS policies for articles
create policy if not exists "articles_select_authenticated"
  on public.articles for select
  to authenticated
  using (true);

create policy if not exists "articles_insert_authenticated"
  on public.articles for insert
  to authenticated
  with check (true);

create policy if not exists "articles_update_authenticated"
  on public.articles for update
  to authenticated
  using (true);

create policy if not exists "articles_delete_authenticated"
  on public.articles for delete
  to authenticated
  using (true);

-- Trigger for articles.updated_at
create trigger if not exists trg_articles_updated_at
before update on public.articles
for each row execute function public.update_updated_at_column();

-- Article Variations
create table if not exists public.article_variations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  color text not null,
  size text not null,
  qty_order integer not null default 0,
  cutting integer not null default 0,
  application1 integer not null default 0,
  application2 integer not null default 0,
  sewing integer not null default 0,
  finishing integer not null default 0,
  qc integer not null default 0,
  shipping integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_article_variations_article_id on public.article_variations(article_id);

alter table public.article_variations enable row level security;

-- RLS policies for article_variations
create policy if not exists "article_variations_select_authenticated"
  on public.article_variations for select
  to authenticated
  using (true);

create policy if not exists "article_variations_insert_authenticated"
  on public.article_variations for insert
  to authenticated
  with check (true);

create policy if not exists "article_variations_update_authenticated"
  on public.article_variations for update
  to authenticated
  using (true);

create policy if not exists "article_variations_delete_authenticated"
  on public.article_variations for delete
  to authenticated
  using (true);

-- Trigger for article_variations.updated_at
create trigger if not exists trg_article_variations_updated_at
before update on public.article_variations
for each row execute function public.update_updated_at_column();

-- BOMs
create table if not exists public.boms (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  category text not null,
  item_name text not null,
  size text not null,
  uom text not null,
  total numeric not null default 0,
  consump numeric not null default 0,
  needed numeric not null default 0,
  receiving numeric not null default 0,
  balance numeric not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_boms_article_id on public.boms(article_id);
create index if not exists idx_boms_category on public.boms(category);
create index if not exists idx_boms_item_name on public.boms(item_name);

alter table public.boms enable row level security;

-- RLS policies for boms
create policy if not exists "boms_select_authenticated"
  on public.boms for select
  to authenticated
  using (true);

create policy if not exists "boms_insert_authenticated"
  on public.boms for insert
  to authenticated
  with check (true);

create policy if not exists "boms_update_authenticated"
  on public.boms for update
  to authenticated
  using (true);

create policy if not exists "boms_delete_authenticated"
  on public.boms for delete
  to authenticated
  using (true);

-- Trigger for boms.updated_at
create trigger if not exists trg_boms_updated_at
before update on public.boms
for each row execute function public.update_updated_at_column();

-- Storage: bucket for garment sheets
insert into storage.buckets (id, name, public)
values ('garment-sheets', 'garment-sheets', true)
on conflict (id) do nothing;

-- Storage policies for garment-sheets
create policy if not exists "Garment sheets public read"
  on storage.objects for select
  using (bucket_id = 'garment-sheets');

create policy if not exists "Garment sheets authenticated insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'garment-sheets');

create policy if not exists "Garment sheets authenticated update"
  on storage.objects for update to authenticated
  using (bucket_id = 'garment-sheets');

create policy if not exists "Garment sheets authenticated delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'garment-sheets');