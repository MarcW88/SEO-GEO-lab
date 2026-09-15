from __future__ import annotations

import inspect
import json
import math
import os
from pathlib import Path
from typing import Any, Callable

from semantica.kg import (
    GraphBuilder,
    GraphValidator,
    CentralityCalculator,
    CommunityDetector,
    PathFinder,
    LinkPredictor,
    NodeEmbedder,
    SimilarityCalculator,
)

try:
    from semantica.kg import TemporalGraphQuery
except Exception:
    TemporalGraphQuery = None

OUT = Path(__file__).resolve().parent / "results"
OUT.mkdir(parents=True, exist_ok=True)

LABELS = {
    "Camping": {"id": "label:camping", "reporting_delta": 45, "implemented": 2, "active": 2},
    "Cyclisme": {"id": "label:cyclisme", "reporting_delta": 29, "implemented": 7, "active": 18},
    "Fitness": {"id": "label:fitness", "reporting_delta": 15, "implemented": 1, "active": 1},
    "Football": {"id": "label:football", "reporting_delta": -5, "implemented": 0, "active": 1},
    "Mobilité urbaine": {"id": "label:mobilite-urbaine", "reporting_delta": 72, "implemented": 0, "active": 1},
    "Natation": {"id": "label:natation", "reporting_delta": 15, "implemented": 4, "active": 4},
    "Nutrition": {"id": "label:nutrition", "reporting_delta": 0, "implemented": 0, "active": 0},
    "Padel": {"id": "label:padel", "reporting_delta": 0, "implemented": 1, "active": 2},
    "Randonnée": {"id": "label:randonnee", "reporting_delta": -11, "implemented": 0, "active": 0},
    "Running": {"id": "label:running", "reporting_delta": -27, "implemented": 1, "active": 1},
    "Ski": {"id": "label:ski", "reporting_delta": 0, "implemented": 0, "active": 0},
    "VéloRoute": {"id": "label:veloroute", "reporting_delta": 67, "implemented": 0, "active": 0},
    "Wintersport": {"id": "label:wintersport", "reporting_delta": -12, "implemented": 2, "active": 3},
}

# Pre-intervention V4.2 backbone. Only relations with robust proximity >= 0.70
# are materialised in this sparse native-validation projection.
SEMANTIC_EDGES = [
    ("label:cyclisme", "label:veloroute", 0.991453, 0.602536, 0.707467, 146, 305),
    ("label:fitness", "label:cyclisme", 0.957265, 0.187250, 0.347594, 0, 0),
    ("label:wintersport", "label:ski", 0.952991, 0.344959, 0.383426, 0, 0),
    ("label:camping", "label:randonnee", 0.940171, 0.414655, 0.564733, 0, 0),
    ("label:fitness", "label:wintersport", 0.901709, 0.177204, 0.176336, 0, 0),
    ("label:cyclisme", "label:mobilite-urbaine", 0.888889, 0.126998, 0.260850, 0, 0),
    ("label:running", "label:fitness", 0.880342, 0.111125, 0.186081, 0, 0),
    ("label:padel", "label:football", 0.846154, 0.095261, 0.073337, 0, 0),
    ("label:cyclisme", "label:running", 0.837607, 0.053021, 0.142612, 1, 1),
    ("label:wintersport", "label:randonnee", 0.837607, 0.390885, 0.292768, 0, 0),
    ("label:running", "label:football", 0.833333, 0.077827, 0.139601, 0, 0),
    ("label:running", "label:randonnee", 0.803419, 0.162797, 0.216602, 0, 0),
    ("label:fitness", "label:football", 0.760684, 0.084022, 0.223656, 0, 0),
    ("label:fitness", "label:veloroute", 0.752137, 0.188452, 0.251709, 0, 0),
    ("label:camping", "label:natation", 0.752137, 0.060896, 0.133835, 0, 0),
    ("label:running", "label:veloroute", 0.743590, 0.045293, 0.087352, 0, 0),
    ("label:running", "label:nutrition", 0.713675, 0.220461, 0.299306, 0, 0),
    ("label:camping", "label:wintersport", 0.700855, 0.294573, 0.194742, 0, 0),
]

