from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any, Callable

import networkx as nx
import numpy as np

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
random.seed(42)
np.random.seed(42)

LABELS = {
    "Camping": {"id": "label:camping", "reporting_delta": 45, "implemented": 2},
    "Cyclisme": {"id": "label:cyclisme", "reporting_delta": 29, "implemented": 7},
    "Fitness": {"id": "label:fitness", "reporting_delta": 15, "implemented": 1},
    "Football": {"id": "label:football", "reporting_delta": -5, "implemented": 0},
    "Mobilité urbaine": {"id": "label:mobilite-urbaine", "reporting_delta": 72, "implemented": 0},
    "Natation": {"id": "label:natation", "reporting_delta": 15, "implemented": 4},
    "Nutrition": {"id": "label:nutrition", "reporting_delta": 0, "implemented": 0},
    "Padel": {"id": "label:padel", "reporting_delta": 0, "implemented": 1},
    "Randonnée": {"id": "label:randonnee", "reporting_delta": -11, "implemented": 0},
    "Running": {"id": "label:running", "reporting_delta": -27, "implemented": 1},
    "Ski": {"id": "label:ski", "reporting_delta": 0, "implemented": 0},
    "VéloRoute": {"id": "label:veloroute", "reporting_delta": 67, "implemented": 0},
    "Wintersport": {"id": "label:wintersport", "reporting_delta": -12, "implemented": 2},
}

# V4.2 sparse pre-intervention semantic backbone.
# (a, b, proximity, baseline source cosine, late source cosine, implemented cross-asset citations, all cross-asset citations)
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

SOURCE_DOMAINS = {
    "Cyclisme": ["materiel-velo.com", "reddit.com", "my-velo.fr", "mint-bikes.com", "instagram.com", "cyclisthouse.origine-cycles.com", "gravelpassion.fr", "youvelo.fr"],
    "VéloRoute": ["materiel-velo.com", "reddit.com", "canyon.com", "my-velo.fr", "cyclisthouse.origine-cycles.com", "gravelpassion.fr", "mint-bikes.com", "enrouelibre.fr"],
    "Camping": ["reddit.com", "montania-sport.com", "hardloop.fr", "tonton-outdoor.com", "asadventure.com", "rayonrando.com", "auvieuxcampeur.fr", "monbivouac.com"],
    "Randonnée": ["hardloop.fr", "tonton-outdoor.com", "glisshop.com", "rayonrando.com", "i-run.fr", "reddit.com", "cimalp.com", "facebook.com"],
    "Fitness": ["instagram.com", "fitnessboutique.fr", "reddit.com", "protrainer.fr", "lorangebleue.fr", "materiel-velo.com", "fflose.com", "velo-critique.com"],
    "Running": ["blog.therunningcollective.fr", "i-run.fr", "running-addict.fr", "reddit.com", "garmin.com", "instagram.com", "runnea.fr", "toutpourmasante.fr"],
    "Mobilité urbaine": ["frandroid.com", "cleanrider.com", "police.be", "blog.roulezjeunesse.com", "wee-bot.com", "mobilityurban.fr", "micro-mobility.fr", "upway.be"],
}

PAIRS = {
    "cycling_to_veloroute": ("label:cyclisme", "label:veloroute"),
    "camping_to_hiking": ("label:camping", "label:randonnee"),
    "cycling_to_mobility": ("label:cyclisme", "label:mobilite-urbaine"),
    "fitness_to_running": ("label:fitness", "label:running"),
}


def E(id_: str, name: str, type_: str, **metadata):
    return {"id": id_, "name": name, "type": type_, "metadata": metadata}


def R(source: str, target: str, type_: str, valid_from: str | None = None, **metadata):
    d = {"source": source, "target": target, "type": type_, "weight": 1.0, "metadata": metadata}
    if valid_from:
        d["valid_from"] = valid_from
    return d


