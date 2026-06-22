-- snip — initial schema
-- Applied to snip's own Supabase project (separate from the Financial Dashboard).

create table if not exists public.links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  slug        text not null unique,
  target_url  text not null,
  click_count integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists links_user_id_idx on public.links(user_id);

alter table public.links enable row level security;

-- Owners manage only their own rows (the dashboard reads/writes via the anon client).
drop policy if exists "own links" on public.links;
create policy "own links" on public.links
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public redirect path: atomically increment the click count and return the
-- target. SECURITY DEFINER lets anonymous visitors resolve a link without any
-- account, while RLS still hides the links table itself from non-owners.
create or replace function public.resolve_link(p_slug text)
returns text
language sql
security definer
set search_path = public
as $$
  update public.links
  set click_count = click_count + 1
  where slug = p_slug
  returning target_url;
$$;
