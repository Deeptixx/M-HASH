"""
Lock-in Engine: computes how structurally trapped the ecosystem is
on a given package — separate from vulnerability severity.
Lock-in is about structural dependency, not security posture.
"""
import networkx as nx
from app.engine.graph_engine import affected_applications, upstream_dependents


LOCKIN_THRESHOLDS = {
    "very_high": 75,
    "high": 50,
    "medium": 25,
}


def _lockin_level(score: float) -> str:
    if score >= LOCKIN_THRESHOLDS["very_high"]:
        return "VERY HIGH"
    if score >= LOCKIN_THRESHOLDS["high"]:
        return "HIGH"
    if score >= LOCKIN_THRESHOLDS["medium"]:
        return "MEDIUM"
    return "LOW"


def compute_lockin(g: nx.DiGraph, pkg_id: str) -> dict:
    """
    Lock-in score 0-100 based on:
      - Dependency concentration (blast radius as % of total apps)
      - Internal coupling (service count in affected nodes)
      - Replaceability (low=bad, high=good)
      - Centrality contribution
    """
    if pkg_id not in g:
        return {"error": f"Unknown package: {pkg_id}"}

    node = g.nodes[pkg_id]
    all_apps = [n for n, d in g.nodes(data=True) if d.get("type") == "application"]
    all_svcs = [n for n, d in g.nodes(data=True) if d.get("type") == "service"]

    affected = upstream_dependents(g, pkg_id)
    apps_hit = [n for n in affected if g.nodes[n].get("type") == "application"]
    svcs_hit = [n for n in affected if g.nodes[n].get("type") == "service"]
    critical_hit = [a for a in apps_hit if g.nodes[a].get("criticality") == "critical"]

    # Factor 1: concentration — how much of the app fleet depends on this pkg
    concentration_n = len(apps_hit) / max(len(all_apps), 1)

    # Factor 2: internal coupling — services coupling amplifies lock-in
    coupling_n = len(svcs_hit) / max(len(all_svcs), 1)

    # Factor 3: replaceability
    rep = node.get("replaceability", "medium")
    rep_penalty = {"low": 1.0, "medium": 0.5, "high": 0.1}.get(rep, 0.5)

    # Factor 4: critical exposure ratio
    critical_n = len(critical_hit) / max(len(apps_hit), 1) if apps_hit else 0

    raw = (
        0.35 * concentration_n
        + 0.20 * coupling_n
        + 0.25 * rep_penalty
        + 0.20 * critical_n
    )
    score = round(min(raw, 1.0) * 100, 1)
    level = _lockin_level(score)

    # Explain factors
    factors = {
        "concentration": {
            "value": len(apps_hit),
            "of_total": len(all_apps),
            "pct": round(concentration_n * 100),
            "label": f"{len(apps_hit)} of {len(all_apps)} applications depend on this package",
        },
        "internal_coupling": {
            "value": len(svcs_hit),
            "of_total": len(all_svcs),
            "pct": round(coupling_n * 100),
            "label": f"{len(svcs_hit)} internal services are coupled to this package",
        },
        "replaceability": {
            "value": rep,
            "label": {
                "low": "Difficult to replace — few functional alternatives exist",
                "medium": "Moderate replacement effort required",
                "high": "Easy to swap — multiple compatible alternatives available",
            }.get(rep, "Unknown"),
        },
        "critical_exposure": {
            "value": len(critical_hit),
            "label": f"{len(critical_hit)} business-critical applications exposed",
        },
    }

    return {
        "package_id": pkg_id,
        "name": node.get("name", pkg_id),
        "lockin_score": score,
        "lockin_level": level,
        "factors": factors,
    }


def compute_exit_cost(g: nx.DiGraph, pkg_id: str) -> dict:
    """
    Breaks down exit cost into 4 dimensions, each rated Low/Medium/High.
    Derived entirely from existing graph data — no new inputs needed.
    """
    if pkg_id not in g:
        return {"error": f"Unknown package: {pkg_id}"}

    node = g.nodes[pkg_id]
    affected = upstream_dependents(g, pkg_id)
    apps_hit = [n for n in affected if g.nodes[n].get("type") == "application"]
    svcs_hit = [n for n in affected if g.nodes[n].get("type") == "service"]
    critical_hit = [a for a in apps_hit if g.nodes[a].get("criticality") == "critical"]

    rep = node.get("replaceability", "medium")
    blast = len(apps_hit)
    crit = len(critical_hit)
    svcs = len(svcs_hit)

    # Migration effort — driven by replaceability + blast
    if rep == "low" or blast >= 7:
        migration_effort = "High"
        migration_note = "Many dependents plus low replaceability make migration complex and error-prone"
    elif rep == "medium" or blast >= 3:
        migration_effort = "Medium"
        migration_note = "Moderate dependents; migration is feasible but requires careful coordination"
    else:
        migration_effort = "Low"
        migration_note = "Few dependents and good alternatives make migration straightforward"

    # Testing effort — driven by blast + critical count
    if blast >= 6 or crit >= 3:
        testing_effort = "High"
        testing_note = f"Regression testing required across {blast} apps ({crit} critical)"
    elif blast >= 3 or crit >= 1:
        testing_effort = "Medium"
        testing_note = f"Integration tests needed for {blast} affected applications"
    else:
        testing_effort = "Low"
        testing_note = "Limited downstream impact; targeted tests sufficient"

    # Disruption risk — driven by critical apps + services
    if crit >= 4 or svcs >= 4:
        disruption = "High"
        disruption_note = f"{crit} critical apps and {svcs} services create significant outage risk during transition"
    elif crit >= 1 or svcs >= 2:
        disruption = "Medium"
        disruption_note = f"Partial disruption possible; {crit} critical apps require careful cutover"
    else:
        disruption = "Low"
        disruption_note = "Transition can be managed with minimal service impact"

    # Replacement availability — inverse of replaceability difficulty
    rep_map = {
        "high": ("High", "Multiple well-maintained alternatives are readily available"),
        "medium": ("Medium", "Some alternatives exist but require evaluation and adaptation"),
        "low": ("Low", "Few compatible alternatives; custom development may be needed"),
    }
    rep_avail, rep_note = rep_map.get(rep, ("Medium", ""))

    def _score(level: str) -> int:
        return {"Low": 1, "Medium": 2, "High": 3}.get(level, 2)

    overall_score = (
        _score(migration_effort) + _score(testing_effort)
        + _score(disruption) + (4 - _score(rep_avail))  # inverted — more availability = lower cost
    )
    overall = "Very High" if overall_score >= 10 else "High" if overall_score >= 7 else "Medium" if overall_score >= 5 else "Low"

    return {
        "package_id": pkg_id,
        "name": node.get("name", pkg_id),
        "overall_exit_cost": overall,
        "dimensions": {
            "migration_effort": {"rating": migration_effort, "note": migration_note},
            "testing_effort": {"rating": testing_effort, "note": testing_note},
            "disruption_risk": {"rating": disruption, "note": disruption_note},
            "replacement_availability": {"rating": rep_avail, "note": rep_note},
        },
    }