def label_source():
    entities = [E(d["id"], name, "Label", **d) for name, d in LABELS.items()]
    rels = []
    for a, b, prox, src0, src1, cross_impl, cross_all in SEMANTIC_EDGES:
        rels.append({
            "source": a,
            "target": b,
            "type": "SEMANTIC_EXPOSURE",
            "confidence": prox,
            "weight": max(0.001, 1 - prox),
            "metadata": {
                "baseline_proximity": prox,
                "baseline_source_cosine": src0,
                "late_source_cosine": src1,
                "cross_urls_impl": cross_impl,
                "cross_urls_all": cross_all,
            },
        })
    return entities, rels


def source_ecosystem_source():
    entities = [E(d["id"], name, "Label", **d) for name, d in LABELS.items()]
    rels = []
    seen = set()
    for label, domains in SOURCE_DOMAINS.items():
        lid = LABELS[label]["id"]
        for rank, domain in enumerate(domains, 1):
            sid = f"source:{domain}"
            if sid not in seen:
                entities.append(E(sid, domain, "SourceDomain"))
                seen.add(sid)
            rels.append({"source": lid, "target": sid, "type": "USES_SOURCE_DOMAIN", "weight": float(rank), "metadata": {"rank": rank}})
    return entities, rels


def mechanism_source(include_concept_edges=True, include_asset_edges=True):
    entities = [E(d["id"], name, "Label", **d) for name, d in LABELS.items()]
    entities += [
        E("action:ftp", "FTP recommendation", "Action", implemented=True),
        E("topic:ftp", "performance cycliste / FTP", "ActionTopic"),
        E("asset:ftp", "Guide FTP Decathlon", "Asset", target_citations=118),
        E("question:ftp-road", "Améliorer son FTP en vélo de route", "Question"),
        E("action:gravel", "Gravel recommendation", "Action", implemented=True),
        E("topic:gravel", "gravel", "ActionTopic"),
        E("asset:gravel", "Vélo gravel", "Asset", target_citations=32),
        E("question:gravel-road", "Choisir un gravel pour la route", "Question"),
        E("action:sleep", "Sleeping bag recommendation", "Action", implemented=True),
        E("topic:sleep", "sac de couchage", "ActionTopic"),
        E("concept:sleep", "sac de couchage / duvet", "Concept"),
        E("asset:sleep-plp", "Sacs de couchage adulte", "Asset", target_citations=0),
        E("asset:trek", "Checklist matériel trekking", "Asset", target_citations=63),
        E("question:hiking-sleep", "Matériel pour trekking et bivouac", "Question", concept_mention_rate=0.538),
        E("action:scooter", "Trottinette regulation recommendation", "Action", implemented=False),
        E("topic:scooter", "réglementation trottinette électrique", "ActionTopic"),
        E("asset:scooter", "Règles trottinette Belgique", "Asset", citations=293),
        E("question:scooter", "Réglementation trottinette électrique", "Question"),
        E("action:runshoes", "Running shoes recommendation", "Action", implemented=True),
        E("topic:runshoes", "chaussures de running", "ActionTopic"),
        E("asset:run-plp", "PLP chaussures running", "Asset", citations=1),
        E("asset:run-guide", "Guide chaussures running", "Asset", citations=24),
        E("question:runshoes", "Choisir ses chaussures de running", "Question"),
    ]
    rels = [
        # realised FTP asset-transfer route: Cyclisme <- Action -> Asset <- Question <- VéloRoute
        R("action:ftp", "label:cyclisme", "PRIMARY_ACTION_FOR", "2026-02-23"),
        R("action:ftp", "topic:ftp", "TARGETS_TOPIC", "2026-02-23"),
        R("label:veloroute", "question:ftp-road", "HAS_QUESTION"),
        R("action:gravel", "label:cyclisme", "PRIMARY_ACTION_FOR", "2026-03-02"),
        R("action:gravel", "topic:gravel", "TARGETS_TOPIC", "2026-03-02"),
        R("label:veloroute", "question:gravel-road", "HAS_QUESTION"),
        # Camping and Hiking share the concept, but not the action asset.
        R("action:sleep", "label:camping", "PRIMARY_ACTION_FOR", "2026-03-02"),
        R("action:sleep", "topic:sleep", "TARGETS_TOPIC", "2026-03-02"),
        R("label:randonnee", "question:hiking-sleep", "HAS_QUESTION"),
        # Mobility's own mechanism only.
        R("action:scooter", "label:mobilite-urbaine", "PRIMARY_ACTION_FOR", "2026-03-29"),
        R("action:scooter", "topic:scooter", "TARGETS_TOPIC", "2026-03-29"),
        R("label:mobilite-urbaine", "question:scooter", "HAS_QUESTION"),
        # Running's own mechanism only; no Fitness edge.
        R("action:runshoes", "label:running", "PRIMARY_ACTION_FOR", "2026-03-22"),
        R("action:runshoes", "topic:runshoes", "TARGETS_TOPIC", "2026-03-22"),
        R("label:running", "question:runshoes", "HAS_QUESTION"),
    ]
    if include_asset_edges:
        rels += [
            R("action:ftp", "asset:ftp", "TARGETS_ASSET", "2026-02-23"),
            R("question:ftp-road", "asset:ftp", "CITES_ASSET", "2026-03-11", citations=118, baseline_hit_rate=0, july_hit_rate=0.345, august_hit_rate=0.474),
            R("action:gravel", "asset:gravel", "TARGETS_ASSET", "2026-03-02"),
            R("question:gravel-road", "asset:gravel", "CITES_ASSET", "2026-03-01", citations=32),
            R("action:sleep", "asset:sleep-plp", "TARGETS_ASSET", "2026-03-02"),
            R("question:hiking-sleep", "asset:trek", "CITES_ASSET", citations=63),
            R("action:scooter", "asset:scooter", "TARGETS_ASSET", "2026-03-29"),
            R("question:scooter", "asset:scooter", "CITES_ASSET", citations=293),
            R("action:runshoes", "asset:run-plp", "TARGETS_ASSET", "2026-03-22"),
            R("question:runshoes", "asset:run-guide", "CITES_ASSET", citations=24),
        ]
    if include_concept_edges:
        rels += [
            R("topic:sleep", "concept:sleep", "REPRESENTS_CONCEPT"),
            R("question:hiking-sleep", "concept:sleep", "ABOUT_CONCEPT"),
        ]
    return entities, rels


