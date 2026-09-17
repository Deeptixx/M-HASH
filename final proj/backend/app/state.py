"""
In-memory ecosystem store for the MVP — no DB needed.
Holds the currently loaded ecosystem + its built graph so route handlers
don't have to rebuild/reload on every request.
"""
import networkx as nx
from app.models import Ecosystem
from app.data.loader import load_builtin
from app.engine.graph_engine import build_graph

class EcosystemState:
    def __init__(self):
        self.ecosystem: Ecosystem | None = None
        self.graph: nx.DiGraph | None = None

    def load_builtin(self):
        self.ecosystem = load_builtin()
        self.graph = build_graph(self.ecosystem)

    def load_custom(self, ecosystem: Ecosystem):
        self.ecosystem = ecosystem
        self.graph = build_graph(ecosystem)

    def ensure_loaded(self):
        if self.ecosystem is None:
            self.load_builtin()

# single shared instance used across the app (fine for a local prototype)
state = EcosystemState()