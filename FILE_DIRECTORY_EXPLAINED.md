# DependLock — Comprehensive Codebase & File Directory Guide

This document provides a complete, file-by-file breakdown of the entire **DependLock (M-HASH)** project. For every single file in the repository, it details **its purpose, what it does, its core functions/components, and how it connects to the rest of the ecosystem.**

---

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Root Configuration & Documentation](#1-root-configuration--documentation)
3. [CLI Layer (`cli/`)](#2-cli-layer-cli)
4. [Backend Service (`backend/`)](#3-backend-service-backend)
   - [Core & Entry Points](#31-core--entry-points)
   - [Data Layer (`backend/app/data/`)](#32-data-layer-backendappdata)
   - [Analysis & Simulation Engines (`backend/app/engine/`)](#33-analysis--simulation-engines-backendappengine)
5. [Frontend Client (`frontend/`)](#4-frontend-client-frontend)
   - [Build & Configuration Files](#41-build--configuration-files)
   - [Entry & Layout Shells](#42-entry--layout-shells)
   - [Styling & Design Tokens](#43-styling--design-tokens)
   - [API Integration](#44-api-integration)
   - [Interactive Dashboard Components (`frontend/src/components/`)](#45-interactive-dashboard-components)
   - [Assets & Icons](#46-assets--icons)
6. [Component Interaction & Data Flow Map](#5-component-interaction--data-flow-map)

---

## System Architecture Overview

DependLock is an **Exit Intelligence & Supply Chain Risk Platform** for enterprise software ecosystems. Rather than simply scanning for known vulnerabilities (CVEs), it analyzes structural dependency graphs to compute:
- **Blast Radius**: How many applications/services break if a package is compromised or deprecated.
- **Concentration Risk**: How centrally load-bearing a single package is across multiple distinct systems.
- **Lock-in & Exit Difficulty**: How hard/costly it is to remove or replace a dependency.
- **Mitigation ROI**: Comparative trade-offs (e.g. Pinning, Forking, Replacing, Isolating).

```
┌─────────────────────────────────────────────────────────────────┐
│                       React Frontend (Vite)                     │
│  Interactive Graph (Canvas), Simulation Sliders, ROI Dashboard  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP / JSON (Port 5173 ↔ 8000)
┌────────────────────────────────▼────────────────────────────────┐
│                       FastAPI Backend                           │
│  app.main ──► app.state (Ecosystem Graph via NetworkX)          │
│                ├── risk_engine.py       (Multi-factor scoring)  │
│                ├── simulation_engine.py (Cascading compromise)  │
│                ├── lockin_engine.py     (Exit cost & friction)  │
│                └── mitigation_engine.py (Strategy simulation)   │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Polling / Status (Port 8000)
┌────────────────────────────────▼────────────────────────────────┐
│                   CLI Monitor (Rich Terminal)                   │
│  ASCII Dashboard, Live API Traffic Logger, Real-time Metrics    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Root Configuration & Documentation

### `INSTRUCTIONS.md`
- **Purpose**: The primary developer manual and project walkthrough.
- **What it does**:
  - Details how to clone, set up virtual environments, install dependencies, and run all three tiers (Backend on port 8000, Frontend on port 5173, and CLI Monitor).
  - Documents all REST API endpoints with request/response examples.
  - Contains a full **60-Second Demo Script** with exact spoken lines and UI click paths for presentations and hackathon pitches.
  - Explains troubleshooting steps (port conflicts, Python version quirks).

### `README.md`
- **Purpose**: GitHub repository landing page and project description.
- **What it does**: Provides a concise overview of DependLock, core problem statements (software supply chain fragility), features, and quickstart commands.

### `.gitignore`
- **Purpose**: Git version control exclusion rules.
- **What it does**: Prevents OS metadata (`.DS_Store`), dependencies (`node_modules/`, `venv/`), compiled Python byte-code (`__pycache__/`, `*.pyc`), and build artifacts (`dist/`) from polluting Git commits.

### `logo.jpg`
- **Purpose**: Primary branding artwork.
- **What it does**: High-resolution project logo featuring the DependLock icon and cyber-security aesthetic, used in documentation and frontend branding.

---

## 2. CLI Layer (`cli/`)

### `cli/dependlock_terminal.py`
- **Purpose**: Standalone terminal user interface (TUI) dashboard for DevOps / Terminal users.
- **What it does**:
  - Uses the `rich` Python library (`rich.live`, `rich.layout`, `rich.table`, `rich.panel`) to render a full-screen interactive console.
  - Displays a large cyan ASCII art banner for **DEPENDLOCK**.
  - Polls `http://localhost:8000` in a background daemon thread to monitor backend health and ecosystem stats (Ecosystem Risk Score, Critical Dependencies, Total Apps, Blast Radius).
  - Logs live HTTP requests and latency in a real-time **Frontend ↔ Backend Traffic** monitor.
  - Provides quick keyboard shortcuts (`[R]` reset, `[U]` upload, `[O]` open browser, `[Q]` quit).

---

## 3. Backend Service (`backend/`)

The backend is built with **FastAPI** and **NetworkX**. It runs as an in-memory directed graph engine for instant recalculations without database latency.

### 3.1 Core & Entry Points

#### `backend/run.py`
- **Purpose**: Convenience launcher for the backend server.
- **What it does**: Imports `uvicorn` and boots `app.main:app` on host `0.0.0.0` and port `8000` with hot-reloading enabled.

#### `backend/requirements.txt`
- **Purpose**: Python package dependencies specification.
- **What it does**: Lists exact required packages:
  - `fastapi` & `uvicorn` (ASGI web framework)
  - `networkx` (graph modeling and path algorithms)
  - `pydantic` (data validation and schemas)
  - `python-multipart` (handling JSON ecosystem file uploads)
  - `rich` & `requests` (CLI terminal interface)

#### `backend/app/__init__.py`
- **Purpose**: Python package initializer.
- **What it does**: Marks `app` as an importable Python module.

#### `backend/app/main.py`
- **Purpose**: Primary FastAPI web server entry point and HTTP route controller.
- **What it does**:
  - Configures CORS middleware for frontend communication (`http://localhost:5173`).
  - Implements all REST endpoints:
    - `GET /api/ecosystem`: Returns nodes and edges of the active graph.
    - `POST /api/ecosystem/upload`: Uploads a custom ecosystem JSON file.
    - `POST /api/ecosystem/reset`: Restores the default built-in dataset.
    - `GET /api/risk/packages`: Returns ranked risk scores for all packages.
    - `GET /api/risk/packages/{id}`: Detailed risk explanation and lock-in breakdown for one package.
    - `GET /api/risk/hotspots`: Top 5 highest risk dependencies.
    - `POST /api/simulation/compromise`: Simulates cascading attack propagation from an infected package.
    - `GET /api/mitigation/strategies`: Evaluates 4 mitigation strategies (Pin, Fork, Replace, Isolate).
    - `GET /api/mitigation/recommendation`: Recommends optimal mitigation strategy based on risk vs. effort.
    - `GET /api/mitigation/compare`: Before/after delta comparison for a given package and strategy.
    - `GET /api/dashboard/summary`: Live KPI summary cards (Ecosystem Risk, Apps, Blast Radius).

#### `backend/app/models.py`
- **Purpose**: Pydantic data schemas and contracts.
- **What it does**: Defines strongly-typed models for:
  - `Node`: Represents an application, microservice, or third-party package (`id`, `name`, `type`, `criticality`, `severity`, `replaceability`).
  - `Edge`: Directed dependency relationship (`source`, `target`).
  - `Ecosystem`: Container for lists of `nodes` and `edges`.
  - `CompromiseRequest`: Input body for attack simulation (`package_id`).
  - `MitigationStrategy`: Strategy profile model.

#### `backend/app/state.py`
- **Purpose**: In-memory global state singleton.
- **What it does**:
  - Holds `EcosystemState` containing `self.ecosystem` and `self.graph` (NetworkX `DiGraph`).
  - Avoids re-parsing JSON files on every request.
  - Offers methods `load_builtin()`, `load_custom()`, and `ensure_loaded()`.

---

### 3.2 Data Layer (`backend/app/data/`)

#### `backend/app/data/loader.py`
- **Purpose**: Serialization and deserialization utility.
- **What it does**:
  - `load_builtin()`: Loads the built-in enterprise ecosystem JSON.
  - `load_from_json_bytes()`: Validates and loads user-uploaded JSON files via Pydantic.

#### `backend/app/data/sample_dataset.py`
- **Purpose**: Algorithmic dataset generator / reference data.
- **What it does**: Contains a pre-built 64-node enterprise ecosystem with 10 critical customer-facing applications (e.g. `checkout-web`, `payment-gateway`, `auth-service`, `fraud-detector`), downstream microservices, and shared open-source libraries (`auth-jwt`, `crypto-core`, `payment-sdk`, `utility-lib`).

#### `backend/app/data/ecosystems/fintech_startup.json`
- **Purpose**: Uploadable sample dataset: High-compliance Fintech environment.
- **What it does**: Contains nodes representing core banking, KYC microservices, payment gateways, and cryptographic hashing dependencies. Useful for testing JSON upload functionality in the UI.

#### `backend/app/data/ecosystems/saas_platform.json`
- **Purpose**: Uploadable sample dataset: Multi-tenant B2B SaaS architecture.
- **What it does**: Contains tenant billing, subscription engines, analytics workers, and distributed queuing libraries.

---

### 3.3 Analysis & Simulation Engines (`backend/app/engine/`)

#### `backend/app/engine/graph_engine.py`
- **Purpose**: Network topology & traversal engine.
- **What it does**:
  - Converts Pydantic ecosystems into NetworkX directed graphs (`DiGraph`).
  - `upstream_dependents(g, node_id)`: Finds all ancestors that depend on a given package.
  - `affected_applications(g, node_id)`: Filters affected nodes to find high-level applications impacted.
  - `propagation_depth(g, node_id)`: Calculates the longest path hops from dependency to top-level app.
  - `centrality_scores(g)`: Computes betweenness centrality to detect hidden architectural bottlenecks.
  - `num_dependency_chains(g, node_id)`: Counts distinct paths leading down to the dependency.

#### `backend/app/engine/risk_engine.py`
- **Purpose**: Multi-factor exit & vulnerability risk calculator.
- **What it does**:
  - Computes a normalized 0–100 risk score for every package based on weighted attributes:
    - **Severity** (40%): Base CVE/defect score.
    - **Downstream Reach / Blast Radius** (25%): Number of applications impacted.
    - **Critical App Exposure** (20%): Exposure of mission-critical systems.
    - **Propagation Depth** (10%): Distance to reach apps.
    - **Centrality** (5%): Betweenness concentration.
    - **Lock-in Multiplier**: Scaled by replaceability penalty (`high`, `medium`, `low`).
  - `score_all_packages()`: Scores and ranks all libraries.
  - `_build_explanation()`: Generates human-readable bullet points explaining *why* a package is risky.

#### `backend/app/engine/simulation_engine.py`
- **Purpose**: Cascading compromise propagation simulator.
- **What it does**:
  - Simulates a zero-day or supply-chain attack starting at a specific dependency.
  - Traverses the graph in reverse breadth-first search (BFS) to identify compromised paths.
  - Calculates percentage of applications compromised and lists exposed critical services.

#### `backend/app/engine/lockin_engine.py`
- **Purpose**: Architectural lock-in & exit cost estimation engine.
- **What it does**:
  - `compute_lockin()`: Calculates proprietary lock-in metrics (API surface complexity, migration difficulty, custom interface entanglement).
  - `compute_exit_cost()`: Estimates engineering hours, financial expense, and business risk required to decouple or migrate away from a package.

#### `backend/app/engine/mitigation_engine.py`
- **Purpose**: Strategy impact evaluator.
- **What it does**:
  - Simulates 4 standard engineering mitigations:
    1. **Pin Version**: Freezes library; zero engineering effort, but residual risk remains.
    2. **Internal Fork**: Takes ownership; high effort, eliminates external supply chain threat.
    3. **Drop-in Replace**: Swaps package for alternative; moderate effort, major risk reduction.
    4. **Architectural Isolation / Facade**: Wraps dependency in an abstraction layer; high upfront effort, maximum long-term resilience.
  - Computes residual risk and ROI for each strategy.

#### `backend/app/engine/recommender.py`
- **Purpose**: Decision matrix recommendation engine.
- **What it does**:
  - Analyzes risk score, blast radius, and lock-in difficulty to recommend the highest-value intervention.
  - Synthesizes an executive takeaway message (e.g. "Isolate behind internal interface immediately due to high blast radius").

---

## 4. Frontend Client (`frontend/`)

Built with **React (JSX)** and **Vite**, featuring an interactive HTML5 Canvas graph, CSS variables for light/dark themes, and real-time dashboard analytics.

### 4.1 Build & Configuration Files

#### `frontend/package.json`
- **Purpose**: NPM dependencies and script definitions.
- **What it does**:
  - Defines scripts: `npm run dev` (starts Vite on port 5173) and `npm run build` (produces production dist).
  - Dependencies include `react`, `react-dom`, `lucide-react` (icons), and `canvas-confetti`.

#### `frontend/package-lock.json`
- **Purpose**: Deterministic lockfile for Node modules.
- **What it does**: Ensures identical dependency trees across installations.

#### `frontend/vite.config.js`
- **Purpose**: Vite bundler configuration.
- **What it does**: Sets up the `@vitejs/plugin-react` plugin and local server dev configuration.

#### `frontend/.oxlintrc.json`
- **Purpose**: Linter configuration file for Oxlint.
- **What it does**: Configures code quality rules and syntax validation for React JSX.

#### `frontend/README.md`
- **Purpose**: Frontend quickstart guide.
- **What it does**: Explains how to install node modules and run the Vite development server.

---

### 4.2 Entry & Layout Shells

#### `frontend/index.html`
- **Purpose**: HTML page skeleton.
- **What it does**:
  - Defines `<div id="root"></div>`.
  - Links to Google Fonts (`Inter` and `JetBrains Mono`).
  - Sets browser tab favicon and title to **DependLock | Dependency Exit Intelligence**.

#### `frontend/src/main.jsx`
- **Purpose**: JavaScript application entry point.
- **What it does**: Mounts `<App />` into the DOM `root` using `ReactDOM.createRoot()`.

#### `frontend/src/App.jsx`
- **Purpose**: Top-level application container and state orchestrator.
- **What it does**:
  - Manages global state: active package selection, dark/light theme mode, active tabs (`Dashboard`, `Simulation`, `Mitigation`, `Lock-in`).
  - Handles JSON dataset upload (`/api/ecosystem/upload`) and dataset reset (`/api/ecosystem/reset`).
  - Renders the global navigation bar, branding logo, ecosystem risk badge, and theme switcher.

#### `frontend/src/App.css`
- **Purpose**: Styling for navigation, header bar, and layout container.
- **What it does**: Provides sticky header styles, logo scaling, status pills, upload buttons, and responsive viewports.

#### `frontend/src/Dashboard.jsx`
- **Purpose**: Central dashboard view layout.
- **What it does**: Organizes dashboard panels into a cohesive grid: KPI summary cards, interactive dependency graph, critical hotspots, and package list table.

#### `frontend/src/Dashboard.css`
- **Purpose**: CSS grid and flexbox layout for dashboard widgets.
- **What it does**: Defines responsive card arrangements, glowing borders, and KPI card typography.

---

### 4.3 Styling & Design Tokens

#### `frontend/src/theme/tokens.css`
- **Purpose**: Design system tokens and dynamic theme variables.
- **What it does**:
  - Implements **Dark Mode** and **Light Mode** palette variables:
    - Backgrounds: `--bg-primary`, `--bg-secondary`, `--bg-card`.
    - Text: `--text-primary`, `--text-muted`.
    - Vibrant Accents: `--sky`, `--violet`, `--rose`, `--amber`, `--emerald`.
    - Risk colors: Critical red (`#ef4444`), Warning amber (`#f59e0b`), Healthy green (`#10b981`).
  - Applies subtle glassmorphism and box-shadow variables.

#### `frontend/src/index.css`
- **Purpose**: Global base styling.
- **What it does**: Imports `tokens.css`, resets browser margins/padding, sets default font families (`Inter`, `JetBrains Mono`), and configures smooth scrolling.

---

### 4.4 API Integration

#### `frontend/src/api/client.js`
- **Purpose**: Centralized HTTP client wrapper.
- **What it does**:
  - Exports clean async helper functions communicating with `http://localhost:8000`:
    - `fetchSummary()`
    - `fetchPackages()`
    - `fetchHotspots()`
    - `fetchPackageDetail(pkgId)`
    - `fetchEcosystem()`
    - `simulateCompromise(pkgId)`
    - `fetchMitigationStrategies()`
    - `fetchRecommendation(pkgId)`
    - `fetchMitigationCompare(pkgId, strategy)`
    - `uploadEcosystem(file)`
    - `resetEcosystem()`

---

### 4.5 Interactive Dashboard Components

#### `frontend/src/components/DependencyGraph.jsx`
- **Purpose**: Hardware-accelerated HTML5 Canvas visualization of the ecosystem dependency graph.
- **What it does**:
  - Renders applications (blue), services (cyan), and packages (amber/red) as nodes with connecting arrows.
  - Implements physics-based node positioning, pan, zoom, click selection, and hover tooltips.
  - Visually highlights cascading compromise paths when a package attack simulation is triggered.

#### `frontend/src/components/CriticalHotspots.jsx`
- **Purpose**: Top risk hotspots card widget.
- **What it does**: Lists the 5 most vulnerable and load-bearing dependencies with quick visual indicators of risk scores, blast radii, and direct "Simulate" action buttons.

#### `frontend/src/components/CompromiseSimulator.jsx`
- **Purpose**: Interactive attack simulator tool.
- **What it does**:
  - Allows the user to select any third-party library and trigger a simulated zero-day breach.
  - Shows real-time counters of affected applications, infected microservices, and exact propagation paths through the graph.

#### `frontend/src/components/MitigationComparison.jsx`
- **Purpose**: Mitigation strategy decision analysis tool.
- **What it does**:
  - Compares the 4 intervention strategies (Pin, Fork, Replace, Isolate) for a selected package.
  - Shows side-by-side risk score reduction, blast radius delta, effort hours, and ROI scores.
  - Features an interactive "Apply Strategy" simulator.

#### `frontend/src/components/LockinPanel.jsx`
- **Purpose**: Architectural lock-in and exit cost inspection panel.
- **What it does**:
  - Calculates dependency replacement difficulty, estimated engineering developer days, and migration cost in dollars.
  - Details architectural coupling metrics (tightly coupled APIs, proprietary hooks).

#### `frontend/src/components/PackagesTable.jsx`
- **Purpose**: Filterable, searchable data grid of all packages.
- **What it does**: Displays table of all libraries with sorting by Risk Score, Blast Radius, Severity, and Critical Exposure. Includes search bar.

#### `frontend/src/components/RiskExplainPanel.jsx`
- **Purpose**: Transparent "Explainable AI / Scoring" drawer.
- **What it does**: Breaks down exactly how a package's risk score was computed (showing percentage weights for severity, reach, criticality, and lock-in penalties).

---

### 4.6 Assets & Icons

#### `frontend/public/logo.png`
- **Purpose**: Scaled web logo in PNG format displayed in the header navigation bar.

#### `frontend/public/favicon.svg`
- **Purpose**: Browser tab favicon icon with the DependLock shield motif.

#### `frontend/public/icons.svg`
- **Purpose**: SVG sprite collection of utility icons (shields, alerts, arrows, checkmarks).

#### `frontend/src/assets/hero.png`
- **Purpose**: Hero graphic used in empty state displays or promotional cards.

#### `frontend/src/assets/react.svg` & `vite.svg`
- **Purpose**: Standard framework badges.

---

## 5. Component Interaction & Data Flow Map

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER ACTION: User selects package in PackagesTable.jsx   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. App.jsx updates active package ID                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ DependencyGraph │   │ MitigationComp  │   │  LockinPanel    │
│ Highlights node │   │ Requests /api/  │   │ Requests /api/  │
│ & downstream    │   │ mitigation/     │   │ risk/packages/  │
│ paths on Canvas │   │ compare         │   │ {id}            │
└─────────────────┘   └────────┬────────┘   └────────┬────────┘
                               │                     │
                               ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. FastAPI backend (app.main) queries:                      │
│    - mitigation_engine.py                                   │
│    - lockin_engine.py                                       │
│    - risk_engine.py                                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CLI Monitor (dependlock_terminal.py) intercepts traffic  │
│    and logs endpoint latency in terminal window.            │
└─────────────────────────────────────────────────────────────┘
```

---

*This document is maintained locally in the repository root (`FILE_DIRECTORY_EXPLAINED.md`) and within `final proj/`.*
