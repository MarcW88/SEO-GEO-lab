-- ─── LinkedIn Sources — UPDATE experiments by name ────────────────────────────
-- Run this in the Supabase SQL Editor.

-- 1. Nao SEO/GEO Analytics Agent POC
--    Source: Post de lancement Open Source Analytics Agent — Claire Gouze (Feb 2026)
UPDATE experiments
SET data = data || jsonb_build_object(
  'linkedin_url',   'https://www.linkedin.com/posts/claire-gouze_were-launching-the-first-open-source-activity-7426897807686696961--ifQ',
  'linkedin_label', 'Nao Labs — Open Source Analytics Agent · Claire Gouze'
)
WHERE data->>'name' = 'Nao SEO/GEO Analytics Agent POC';

-- 2. Semantica v0.6.0 – Connected Data (4 simulations)
--    Source: Connected Data World post on Semantica v0.6.0 (Jul 2026)
UPDATE experiments
SET data = data || jsonb_build_object(
  'linkedin_url',   'https://www.linkedin.com/posts/connecteddataworld_opensource-enterpriseai-knowledgegraphs-activity-7486005461947834368-qZhl',
  'linkedin_label', 'Semantica v0.6.0 — Connected Data'
)
WHERE data->>'name' IN (
  'Brand Knowledge Graph POC',
  'Website → Ontology Audit',
  'GraphRAG Brand Understanding Benchmark',
  'Traceable SEO/GEO Agent Decisions'
);

-- 3. Finchling / Trending Digital PR – Mark Williams-Cook (3 simulations)
--    Source: Post Finchling Trending PR Campaigns — Mark Williams-Cook (Aug 2026)
UPDATE experiments
SET data = data || jsonb_build_object(
  'linkedin_url',   'https://www.linkedin.com/posts/markseo_seo-activity-7491136040523526147-hY5t',
  'linkedin_label', 'Finchling / Trending Digital PR — Mark Williams-Cook'
)
WHERE data->>'name' IN (
  'Finchling Digital PR Intelligence Evaluation',
  'Belgian Digital PR Opportunity Engine',
  'Earned Media → AI Visibility Correlation'
);

-- 4. AirOps – Tech SEO for AI Search + Jairo Guerrero (2 simulations)
--    Source: Post webinar "Tech SEO for AI search" × AirOps — Jairo Guerrero (Jul 2026)
UPDATE experiments
SET data = data || jsonb_build_object(
  'linkedin_url',   'https://www.linkedin.com/posts/jdguerrerovasquez_not-me-before-my-webinar-on-tech-seo-for-activity-7480945389332959232-TDhU',
  'linkedin_label', 'Tech SEO for AI Search — Jairo Guerrero × AirOps'
)
WHERE data->>'name' IN (
  'Search Grounding vs Live Fetch Citation Test',
  'Technical GEO Citability Benchmark'
);

-- 5. Perception Graph – Andrea Volpini (2 simulations)
--    Source: Post "AI rebuilds knowledge from structure" — Andrea Volpini (Jul 2026)
UPDATE experiments
SET data = data || jsonb_build_object(
  'linkedin_url',   'https://www.linkedin.com/posts/volpini_ai-doesnt-read-your-documentation-it-builds-activity-7488902794280685568-mk7X',
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
