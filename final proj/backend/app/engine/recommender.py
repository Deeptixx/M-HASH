"""
Deterministic intervention optimizer.
Does NOT simply pick lowest residual risk — scores each strategy on a
weighted combination of risk reduction, critical-app protection, and
operational disruption, then explains the choice.
"""

RECOMMEND_WEIGHTS = {
    "risk_reduction": 0.35,
    "critical_protection": 0.30,
    "disruption_penalty": 0.40,
}

def _score_strategy(evaluation: dict, base_risk: float, base_critical: int) -> float:
    risk_reduction_n = evaluation["risk_reduction_pct"] / 100
    critical_protection_n = (
        1 - (evaluation["critical_apps_exposed"] / base_critical) if base_critical > 0 else 1.0
    )
    disruption_penalty_n = evaluation["disruption_score"] / 10  # 0-1, higher = worse

    return (
        RECOMMEND_WEIGHTS["risk_reduction"] * risk_reduction_n
        + RECOMMEND_WEIGHTS["critical_protection"] * critical_protection_n
        - RECOMMEND_WEIGHTS["disruption_penalty"] * disruption_penalty_n
    )

def recommend_intervention(evaluations: list[dict], base_risk: float, base_critical: int) -> dict:
    candidates = [e for e in evaluations if e["strategy"] != "do_nothing"]
    scored = [
        (_score_strategy(e, base_risk, base_critical), e) for e in candidates
    ]
    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, best = scored[0]

    reasons = [
        f"Reduces ecosystem risk by {best['risk_reduction_pct']}% "
        f"({base_risk} → {best['residual_risk']})",
    ]
    if best["critical_apps_exposed"] == 0 and base_critical > 0:
        reasons.append(f"Protects all {base_critical} critical application(s) from exposure")
    elif base_critical > 0:
        reasons.append(
            f"Reduces critical application exposure from {base_critical} to {best['critical_apps_exposed']}"
        )
    reasons.append(f"Operational disruption kept at '{best['disruption']}' level")
    reasons.append(f"Estimated effort: {best['effort']} ({best['time_estimate']})")

    # comparison note vs the most aggressive option, to justify why not just "lowest risk wins"
    lowest_risk = min(candidates, key=lambda e: e["residual_risk"])
    if lowest_risk["strategy"] != best["strategy"]:
        reasons.append(
            f"'{lowest_risk['label']}' achieves lower residual risk "
            f"({lowest_risk['residual_risk']}) but at '{lowest_risk['disruption']}' disruption — "
            f"not the safest practical trade-off"
        )

    return {
        "recommended_strategy": best["strategy"],
        "recommended_label": best["label"],
        "optimizer_score": round(best_score, 3),
        "reasons": reasons,
        "full_evaluation": best,
        "all_scores": [
            {"strategy": e["strategy"], "label": e["label"], "score": round(s, 3)}
            for s, e in scored
        ],
    }