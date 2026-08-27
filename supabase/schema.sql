-- SEO / GEO Lab — Supabase Schema
-- Run this in the Supabase SQL editor to set up the database.
-- Each table stores the full object as jsonb (simple, flexible, mirrors lib/types.ts).

create table if not exists experiments (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists capabilities (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists tools (
  id text primary key,
  data jsonb not null
);

create table if not exists relations (
  id text primary key,
  data jsonb not null
);

-- Row-level security: public read, service-role write (MCP uses service role key)
alter table experiments enable row level security;
alter table capabilities enable row level security;
alter table tools enable row level security;
alter table relations enable row level security;

create policy "Public read" on experiments for select using (true);
create policy "Public read" on capabilities for select using (true);
create policy "Public read" on tools for select using (true);
create policy "Public read" on relations for select using (true);

-- Auto-update updated_at on experiments
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger experiments_updated_at
  before update on experiments
  for each row execute function update_updated_at();
