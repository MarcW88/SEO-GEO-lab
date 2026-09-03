-- ─── LinkedIn Sources — UPDATE experiments by name ────────────────────────────
-- Run this in the Supabase SQL Editor.
-- Replace each URL placeholder with the actual LinkedIn post URL.
-- Labels are pre-filled based on your table.

-- 1. Nao SEO/GEO Analytics Agent POC
--    Source: Nao Labs sur LinkedIn + Post de lancement – Claire Gouze
UPDATE experiments
SET data = data || jsonb_build_object(
  'linkedin_url',   'https://www.linkedin.com/company/getnao-io/',
  'linkedin_label', 'Nao Labs — Post de lancement · Claire Gouze'
)
WHERE data->>'name' = 'Nao SEO/GEO Analytics Agent POC';

-- 2. Semantica v0.6.0 – Connected Data (4 simulations)
--    → Replace URL below with the exact LinkedIn post URL if you have it
UPDATE experiments
SET data = data || jsonb_build_object(
  'linkedin_url',   'https://www.linkedin.com/posts/semantica-ai_semantica-v060-connected-data-activity',
  'linkedin_label', 'Semantica v0.6.0 — Connected Data'
)
WHERE data->>'name' IN (
  'Brand Knowledge Graph POC',
  'Website → Ontology Audit',
  'GraphRAG Brand Understanding Benchmark',
  'Traceable SEO/GEO Agent Decisions'
);

-- 3. Finchling / Trending Digital PR – Mark Williams-Cook (3 simulations)
UPDATE experiments
SET data = data || jsonb_build_object(
  'linkedin_url',   'https://www.linkedin.com/in/markwilliamscook/',
  'linkedin_label', 'Finchling / Trending Digital PR — Mark Williams-Cook'
)
WHERE data->>'name' IN (
  'Finchling Digital PR Intelligence Evaluation',
  'Belgian Digital PR Opportunity Engine',
  'Earned Media → AI Visibility Correlation'
);

-- 4. AirOps – AI Search Technical Checklist + Jairo Guerrero (2 simulations)
UPDATE experiments
SET data = data || jsonb_build_object(
  'linkedin_url',   'https://www.linkedin.com/in/jairoguerrero/',
  'linkedin_label', 'AirOps — AI Search Technical Checklist · Jairo Guerrero'
)
WHERE data->>'name' IN (
  'Search Grounding vs Live Fetch Citation Test',
  'Technical GEO Citability Benchmark'
);

-- 5. Perception Graph – Andrea Volpini (2 simulations)
UPDATE experiments
SET data = data || jsonb_build_object(
  'linkedin_url',   'https://www.linkedin.com/in/andreavolpini/',
  'linkedin_label', 'Perception Graph — Andrea Volpini'
)
WHERE data->>'name' IN (
  'Brand Perception Gap Benchmark',
  'Perception Gap Intervention Test'
);

-- 6. SEOctopus — pas de source LinkedIn (aucune mise à jour)

-- ─── Verify ────────────────────────────────────────────────────────────────────
SELECT data->>'name' AS simulation, data->>'linkedin_label' AS linkedin_label
FROM experiments
WHERE data->>'linkedin_url' IS NOT NULL
ORDER BY data->>'name';