# Source ecosystems from the historical 123-question sample. These are used
# to test whether graph structure separates a semantic neighbour from a true
# source ecosystem neighbour.
SOURCE_DOMAINS = {
    "Cyclisme": ["materiel-velo.com", "reddit.com", "my-velo.fr", "mint-bikes.com", "instagram.com", "cyclisthouse.origine-cycles.com", "gravelpassion.fr", "youvelo.fr"],
    "VéloRoute": ["materiel-velo.com", "reddit.com", "canyon.com", "my-velo.fr", "cyclisthouse.origine-cycles.com", "gravelpassion.fr", "mint-bikes.com", "enrouelibre.fr"],
    "Camping": ["reddit.com", "montania-sport.com", "hardloop.fr", "tonton-outdoor.com", "asadventure.com", "rayonrando.com", "auvieuxcampeur.fr", "monbivouac.com"],
    "Randonnée": ["hardloop.fr", "tonton-outdoor.com", "glisshop.com", "rayonrando.com", "i-run.fr", "reddit.com", "cimalp.com", "facebook.com"],
    "Fitness": ["instagram.com", "fitnessboutique.fr", "reddit.com", "protrainer.fr", "lorangebleue.fr", "materiel-velo.com", "fflose.com", "velo-critique.com"],
    "Running": ["blog.therunningcollective.fr", "i-run.fr", "running-addict.fr", "reddit.com", "garmin.com", "instagram.com", "runnea.fr", "toutpourmasante.fr"],
    "Mobilité urbaine": ["frandroid.com", "cleanrider.com", "police.be", "blog.roulezjeunesse.com", "wee-bot.com", "mobilityurban.fr", "micro-mobility.fr", "upway.be"],
}

# Mechanism graph: facts already established in V3/V4.2. Direct semantic
# neighbour edges are intentionally excluded from this projection so that
# PathFinder must use an observable action/topic/asset/question route.
MECHANISM_ENTITIES = [
    {"id": "action:16071970", "name": "FTP recommendation", "type": "Action", "metadata": {"implemented": True, "validated": True, "created": "2026-02-23"}},
    {"id": "topic:ftp", "name": "performance cycliste / FTP", "type": "ActionTopic"},
    {"id": "asset:ftp-guide", "name": "Guide FTP Decathlon", "type": "Asset", "metadata": {"url": "https://www.decathlon.be/fr/c/learn/comment-ameliorer-sa-ftp-a-velo-le-guide-complet-pour-progresser_291625c4-99fe-4661-a62c-9870d6cd38a7"}},
    {"id": "question:20867", "name": "Améliorer son FTP en vélo de route", "type": "Question"},
    {"id": "action:16073740", "name": "Gravel recommendation", "type": "Action", "metadata": {"implemented": True, "created": "2026-03-02"}},
    {"id": "topic:gravel", "name": "gravel", "type": "ActionTopic"},
    {"id": "asset:gravel-plp", "name": "Vélo gravel", "type": "Asset", "metadata": {"url": "https://www.decathlon.be/fr/tous-les-sports/velo/velo-gravel"}},
    {"id": "question:veloroute-gravel", "name": "Choisir un gravel pour la route", "type": "Question"},
    {"id": "action:16073742", "name": "Sleeping bag recommendation", "type": "Action", "metadata": {"implemented": True, "created": "2026-03-02"}},
    {"id": "topic:sleeping-bag", "name": "sac de couchage", "type": "ActionTopic"},
    {"id": "concept:sleeping-bag", "name": "sac de couchage / duvet", "type": "Concept"},
    {"id": "asset:sleeping-bag-plp", "name": "Sacs de couchage adulte", "type": "Asset", "metadata": {"url": "https://www.decathlon.be/fr/tous-les-sports/camping/sacs-de-couchage-adulte"}},
    {"id": "asset:sleeping-bag-guide", "name": "Comment choisir son sac de couchage", "type": "Asset", "metadata": {"citations_camping": 150}},
    {"id": "asset:trekking-checklist", "name": "Checklist matériel trekking", "type": "Asset", "metadata": {"citations_hiking": 156}},
    {"id": "question:hiking-sleep", "name": "Matériel pour trekking et bivouac", "type": "Question", "metadata": {"late_concept_mention_rate": 0.538}},
    {"id": "action:16115447", "name": "Trottinette regulation recommendation", "type": "Action", "metadata": {"implemented": False, "created": "2026-03-29"}},
    {"id": "topic:scooter-regulation", "name": "réglementation trottinette électrique", "type": "ActionTopic"},
    {"id": "asset:scooter-regulation", "name": "Règles trottinette Belgique 2026", "type": "Asset", "metadata": {"citations_mobility": 293}},
    {"id": "question:mobility-scooter", "name": "Réglementation trottinette électrique", "type": "Question"},
    {"id": "action:16097853", "name": "Running shoes recommendation", "type": "Action", "metadata": {"implemented": True, "created": "2026-03-22"}},
    {"id": "topic:running-shoes", "name": "chaussures de running", "type": "ActionTopic"},
    {"id": "asset:running-shoes-plp", "name": "PLP chaussures de running", "type": "Asset", "metadata": {"observed_citations": 1}},
    {"id": "asset:running-shoes-guide", "name": "Guide choisir chaussures de running", "type": "Asset", "metadata": {"observed_citations": 24}},
    {"id": "question:running-shoes", "name": "Choisir ses chaussures de running", "type": "Question"},
]

