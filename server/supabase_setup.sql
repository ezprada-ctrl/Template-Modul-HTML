-- Run this once in Supabase Studio -> SQL Editor (project jgzzvsgadwolzepfmndt,
-- same project PILAR uses). Creates an isolated table for Template Modul
-- Ikram drafts — does not touch any existing PILAR table.
--
-- No auth: RLS is intentionally open (matches the tool's "internal tool,
-- no login" design) — anyone with the anon key (public, same one the
-- frontend already ships) can read/write drafts. Acceptable for an internal
-- authoring tool with no sensitive data; revisit if that changes.

create table if not exists public.modul_drafts (
  slug text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.modul_drafts enable row level security;

create policy "modul_drafts_anon_all" on public.modul_drafts
  for all
  using (true)
  with check (true);

-- keep updated_at fresh on every save
create or replace function public.modul_drafts_touch()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists modul_drafts_touch_trigger on public.modul_drafts;
create trigger modul_drafts_touch_trigger
  before update on public.modul_drafts
  for each row execute function public.modul_drafts_touch();
