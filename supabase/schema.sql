-- Pégalo en Supabase > SQL Editor > Run (una sola vez)
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "ver lo propio" on public.progress
  for select using ((select auth.uid()) = user_id);

create policy "crear lo propio" on public.progress
  for insert with check ((select auth.uid()) = user_id);

create policy "actualizar lo propio" on public.progress
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "borrar lo propio" on public.progress
  for delete using ((select auth.uid()) = user_id);
