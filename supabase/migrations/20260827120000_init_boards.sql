create extension if not exists pgcrypto;

create type public.item_type as enum (
  'text',
  'sticky',
  'url',
  'image',
  'video',
  'audio',
  'drawing'
);

create type public.item_action as enum ('insert', 'update', 'delete');

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  board_date date not null unique,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  type public.item_type not null,
  x double precision not null,
  y double precision not null,
  width double precision not null,
  height double precision not null,
  z_index integer not null default 1,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_board_id_idx on public.items (board_id);
create index items_board_z_idx on public.items (board_id, z_index);

create table public.item_events (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  item_id uuid not null,
  action public.item_action not null,
  actor_name text not null,
  snapshot jsonb,
  created_at timestamptz not null default now()
);

create index item_events_board_created_idx on public.item_events (board_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
before update on public.items
for each row
execute function public.set_updated_at();

alter table public.boards enable row level security;
alter table public.items enable row level security;
alter table public.item_events enable row level security;

create policy "public read boards" on public.boards for select using (true);
create policy "public read items" on public.items for select using (true);
create policy "public read events" on public.item_events for select using (true);

alter publication supabase_realtime add table public.items;

insert into storage.buckets (id, name, public)
values ('board-media', 'board-media', true)
on conflict (id) do nothing;

create policy "public read board media"
on storage.objects for select
using (bucket_id = 'board-media');
