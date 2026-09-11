"""
Rule-based mitigation strategy simulator.
Produces deterministic simulated outcomes for each of the four strategies,
given a compromise simulation result and the base risk score of the package.
"""

# Each strategy defines how much it reduces risk, how much disruption it causes,
# and how it treats critical-application exposure. These multipliers are
# intentionally simple and transparent (rule-based, not ML) per spec constraints.
STRATEGY_PROFILES = {
    "do_nothing": {
        "label": "Do Nothing",
        "risk_reduction": 0.0,
        "disruption": "None",
        "disruption_score": 0,
        "critical_exposure_reduction": 0.0,
        "effort": "None",
        "time_estimate": "N/A",
    },
    "patch_isolate": {
        "label": "Patch / Isolate",
        "risk_reduction": 0.55,
        "disruption": "Low",
        "disruption_score": 2,
        "critical_exposure_reduction": 0.75,
        "effort": "Low-Medium",
        "time_estimate": "1-3 days",
    },
    "immediate_replace": {
        "label": "Immediate Replacement",
        "risk_reduction": 0.85,
        "disruption": "High",
        "disruption_score": 8,
        "critical_exposure_reduction": 1.0,
        "effort": "High",
        "time_estimate": "1-2 weeks (rushed)",
    },
    "gradual_migration": {
        "label": "Gradual Migration",
        "risk_reduction": 0.74,
        "disruption": "Medium",
        "disruption_score": 4,
        "critical_exposure_reduction": 1.0,
        "effort": "Medium",
        "time_estimate": "2-4 weeks (staged)",
    },
}

def evaluate_strategy(strategy: str, base_risk: float, blast_radius: int,
                       critical_app_count: int) -> dict:
    profile = STRATEGY_PROFILES[strategy]
    residual_risk = round(base_risk * (1 - profile["risk_reduction"]), 1)
    residual_critical = round(critical_app_count * (1 - profile["critical_exposure_reduction"]))
    # affected apps scale roughly with residual risk fraction
    residual_apps = round(blast_radius * (residual_risk / base_risk)) if base_risk > 0 else blast_radius

    return {
        "strategy": strategy,
        "label": profile["label"],
        "residual_risk": residual_risk,
        "risk_reduction_pct": round(profile["risk_reduction"] * 100),
        "disruption": profile["disruption"],
        "disruption_score": profile["disruption_score"],
        "affected_applications": residual_apps,
        "critical_apps_exposed": residual_critical,
        "effort": profile["effort"],
        "time_estimate": profile["time_estimate"],
    }

def evaluate_all_strategies(base_risk: float, blast_radius: int, critical_app_count: int) -> list[dict]:
    return [
        evaluate_strategy(s, base_risk, blast_radius, critical_app_count)
        for s in STRATEGY_PROFILES.keys()
    ]