MECHANISM_RELATIONSHIPS = [
    # Realised Cyclisme -> VéloRoute FTP path
    {"source": "action:16071970", "target": "label:cyclisme", "type": "PRIMARY_ACTION_FOR", "valid_from": "2026-02-23", "weight": 1.0},
    {"source": "action:16071970", "target": "label:veloroute", "type": "SECONDARY_ACTION_FOR", "valid_from": "2026-02-23", "weight": 1.0},
    {"source": "action:16071970", "target": "topic:ftp", "type": "TARGETS_TOPIC", "valid_from": "2026-02-23", "weight": 1.0},
    {"source": "action:16071970", "target": "asset:ftp-guide", "type": "TARGETS_ASSET", "valid_from": "2026-02-23", "weight": 1.0},
    {"source": "label:veloroute", "target": "question:20867", "type": "HAS_QUESTION", "weight": 1.0},
    {"source": "question:20867", "target": "asset:ftp-guide", "type": "CITES_ASSET", "valid_from": "2026-03-11", "weight": 1.0, "metadata": {"target_citations": 118, "baseline_hit_rate": 0.0, "july_hit_rate": 0.345, "august_hit_rate": 0.474, "engine_count": 3}},
    # Gravel supporting path
    {"source": "action:16073740", "target": "label:cyclisme", "type": "PRIMARY_ACTION_FOR", "valid_from": "2026-03-02", "weight": 1.0},
    {"source": "action:16073740", "target": "label:veloroute", "type": "SECONDARY_ACTION_FOR", "valid_from": "2026-03-02", "weight": 1.0},
    {"source": "action:16073740", "target": "topic:gravel", "type": "TARGETS_TOPIC", "valid_from": "2026-03-02", "weight": 1.0},
    {"source": "action:16073740", "target": "asset:gravel-plp", "type": "TARGETS_ASSET", "valid_from": "2026-03-02", "weight": 1.0},
    {"source": "label:veloroute", "target": "question:veloroute-gravel", "type": "HAS_QUESTION", "weight": 1.0},
    {"source": "question:veloroute-gravel", "target": "asset:gravel-plp", "type": "CITES_ASSET", "valid_from": "2026-03-01", "weight": 1.0, "metadata": {"cross_label_citations": 32}},
    # Camping -> Hiking: concept path exists, asset transfer deliberately absent
    {"source": "action:16073742", "target": "label:camping", "type": "PRIMARY_ACTION_FOR", "valid_from": "2026-03-02", "weight": 1.0},
    {"source": "action:16073742", "target": "topic:sleeping-bag", "type": "TARGETS_TOPIC", "valid_from": "2026-03-02", "weight": 1.0},
    {"source": "topic:sleeping-bag", "target": "concept:sleeping-bag", "type": "REPRESENTS_CONCEPT", "weight": 1.0},
    {"source": "action:16073742", "target": "asset:sleeping-bag-plp", "type": "TARGETS_ASSET", "valid_from": "2026-03-02", "weight": 1.0},
    {"source": "label:randonnee", "target": "question:hiking-sleep", "type": "HAS_QUESTION", "weight": 1.0},
    {"source": "question:hiking-sleep", "target": "concept:sleeping-bag", "type": "ABOUT_CONCEPT", "weight": 1.0},
    {"source": "question:hiking-sleep", "target": "asset:trekking-checklist", "type": "CITES_ASSET", "weight": 1.0, "metadata": {"citations": 63}},
    {"source": "label:camping", "target": "asset:sleeping-bag-guide", "type": "USES_ASSET", "weight": 1.0},
    # Mobility own mechanism; there is intentionally no Cyclisme action/asset edge here
    {"source": "action:16115447", "target": "label:mobilite-urbaine", "type": "PRIMARY_ACTION_FOR", "valid_from": "2026-03-29", "weight": 1.0},
    {"source": "action:16115447", "target": "topic:scooter-regulation", "type": "TARGETS_TOPIC", "valid_from": "2026-03-29", "weight": 1.0},
    {"source": "action:16115447", "target": "asset:scooter-regulation", "type": "TARGETS_ASSET", "valid_from": "2026-03-29", "weight": 1.0},
    {"source": "label:mobilite-urbaine", "target": "question:mobility-scooter", "type": "HAS_QUESTION", "weight": 1.0},
    {"source": "question:mobility-scooter", "target": "asset:scooter-regulation", "type": "CITES_ASSET", "weight": 1.0, "metadata": {"citations": 293}},
    # Running: direct action asset underperforms the guide; no Fitness transfer is materialised
    {"source": "action:16097853", "target": "label:running", "type": "PRIMARY_ACTION_FOR", "valid_from": "2026-03-22", "weight": 1.0},
    {"source": "action:16097853", "target": "topic:running-shoes", "type": "TARGETS_TOPIC", "valid_from": "2026-03-22", "weight": 1.0},
    {"source": "action:16097853", "target": "asset:running-shoes-plp", "type": "TARGETS_ASSET", "valid_from": "2026-03-22", "weight": 1.0},
    {"source": "label:running", "target": "question:running-shoes", "type": "HAS_QUESTION", "weight": 1.0},
    {"source": "question:running-shoes", "target": "asset:running-shoes-guide", "type": "CITES_ASSET", "weight": 1.0, "metadata": {"citations": 24}},
]


