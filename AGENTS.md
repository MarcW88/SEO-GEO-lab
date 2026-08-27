<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SEO / GEO Lab — AI Context

## What this is

A Next.js + React Flow + Supabase knowledge map for SEO and GEO R&D experiments.
**Not** a pipeline runner, not a ticket system — a capitalization layer.

## Data model

All entities live in `lib/data.ts` (mock) and mirror the Supabase schema in `supabase/schema.sql`.

- `Experiment` — a hypothesis tested, with status, decision, learnings, tools, clients, related IDs
- `Capability` — a skill area (e.g. Offsite GEO) with a maturity score 0–100
- `Tool` — a data source or platform used in experiments (e.g. DataForSEO, Semactic)
- `Relation` — a typed edge between any two entities (feeds, enables, validates, extends…)

## Key rules for AI assistants

1. **Before creating a new experiment**, search existing experiments in `lib/data.ts` for overlaps in capability, tools, or question. Flag potential duplicates.
2. **Decisions** must be one of: `keep | deepen | industrialize | merge | replace | kill`
3. **Status lifecycle**: `idea → testing → validated → production` (or `failed | paused | archived`)
4. **Every experiment** needs at minimum: `name`, `capability_id`, `status`, `question`, `tool_ids`
5. **Learnings** have a `type`: `finding` (✅), `warning` (⚠️), or `blocker` (❌)
6. **Do not** add Dagster, n8n, or orchestration tooling — this is a knowledge layer, not a pipeline runner
7. **Do not** store large datasets here — this stores the *catalogue* of what was learned, not the raw data

## Stack

- Next.js 16 App Router (no `src/` dir)
- Tailwind v4 (CSS-only config via `@theme` in `globals.css`)
- React Flow v12 (`@xyflow/react`) — client component only
- Supabase (`@supabase/supabase-js`) — env vars in `.env.local`
- Lucide React for icons

## File structure

```
app/
  page.tsx              # Dashboard overview
  experiments/
    page.tsx            # Filterable experiments table
    [id]/page.tsx       # Experiment detail
  map/
    page.tsx            # React Flow map (uses dynamic import, ssr: false)
components/
  Sidebar.tsx           # Navigation (client component)
  MapView.tsx           # React Flow graph (client component)
  StatusBadge.tsx       # StatusBadge, DecisionBadge, ValueStars
  CapabilityBar.tsx     # Capability maturity bar
  ExperimentCard.tsx    # Experiment list card
lib/
  types.ts              # TypeScript types
  data.ts               # Mock seed data
  utils.ts              # cn(), STATUS_CONFIG, DECISION_CONFIG
  supabase.ts           # Supabase client
supabase/
  schema.sql            # PostgreSQL schema
```
