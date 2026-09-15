# Decathlon native Semantica validation v2

Semantica: **0.6.8**
V4.2 regression gate: **PASS**

## Paths
- **cycling_to_veloroute** — concept: `['label:cyclisme', 'action:ftp', 'asset:ftp', 'question:ftp-road', 'label:veloroute']` — asset: `['label:cyclisme', 'action:ftp', 'asset:ftp', 'question:ftp-road', 'label:veloroute']`
- **camping_to_hiking** — concept: `['label:camping', 'action:sleep', 'topic:sleep', 'concept:sleep', 'question:hiking-sleep', 'label:randonnee']` — asset: `[]`
- **cycling_to_mobility** — concept: `[]` — asset: `[]`
- **fitness_to_running** — concept: `[]` — asset: `[]`

## Source overlap (Jaccard of top source domains)
- cycling_to_veloroute: **0.600**
- camping_to_hiking: **0.333**
- cycling_to_mobility: **0.000**
- fitness_to_running: **0.143**

## Optional/native errors
- None