def safe(name: str, fn: Callable[[], Any], errors: dict[str, str]):
    try:
        return fn()
    except Exception as exc:
        errors[name] = f"{type(exc).__name__}: {exc}"
        return None


def builder_graph(entities, relationships):
    builder = GraphBuilder(merge_entities=False, resolve_conflicts=False, enable_temporal=True, temporal_granularity="day")
    return builder.build({"entities": entities, "relationships": relationships}, extract=False)


def label_graph_source():
    entities = []
    for name, d in LABELS.items():
        entities.append({"id": d["id"], "name": name, "type": "Label", "metadata": d})
    relationships = []
    for a, b, proximity, source_cosine, late_source_cosine, cross_impl, cross_all in SEMANTIC_EDGES:
        relationships.append({
            "source": a,
            "target": b,
            "type": "SEMANTIC_EXPOSURE",
            "confidence": proximity,
            "weight": max(0.001, 1.0 - proximity),
            "metadata": {
                "baseline_proximity": proximity,
                "baseline_source_cosine": source_cosine,
                "late_source_cosine": late_source_cosine,
                "cross_urls_impl": cross_impl,
                "cross_urls_all": cross_all,
            },
        })
    return entities, relationships


def source_graph_source():
    entities = [{"id": d["id"], "name": n, "type": "Label", "metadata": d} for n, d in LABELS.items()]
    relationships = []
    seen = set()
    for label, domains in SOURCE_DOMAINS.items():
        lid = LABELS[label]["id"]
        for rank, domain in enumerate(domains, 1):
            sid = f"source:{domain}"
            if sid not in seen:
                entities.append({"id": sid, "name": domain, "type": "SourceDomain"})
                seen.add(sid)
            relationships.append({"source": lid, "target": sid, "type": "USES_SOURCE_DOMAIN", "weight": float(rank), "metadata": {"top_rank": rank}})
    return entities, relationships


def mechanism_graph_source():
    label_entities = [{"id": d["id"], "name": n, "type": "Label", "metadata": d} for n, d in LABELS.items()]
    return label_entities + MECHANISM_ENTITIES, MECHANISM_RELATIONSHIPS


def validate_graph(graph):
    validator = GraphValidator()
    result = validator.validate(graph)
    return {
        "is_valid": bool(result.is_valid),
        "issues": [getattr(i, "message", str(i)) for i in getattr(result, "issues", [])],
    }


def detect_communities(detector, graph, method):
    # v0.6.x has changed this keyword once; keep the validation runner compatible.
    fn = detector.detect_communities
    try:
        return fn(graph, algorithm=method)
    except TypeError:
        try:
            return fn(graph, method=method)
        except TypeError:
            return fn(graph)


