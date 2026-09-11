"""
Interpretable, explainable risk scoring for every package node.
No black-box model — every factor is named and weighted, and the
explanation is generated directly from the same factors.
"""
import networkx as nx
from app.engine.graph_engine import (
    affected_applications, propagation_depth, centrality_scores,
)

REPLACEABILITY_PENALTY = {"low": 1.0, "medium": 0.6, "high": 0.3}

WEIGHTS = {
    "severity": 0.25,
    "reach": 0.25,
    "critical_exposure": 0.25,
    "propagation": 0.15,
    "centrality": 0.10,
}

def _normalize(value: float, max_value: float) -> float:
    if max_value <= 0:
        return 0.0
    return min(value / max_value, 1.0)

def score_package(g: nx.DiGraph, pkg_id: str, centrality: dict[str, float],
                   max_reach: int, max_centrality: float) -> dict:
    node = g.nodes[pkg_id]
    severity = node.get("severity", 0)  # 0-10
    apps_affected = affected_applications(g, pkg_id)
    critical_apps = [a for a in apps_affected if g.nodes[a].get("criticality") == "critical"]
    depth = propagation_depth(g, pkg_id)
    cscore = centrality.get(pkg_id, 0.0)
    replaceability = node.get("replaceability", "medium")

    severity_n = _normalize(severity, 10)
    reach_n = _normalize(len(apps_affected), max(max_reach, 1))
    critical_n = _normalize(len(critical_apps), max(len(apps_affected), 1)) if apps_affected else 0.0
    propagation_n = _normalize(depth, 5)
    centrality_n = _normalize(cscore, max(max_centrality, 1e-9))
    lockin_n = REPLACEABILITY_PENALTY.get(replaceability, 0.6)

    raw = (
        WEIGHTS["severity"] * severity_n
        + WEIGHTS["reach"] * reach_n
        + WEIGHTS["critical_exposure"] * critical_n
        + WEIGHTS["propagation"] * propagation_n
        + WEIGHTS["centrality"] * centrality_n
    )
    # lock-in acts as a mild multiplier (0.85x - 1.1x) rather than a full weight,
    # so it nudges score without dominating it
    lockin_multiplier = 0.85 + 0.25 * lockin_n
    score_0_100 = round(min(raw * lockin_multiplier, 1.0) * 100, 1)

    confidence = round(0.6 + 0.4 * _normalize(len(apps_affected), 10), 2)  # more data -> more confidence

    reasons = _build_explanation(
        node["name"], severity, apps_affected, critical_apps, depth, cscore, replaceability
    )

    return {
        "package_id": pkg_id,
        "name": node["name"],
        "version": node.get("version"),
        "risk_score": score_0_100,
        "blast_radius": len(apps_affected),
        "critical_app_count": len(critical_apps),
        "propagation_depth": depth,
        "centrality": round(cscore, 4),
        "replaceability": replaceability,
        "confidence": confidence,
        "affected_applications": apps_affected,
        "critical_applications": critical_apps,
        "reasons": reasons,
    }

def _build_explanation(name, severity, apps_affected, critical_apps, depth, cscore, replaceability) -> list[str]:
    reasons = []
    if severity >= 7:
        reasons.append(f"High vulnerability severity ({severity}/10)")
    elif severity >= 4:
        reasons.append(f"Moderate vulnerability severity ({severity}/10)")
    else:
        reasons.append(f"Low vulnerability severity ({severity}/10) — risk is structural, not vulnerability-driven")

    reasons.append(f"Used by {len(apps_affected)} application(s) across the ecosystem")

    if critical_apps:
        reasons.append(f"Used by {len(critical_apps)} critical application(s)")

    reasons.append(f"Compromise can propagate through {depth} dependency level(s)")

    if cscore > 0.05:
        reasons.append("High dependency centrality — sits on many paths between applications and packages")

    if replaceability == "low":
        reasons.append("Low replaceability — difficult to swap out without affecting dependents")
    elif replaceability == "medium":
        reasons.append("Moderate replaceability")

    return reasons

def score_all_packages(g: nx.DiGraph) -> list[dict]:
    centrality = centrality_scores(g)
    package_ids = [n for n, d in g.nodes(data=True) if d.get("type") == "package"]

    reach_cache = {pid: len(affected_applications(g, pid)) for pid in package_ids}
    max_reach = max(reach_cache.values()) if reach_cache else 1
    max_centrality = max((centrality.get(pid, 0) for pid in package_ids), default=1e-9)

    results = [
        score_package(g, pid, centrality, max_reach, max_centrality)
        for pid in package_ids
    ]
    results.sort(key=lambda r: r["risk_score"], reverse=True)
    return results