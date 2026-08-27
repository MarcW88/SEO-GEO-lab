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

-- ─── Simulation workspace tables ──────────────────────────────────────────────
-- Simulations are hypothetical workspaces — they do NOT affect experiments/relations.

create table if not exists simulations (
  id text primary key,
  name text not null,
  hypothesis text,
  expected_value text default 'medium',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists simulation_nodes (
  id text primary key,
  simulation_id text references simulations(id) on delete cascade,
  entity_id text not null,
  entity_type text not null,
  position_x float default 200,
  position_y float default 200
);

create table if not exists simulation_edges (
  id text primary key,
  simulation_id text references simulations(id) on delete cascade,
  source_id text not null,
  target_id text not null,
  relation_type text default 'related_to'
);

alter table simulations enable row level security;
alter table simulation_nodes enable row level security;
alter table simulation_edges enable row level security;

create policy "Public read" on simulations for select using (true);
create policy "Public read" on simulation_nodes for select using (true);
create policy "Public read" on simulation_edges for select using (true);