def dijkstra_undirected(finder, graph, source, target):
    if hasattr(finder, "dijkstra_shortest_path"):
        try:
            return finder.dijkstra_shortest_path(graph, source, target, weight_attribute="weight", directed=False)
        except TypeError:
            return finder.dijkstra_shortest_path(graph, source, target, weight_attribute="weight")
    if hasattr(finder, "find_shortest_path"):
        return finder.find_shortest_path(graph, source, target)
    raise AttributeError("No supported shortest-path method found")


def undirected_source_overlap(a: str, b: str):
    sa, sb = set(SOURCE_DOMAINS.get(a, [])), set(SOURCE_DOMAINS.get(b, []))
    if not sa and not sb:
        return None
    return len(sa & sb) / len(sa | sb)


def serialize(obj):
    if isinstance(obj, dict):
        return {str(k): serialize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [serialize(v) for v in obj]
    if hasattr(obj, "item"):
        try:
            return obj.item()
        except Exception:
            pass
    return obj


def main():
    errors: dict[str, str] = {}

    label_entities, label_rels = label_graph_source()
    source_entities, source_rels = source_graph_source()
    mech_entities, mech_rels = mechanism_graph_source()

    label_graph = builder_graph(label_entities, label_rels)
    source_graph = builder_graph(source_entities, source_rels)
    mechanism_graph = builder_graph(mech_entities, mech_rels)

    centrality = CentralityCalculator()
    detector = CommunityDetector()
    finder = PathFinder()
    predictor = LinkPredictor(method="jaccard_coefficient")

    native = {
        "package": {},
        "validation": {
            "label_graph": safe("validate_label_graph", lambda: validate_graph(label_graph), errors),
            "source_graph": safe("validate_source_graph", lambda: validate_graph(source_graph), errors),
            "mechanism_graph": safe("validate_mechanism_graph", lambda: validate_graph(mechanism_graph), errors),
        },
        "centrality": {},
        "communities": {},
        "paths": {},
        "link_prediction": None,
        "node2vec": None,
        "temporal": None,
        "source_overlap": {},
        "errors": errors,
    }

    try:
        import semantica
        native["package"] = {"version": getattr(semantica, "__version__", "unknown"), "module": getattr(semantica, "__file__", None)}
    except Exception as exc:
        native["package"] = {"error": str(exc)}

    native["centrality"]["label_graph"] = safe(
        "centrality_label",
        lambda: centrality.calculate_all_centrality(label_graph),
        errors,
    )
    native["centrality"]["source_graph"] = safe(
        "centrality_source",
        lambda: centrality.calculate_all_centrality(source_graph),
        errors,
    )

    for method in ["louvain", "leiden"]:
        native["communities"][method] = safe(
            f"community_{method}",
            lambda m=method: detect_communities(detector, label_graph, m),
            errors,
        )

    pairs = {
        "cycling_to_veloroute": ("label:cyclisme", "label:veloroute"),
        "camping_to_hiking": ("label:camping", "label:randonnee"),
        "cycling_to_mobility": ("label:cyclisme", "label:mobilite-urbaine"),
        "fitness_to_running": ("label:fitness", "label:running"),
    }
    for key, (a, b) in pairs.items():
        native["paths"][key] = safe(key, lambda s=a, t=b: dijkstra_undirected(finder, mechanism_graph, s, t), errors)

    native["link_prediction"] = safe(
        "link_prediction",
        lambda: predictor.predict_links(label_graph, top_k=20, exclude_existing=True),
        errors,
    )

    def run_node2vec():
        embedder = NodeEmbedder(method="node2vec", embedding_dimension=64)
        embeddings = embedder.compute_embeddings(label_graph, ["Label"], ["SEMANTIC_EXPOSURE"])
        calc = SimilarityCalculator()
        similarities = {}
        for key, (a, b) in pairs.items():
            if a in embeddings and b in embeddings:
                similarities[key] = calc.cosine_similarity(embeddings[a], embeddings[b])
        return {"node_count": len(embeddings), "pair_similarity": similarities}

    native["node2vec"] = safe("node2vec", run_node2vec, errors)

    if TemporalGraphQuery is not None:
        def run_temporal():
            tq = TemporalGraphQuery(temporal_granularity="day", enable_temporal_reasoning=True)
            baseline = tq.reconstruct_at_time(mechanism_graph, "2026-02-22")
            august = tq.reconstruct_at_time(mechanism_graph, "2026-08-31")
            return {
                "baseline_entities": len(baseline.get("entities", [])),
                "baseline_relationships": len(baseline.get("relationships", [])),
                "august_entities": len(august.get("entities", [])),
                "august_relationships": len(august.get("relationships", [])),
            }
        native["temporal"] = safe("temporal", run_temporal, errors)

    for key, (a, b) in {
        "cycling_to_veloroute": ("Cyclisme", "VéloRoute"),
        "camping_to_hiking": ("Camping", "Randonnée"),
        "cycling_to_mobility": ("Cyclisme", "Mobilité urbaine"),
        "fitness_to_running": ("Fitness", "Running"),
    }.items():
        native["source_overlap"][key] = undirected_source_overlap(a, b)

    # V4.2 regression contract. Native algorithms add evidence; these facts are guardrails.
    expected = {
        "cycling_to_veloroute": {"expected": "observed_spillover", "min_proximity": 0.95, "min_cross_impl": 100, "target_direct_impl": 0},
        "camping_to_hiking": {"expected": "potential_unconverted", "min_proximity": 0.90, "max_cross_impl": 0, "target_direct_impl": 0},
        "cycling_to_mobility": {"expected": "confounded_or_no_transfer", "min_proximity": 0.85, "max_cross_impl": 0},
        "fitness_to_running": {"expected": "authority_gap", "min_proximity": 0.80, "max_cross_impl": 0},
    }
    edge_lookup = {}
    for a, b, proximity, source_cosine, late_source_cosine, cross_impl, cross_all in SEMANTIC_EDGES:
        edge_lookup[frozenset((a, b))] = {"proximity": proximity, "cross_impl": cross_impl, "cross_all": cross_all}

    label_by_id = {d["id"]: d for d in LABELS.values()}
    regression = {}
    for key, (a, b) in pairs.items():
        rule = expected[key]
        e = edge_lookup[frozenset((a, b))]
        checks = {"min_proximity": e["proximity"] >= rule["min_proximity"]}
        if "min_cross_impl" in rule:
            checks["min_cross_impl"] = e["cross_impl"] >= rule["min_cross_impl"]
        if "max_cross_impl" in rule:
            checks["max_cross_impl"] = e["cross_impl"] <= rule["max_cross_impl"]
        if "target_direct_impl" in rule:
            checks["target_direct_impl"] = label_by_id[b]["implemented"] == rule["target_direct_impl"]
        # Native path is informative, but absence is expected for the negative cases.
        path = native["paths"].get(key)
        checks["native_path_behavior"] = bool(path) if key in {"cycling_to_veloroute", "camping_to_hiking"} else not bool(path)
        regression[key] = {"expected": rule["expected"], "checks": checks, "pass": all(checks.values())}

    native["v42_regression"] = regression
    native["all_v42_regressions_pass"] = all(v["pass"] for v in regression.values())
    native["global_guardrail"] = {
        "spillover_is_global": False,
        "bridge_vs_distant_presence_differential_pp": 0.47,
        "interpretation": "Spillover must be demonstrated relation by relation.",
    }

    # Refresh errors after the safe() calls populated the shared dict.
    native["errors"] = errors
    native = serialize(native)
    (OUT / "native_results.json").write_text(json.dumps(native, ensure_ascii=False, indent=2), encoding="utf-8")

    # Human-readable summary for quick inspection in GitHub and later in Vercel.
    lines = [
        "# Decathlon native Semantica validation",
        "",
        f"Semantica version: **{native['package'].get('version', 'unknown')}**",
        f"V4.2 regression gate: **{'PASS' if native['all_v42_regressions_pass'] else 'FAIL'}**",
        "",
        "## Four reference cases",
    ]
    for key, data in regression.items():
        lines.append(f"- **{key}** — {data['expected']} — {'PASS' if data['pass'] else 'FAIL'} — path: `{native['paths'].get(key)}`")
    lines += ["", "## Native errors / optional dependency gaps"]
    if errors:
        for name, error in errors.items():
            lines.append(f"- `{name}`: {error}")
    else:
        lines.append("- None")
    lines += ["", "## Source overlap guardrail"]
    for key, score in native["source_overlap"].items():
        lines.append(f"- {key}: {score:.3f}" if score is not None else f"- {key}: n/a")
    (OUT / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({
        "semantica_version": native["package"].get("version"),
        "v42_pass": native["all_v42_regressions_pass"],
        "errors": errors,
        "paths": native["paths"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
