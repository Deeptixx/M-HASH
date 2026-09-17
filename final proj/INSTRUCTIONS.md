# DependLock — Instructions & Demo Guide

> **Dependency Exit Intelligence for Engineering Teams**  
> DependLock analyses your software dependency graph, scores vendor lock-in, simulates zero-day compromises, and recommends migration strategies — all in a real-time visual dashboard.

---

## Table of Contents
1. [What is DependLock?](#what-is-dependlock)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [API Reference](#api-reference)
6. [Uploading Custom Ecosystems](#uploading-custom-ecosystems)
7. [Sample Datasets](#sample-datasets)
8. [1-Minute Demo Script](#1-minute-demo-script)

---

## What is DependLock?

DependLock maps your entire dependency graph — applications → services → packages — and answers three critical questions:

1. **If this package is compromised, what breaks?** (Blast Radius Simulation)
2. **How trapped are we?** (Lock-in Score + Exit Cost)
3. **What should we do about it?** (Mitigation Planner with Before/After comparison)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | ≥ 3.11 | Backend runtime |
| Node.js | ≥ 18 | Frontend runtime |
| npm | ≥ 9 | Package manager |
| pip | latest | Python packages |

---

## Getting Started

### 1 — Backend (FastAPI)

```bash
# Clone the repo
git clone <your-repo-url>
cd M-HASH

# Create and activate a virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate          # macOS / Linux
# venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Start the API server (runs on http://localhost:8000)
python run.py
```

The backend auto-loads the built-in sample dataset on startup. Visit http://localhost:8000/docs for the interactive Swagger API explorer.

### 2 — Frontend (React + Vite)

Open a **new terminal tab**:

```bash
cd M-HASH/frontend

# Install Node dependencies
npm install

# Start the dev server (runs on http://localhost:5173)
npm run dev
```

Open http://localhost:5173 in your browser.

### 3 — Terminal Monitor (Optional)

For a live CLI view of backend stats and traffic:

```bash
cd M-HASH
source backend/venv/bin/activate
pip install rich requests   # one-time
python cli/dependlock_terminal.py
```
/tmp/dl_venv/bin/pip install rich requests -q 2>/dev/null; /tmp/dl_venv/bin/python /Users/vaibhav/Desktop/M_clone/M-HASH/cli/dependlock_terminal.py(for lower python version)
---

## Project Structure

```
M-HASH/
├── INSTRUCTIONS.md               ← You are here
├── logo.jpg                      ← Brand logo
│
├── backend/
│   ├── run.py                    ← Uvicorn entry point
│   ├── requirements.txt
│   └── app/
│       ├── main.py               ← All FastAPI routes
│       ├── models.py             ← Pydantic request/response models
│       ├── state.py              ← In-memory graph state singleton
│       ├── data/
│       │   ├── loader.py         ← JSON → Ecosystem parser
│       │   ├── sample_dataset.py ← Built-in 10-app, 16-service, 38-pkg graph
│       │   └── ecosystems/       ← Sample upload-able JSON files
│       │       ├── fintech_startup.json
│       │       └── saas_platform.json
│       └── engine/
│           ├── graph_engine.py        ← NetworkX graph helpers (BFS, ancestors)
│           ├── risk_engine.py         ← Risk score: severity × blast × criticality
│           ├── simulation_engine.py   ← BFS compromise propagation (T0→Tn)
│           ├── mitigation_engine.py   ← 4-strategy rule evaluator
│           ├── recommender.py         ← Weighted optimizer (risk + disruption)
│           └── lockin_engine.py       ← Lock-in score + exit cost dimensions
│
├── frontend/
│   ├── index.html                ← Entry point, favicon
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx              ← React root mount
│       ├── App.jsx               ← App shell, header, dark/light toggle, data loading
│       ├── Dashboard.jsx         ← Left/right layout, tab controller
│       ├── theme/
│       │   └── tokens.css        ← All CSS design tokens (dark + light mode)
│       ├── api/
│       │   └── client.js         ← All API call functions (fetch wrappers)
│       └── components/
│           ├── DependencyGraph.jsx     ← D3-force interactive graph canvas
│           ├── PackagesTable.jsx       ← Sortable/filterable all-packages table
│           ├── CriticalHotspots.jsx    ← Top-N risk package list
│           ├── RiskExplainPanel.jsx    ← Per-node risk breakdown
│           ├── LockinPanel.jsx         ← Lock-in score + exit cost dimensions
│           ├── CompromiseSimulator.jsx ← Run/show blast radius simulation
│           └── MitigationComparison.jsx ← Strategy cards, charts, before/after
│
└── cli/
    └── dependlock_terminal.py    ← Rich terminal monitor (live backend stats)
```

---

## API Reference

All endpoints are prefixed `/api`. The backend runs on port **8000**.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ecosystem` | Full graph (nodes + edges) |
| `POST` | `/api/ecosystem/upload` | Upload a custom JSON ecosystem |
| `POST` | `/api/ecosystem/reset` | Reset to built-in sample data |
| `GET` | `/api/risk/packages` | Risk scores for all packages |
| `GET` | `/api/risk/packages/{id}` | Risk score for one package |
| `GET` | `/api/risk/packages/{id}/lockin` | Lock-in score + exit cost |
| `GET` | `/api/risk/hotspots?limit=N` | Top-N highest risk packages |
| `POST` | `/api/simulate` | Simulate compromise propagation |
| `POST` | `/api/mitigation/evaluate` | Evaluate all 4 strategies |
| `GET` | `/api/resilience/before-after` | Before vs after for chosen strategy |
| `GET` | `/api/dashboard/summary` | Ecosystem-level KPIs |

**Risk Score Formula:**
`risk_score = severity × 10 × blast_weight × critical_weight`
where `blast_weight = log(blast_radius + 1) / log(max_blast + 1)` and `critical_weight = 1 + (critical_app_count × 0.2)`

---

## Uploading Custom Ecosystems

The upload format is a JSON file with two arrays:

```json
{
  "nodes": [
    { "id": "app-1", "type": "application", "name": "My App", "criticality": "critical" },
    { "id": "svc-1", "type": "service", "name": "Auth Service" },
    { "id": "pkg-1", "type": "package", "name": "crypto-lib", "version": "1.0.0", "severity": 8, "replaceability": "low" }
  ],
  "edges": [
    { "source": "app-1", "target": "svc-1", "relation": "depends_on" },
    { "source": "svc-1", "target": "pkg-1", "relation": "depends_on" }
  ]
}
```

- **`type`** must be `application`, `service`, or `package`
- **`criticality`**: `critical` or `standard` (applications only)
- **`severity`**: 0–10 integer (packages only)
- **`replaceability`**: `low`, `medium`, or `high` (packages only)

---

## Sample Datasets

Two ready-to-upload JSON files are in `backend/app/data/ecosystems/`:

| File | Description | Highlight |
|------|-------------|-----------|
| `fintech_startup.json` | High-risk fintech stack with tightly coupled auth/payment | Shows dramatic blast radii on crypto/token packages |
| `saas_platform.json` | Modular SaaS with isolated services | Demonstrates lower risk scores and safer migration paths |

---

## 1-Minute Demo Script

> **Format:** Each block shows `[ACTION]` (what to do on screen) and `"NARRATION"` (what to say aloud).

---

### [0:00 – 0:08] Open the Dashboard

**[ACTION]** Open browser to `http://localhost:5173`. The DependLock dashboard loads with the graph visible.

> *"This is DependLock — a dependency exit intelligence tool. What you're looking at is your entire software ecosystem — applications in blue, services in purple, and packages in grey — all connected by their real dependency relationships."*

---

### [0:08 – 0:18] Point Out the Header KPIs

**[ACTION]** Gesture toward the header stats (Ecosystem Risk, Needs Action, Max Blast).

> *"At the top, you can see the ecosystem is sitting at a risk score of around 52, with 8 packages that need immediate action. The highest blast radius right now is 8 applications — meaning one package going down takes out 8 of your apps."*

---

### [0:18 – 0:28] Select a High-Risk Package

**[ACTION]** Click the `crypto-lib` node (grey hexagon) in the graph, or switch to the All Packages tab and click `crypto-lib` from the table.

> *"Let's click into crypto-lib — it scores 78 on risk. Over here in the right panel, you can see it's used by 3 services and reaches 6 of our 10 applications, including 4 critical ones. The lock-in score is Very High at 81 out of 100."*

---

### [0:28 – 0:40] Run Compromise Simulation

**[ACTION]** Scroll down in the right panel to the Compromise Simulation card. Click ⚡ Simulate Compromise.

> *"Now watch what happens when we simulate a zero-day on this package. The timeline unfolds — T0 is the package itself, T1 is the three auth services that depend on it, and by T2 we have hit 6 applications including the Auth Portal and Payments App — that's your most critical infrastructure, gone."*

---

### [0:40 – 0:52] Mitigation Planner + Before/After

**[ACTION]** Scroll down to the Intervention Planner. Point to the strategy cards. Click Gradual Migration. The Before vs After comparison appears.

> *"DependLock does not just show you the problem — it shows you the fix. The recommender suggests Gradual Migration, which reduces risk by 74% while keeping disruption at Medium. If you compare before versus after, you go from risk 78 down to 20, and you reduce critical app exposure from 4 down to 0."*

---

### [0:52 – 1:00] Implement Changes + Upload Ecosystem

**[ACTION]** Click the Implement Changes button. Then click Reset Sample or show the Upload Ecosystem button.

> *"You can mark that decision as applied — DependLock tracks it and shows you an undo path. And if you want to analyse your own stack, just drop in a JSON file describing your nodes and edges, and the entire analysis re-runs in real time. That's DependLock."*

---

> **Tip for live demos:** Use `fintech_startup.json` from `backend/app/data/ecosystems/` — it has a more dramatic blast radius that lands well in presentations.
