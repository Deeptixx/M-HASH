"""
FastAPI routes for DependLock.
Flow mirrors the spec: ecosystem -> risk -> simulate -> mitigate -> recommend -> before/after.
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from state import state
from backend.app.models import Ecosystem, SimulateRequest, MitigationRequest
from app.data.loader import load_from_json_bytes
from app.engine.risk_engine import score_all_packages
from app.engine.simulation_engine import simulate_compromise
from app.engine.mitigation_engine import evaluate_all_strategies
from app.engine.recommender import recommend_intervention

app = FastAPI(title="DependLock API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local prototype only
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    state.ensure_loaded()


@app.get("/api/ecosystem")
def get_ecosystem():
    state.ensure_loaded()
    return state.ecosystem


@app.post("/api/ecosystem/upload")
async def upload_ecosystem(file: UploadFile = File(...)):
    raw = await file.read()
    try:
        eco = load_from_json_bytes(raw)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid ecosystem JSON: {e}")
    state.load_custom(eco)
    return {"status": "loaded", "nodes": len(eco.nodes), "edges": len(eco.edges)}


@app.post("/api/ecosystem/reset")
def reset_ecosystem():
    state.load_builtin()
    return {"status": "reset to builtin sample"}


@app.get("/api/risk/packages")
def get_all_package_risk():
    state.ensure_loaded()
    return score_all_packages(state.graph)


@app.get("/api/risk/packages/{package_id}")
def get_package_risk(package_id: str):
    state.ensure_loaded()
    results = score_all_packages(state.graph)
    match = next((r for r in results if r["package_id"] == package_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Package not found")
    return match


@app.get("/api/risk/hotspots")
def get_hotspots(limit: int = 10):
    state.ensure_loaded()
    return score_all_packages(state.graph)[:limit]


@app.post("/api/simulate")
def simulate(req: SimulateRequest):
    state.ensure_loaded()
    result = simulate_compromise(state.graph, req.package_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/api/mitigation/evaluate")
def evaluate_mitigations(req: MitigationRequest):
    state.ensure_loaded()
    risk_results = score_all_packages(state.graph)
    pkg_risk = next((r for r in risk_results if r["package_id"] == req.package_id), None)
    if not pkg_risk:
        raise HTTPException(status_code=404, detail="Package not found")

    strategies = evaluate_all_strategies(
        base_risk=pkg_risk["risk_score"],
        blast_radius=pkg_risk["blast_radius"],
        critical_app_count=pkg_risk["critical_app_count"],
    )
    recommendation = recommend_intervention(
        strategies, pkg_risk["risk_score"], pkg_risk["critical_app_count"]
    )

    return {
        "package": pkg_risk,
        "strategies": strategies,
        "recommendation": recommendation,
    }


@app.get("/api/resilience/before-after")
def before_after(package_id: str, strategy: str):
    """Compares ecosystem state before vs after applying a chosen strategy."""
    state.ensure_loaded()
    risk_results = score_all_packages(state.graph)
    pkg_risk = next((r for r in risk_results if r["package_id"] == package_id), None)
    if not pkg_risk:
        raise HTTPException(status_code=404, detail="Package not found")

    strategies = evaluate_all_strategies(
        base_risk=pkg_risk["risk_score"],
        blast_radius=pkg_risk["blast_radius"],
        critical_app_count=pkg_risk["critical_app_count"],
    )
    after = next((s for s in strategies if s["strategy"] == strategy), None)
    if not after:
        raise HTTPException(status_code=404, detail="Unknown strategy")

    concentration_before = "High" if pkg_risk["blast_radius"] >= 10 else "Medium" if pkg_risk["blast_radius"] >= 4 else "Low"
    concentration_after = "High" if after["affected_applications"] >= 10 else "Medium" if after["affected_applications"] >= 4 else "Low"

    return {
        "before": {
            "risk": pkg_risk["risk_score"],
            "affected_applications": pkg_risk["blast_radius"],
            "critical_applications": pkg_risk["critical_app_count"],
            "dependency_concentration": concentration_before,
        },
        "after": {
            "risk": after["residual_risk"],
            "affected_applications": after["affected_applications"],
            "critical_applications": after["critical_apps_exposed"],
            "dependency_concentration": concentration_after,
        },
    }


@app.get("/api/dashboard/summary")
def dashboard_summary():
    state.ensure_loaded()
    risk_results = score_all_packages(state.graph)
    apps = [n for n, d in state.graph.nodes(data=True) if d["type"] == "application"]
    critical_apps = [a for a in apps if state.graph.nodes[a].get("criticality") == "critical"]
    needs_action = [r for r in risk_results if r["risk_score"] >= 60]
    highest_blast = max(risk_results, key=lambda r: r["blast_radius"]) if risk_results else None

    return {
        "ecosystem_risk": round(sum(r["risk_score"] for r in risk_results) / len(risk_results), 1) if risk_results else 0,
        "critical_dependencies": len(needs_action),
        "total_applications": len(apps),
        "critical_applications": len(critical_apps),
        "highest_blast_radius": highest_blast["blast_radius"] if highest_blast else 0,
        "highest_blast_radius_package": highest_blast["name"] if highest_blast else None,
        "dependencies_requiring_action": len(needs_action),
    }