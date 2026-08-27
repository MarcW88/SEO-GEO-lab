-- SEO / GEO Lab — Supabase Schema
-- Run this in the Supabase SQL editor to set up the database

create table if not exists capabilities (
  id text primary key,
  name text not null,
  parent_id text references capabilities(id),
  description text,
  maturity integer not null default 0 check (maturity >= 0 and maturity <= 100),
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

create table if not exists tools (
  id text primary key,
  name text not null,
  type text not null check (type in ('data_source', 'platform', 'library', 'api', 'internal')),
  description text,
  url text,
  created_at timestamptz default now()
);

create table if not exists experiments (
  id text primary key,
  name text not null,
  capability_id text references capabilities(id),
  status text not null check (status in ('idea', 'testing', 'validated', 'production', 'failed', 'paused', 'archived')),
  decision text check (decision in ('keep', 'deepen', 'industrialize', 'merge', 'replace', 'kill')),
  value integer check (value >= 1 and value <= 5),
  maturity integer check (maturity >= 1 and maturity <= 5),
  question text,
  learnings jsonb default '[]',
  inputs text[] default '{}',
  tool_ids text[] default '{}',
  clients text[] default '{}',
  related_ids text[] default '{}',
  next_experiment text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists relations (
  id text primary key,
  source_id text not null,
  source_type text not null check (source_type in ('experiment', 'capability', 'tool', 'pipeline')),
  target_id text not null,
  target_type text not null check (target_type in ('experiment', 'capability', 'tool', 'pipeline')),
  relation_type text not null check (relation_type in ('uses', 'validates', 'extends', 'feeds', 'enables', 'related_to', 'replaced_by')),
  created_at timestamptz default now()
);

create table if not exists pipelines (
  id text primary key,
  name text not null,
  description text,
  experiment_ids text[] default '{}',
  tool_ids text[] default '{}',
  output text,
  status text not null default 'draft' check (status in ('draft', 'active', 'deprecated')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table experiments enable row level security;
alter table capabilities enable row level security;
alter table tools enable row level security;
alter table relations enable row level security;
alter table pipelines enable row level security;

create policy "Public read" on experiments for select using (true);
create policy "Public read" on capabilities for select using (true);
create policy "Public read" on tools for select using (true);
create policy "Public read" on relations for select using (true);
create policy "Public read" on pipelines for select using (true);

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

create trigger pipelines_updated_at
  before update on pipelines
  for each row execute function update_updated_at();