def build(entities, relationships):
    builder = GraphBuilder(merge_entities=False, resolve_conflicts=False, enable_temporal=True, temporal_granularity="day")
    return builder.build({"entities": entities, "relationships": relationships}, extract=False)


def to_nx(graph, undirected=True):
    G = nx.Graph() if undirected else nx.DiGraph()
    for ent in graph.get("entities", []):
        G.add_node(ent["id"], type=ent.get("type"), name=ent.get("name"), **(ent.get("metadata") or {}))
    for rel in graph.get("relationships", []):
        data = {"type": rel.get("type"), "weight": rel.get("weight", 1.0), **(rel.get("metadata") or {})}
        G.add_edge(rel["source"], rel["target"], **data)
    return G


def safe(name: str, fn: Callable[[], Any], errors: dict[str, str]):
    try:
        return fn()
    except Exception as exc:
        errors[name] = f"{type(exc).__name__}: {exc}"
        return None


def serialize(obj):
    if isinstance(obj, dict):
        return {str(k): serialize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set, frozenset)):
        return [serialize(v) for v in obj]
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.generic):
        return obj.item()
    return obj


def validate(graph):
    result = GraphValidator().validate(graph)
    return {"is_valid": bool(result.is_valid), "issues": [getattr(i, "message", str(i)) for i in getattr(result, "issues", [])]}


def community(detector, graph, method):
    if method == "leiden" and hasattr(detector, "detect_communities_leiden"):
        return detector.detect_communities_leiden(graph, resolution=1.2)
    try:
        return detector.detect_communities(graph, algorithm=method)
    except TypeError:
        return detector.detect_communities(graph)


def shortest_path(finder, graph, a, b):
    try:
        return finder.dijkstra_shortest_path(graph, a, b, weight_attribute="weight", directed=False)
    except TypeError:
        return finder.dijkstra_shortest_path(graph, a, b, weight_attribute="weight")


def jaccard_sources(a, b):
    sa, sb = set(SOURCE_DOMAINS.get(a, [])), set(SOURCE_DOMAINS.get(b, []))
    return len(sa & sb) / len(sa | sb) if sa or sb else None


def main():
    errors = {}
    label_dict = build(*label_source())
    source_dict = build(*source_ecosystem_source())
    concept_dict = build(*mechanism_source(include_concept_edges=True, include_asset_edges=True))
    asset_dict = build(*mechanism_source(include_concept_edges=False, include_asset_edges=True))

    label_nx = to_nx(label_dict)
    source_nx = to_nx(source_dict)
    concept_nx = to_nx(concept_dict)
    asset_nx = to_nx(asset_dict)

    calc = CentralityCalculator()
    detector = CommunityDetector()
    finder = PathFinder()
    predictor = LinkPredictor(method="jaccard_coefficient")

    result = {
        "semantica": {},
        "graph_validation": {
            "label": safe("validate_label", lambda: validate(label_dict), errors),
            "source": safe("validate_source", lambda: validate(source_dict), errors),
            "concept_mechanism": safe("validate_concept", lambda: validate(concept_dict), errors),
            "asset_mechanism": safe("validate_asset", lambda: validate(asset_dict), errors),
        },
        "centrality": {
            "label": safe("centrality_label", lambda: calc.calculate_all_centrality(label_nx), errors),
            "source": safe("centrality_source", lambda: calc.calculate_all_centrality(source_nx), errors),
        },
        "communities": {
            "louvain": safe("louvain", lambda: community(detector, label_nx, "louvain"), errors),
            "leiden": safe("leiden", lambda: community(detector, label_nx, "leiden"), errors),
        },
        "paths": {},
        "source_overlap": {
            "cycling_to_veloroute": jaccard_sources("Cyclisme", "VéloRoute"),
            "camping_to_hiking": jaccard_sources("Camping", "Randonnée"),
            "cycling_to_mobility": jaccard_sources("Cyclisme", "Mobilité urbaine"),
            "fitness_to_running": jaccard_sources("Fitness", "Running"),
        },
        "errors": errors,
    }

    try:
        import semantica
        result["semantica"] = {"version": getattr(semantica, "__version__", "unknown"), "file": getattr(semantica, "__file__", None)}
    except Exception as exc:
        result["semantica"] = {"error": str(exc)}

    for key, (a, b) in PAIRS.items():
        result["paths"][key] = {
            "concept_path": safe(f"concept_{key}", lambda s=a, t=b: shortest_path(finder, concept_nx, s, t), errors),
            "asset_transfer_path": safe(f"asset_{key}", lambda s=a, t=b: shortest_path(finder, asset_nx, s, t), errors),
        }

    # Native link prediction on sparse label graph.
    result["link_prediction"] = safe(
        "link_prediction",
        lambda: predictor.predict_links(label_nx, top_k=20, exclude_existing=True),
        errors,
    )

    def node2vec_block():
        embedder = NodeEmbedder(method="node2vec", embedding_dimension=64, workers=1, walk_length=30, num_walks=20, epochs=20)
        embeddings = embedder.compute_embeddings(label_nx, ["Label"], ["SEMANTIC_EXPOSURE"])
        sim = SimilarityCalculator()
        scores = {}
        for key, (a, b) in PAIRS.items():
            if a in embeddings and b in embeddings:
                scores[key] = sim.cosine_similarity(embeddings[a], embeddings[b])
        return {"node_count": len(embeddings), "pair_similarity": scores}

    result["node2vec"] = safe("node2vec", node2vec_block, errors)

    if TemporalGraphQuery is not None:
        def temporal_block():
            tq = TemporalGraphQuery(temporal_granularity="day", enable_temporal_reasoning=True)
            baseline = tq.reconstruct_at_time(concept_dict, "2026-02-22")
            august = tq.reconstruct_at_time(concept_dict, "2026-08-31")
            return {
                "baseline_entities": len(baseline.get("entities", [])),
                "baseline_relationships": len(baseline.get("relationships", [])),
                "august_entities": len(august.get("entities", [])),
                "august_relationships": len(august.get("relationships", [])),
            }
        result["temporal"] = safe("temporal", temporal_block, errors)
    else:
        result["temporal"] = None

    # Regression gate: factual V4.2 contract + expected native path behaviour.
    edge = {frozenset((a, b)): {"proximity": p, "cross_impl": ci} for a, b, p, _, _, ci, _ in SEMANTIC_EDGES}
    rules = {
        "cycling_to_veloroute": {"min_p": 0.95, "min_cross": 100, "target_impl": 0, "asset_path": True},
        "camping_to_hiking": {"min_p": 0.90, "max_cross": 0, "target_impl": 0, "concept_path": True, "asset_path": False},
        "cycling_to_mobility": {"min_p": 0.85, "max_cross": 0, "asset_path": False},
        "fitness_to_running": {"min_p": 0.80, "max_cross": 0, "asset_path": False},
    }
    id_to_label = {v["id"]: v for v in LABELS.values()}
    reg = {}
    for key, (a, b) in PAIRS.items():
        facts = edge[frozenset((a, b))]
        rule = rules[key]
        checks = {"proximity": facts["proximity"] >= rule["min_p"]}
        if "min_cross" in rule:
            checks["cross_impl"] = facts["cross_impl"] >= rule["min_cross"]
        if "max_cross" in rule:
            checks["cross_impl"] = facts["cross_impl"] <= rule["max_cross"]
        if "target_impl" in rule:
            checks["target_direct_impl"] = id_to_label[b]["implemented"] == rule["target_impl"]
        if "concept_path" in rule:
            checks["concept_path"] = bool(result["paths"][key]["concept_path"]) == rule["concept_path"]
        checks["asset_transfer_path"] = bool(result["paths"][key]["asset_transfer_path"]) == rule["asset_path"]
        reg[key] = {"checks": checks, "pass": all(checks.values())}
    result["v42_regression"] = reg
    result["all_v42_regressions_pass"] = all(v["pass"] for v in reg.values())
    result["global_guardrail"] = {"spillover_is_global": False, "bridge_vs_distant_presence_differential_pp": 0.47}
    result["errors"] = errors

    result = serialize(result)
    (OUT / "native_results.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "# Decathlon native Semantica validation v2",
        "",
        f"Semantica: **{result['semantica'].get('version', 'unknown')}**",
        f"V4.2 regression gate: **{'PASS' if result['all_v42_regressions_pass'] else 'FAIL'}**",
        "",
        "## Paths",
    ]
    for key, paths in result["paths"].items():
        lines.append(f"- **{key}** — concept: `{paths['concept_path']}` — asset: `{paths['asset_transfer_path']}`")
    lines += ["", "## Source overlap (Jaccard of top source domains)"]
    for key, score in result["source_overlap"].items():
        lines.append(f"- {key}: **{score:.3f}**" if score is not None else f"- {key}: n/a")
    lines += ["", "## Optional/native errors"]
    if result["errors"]:
        for key, msg in result["errors"].items():
            lines.append(f"- `{key}`: {msg}")
    else:
        lines.append("- None")
    (OUT / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({
        "semantica": result["semantica"],
        "v42_pass": result["all_v42_regressions_pass"],
        "paths": result["paths"],
        "source_overlap": result["source_overlap"],
        "errors": result["errors"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
