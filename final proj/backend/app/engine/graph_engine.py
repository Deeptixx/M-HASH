"""
Builds a NetworkX DiGraph from the ecosystem and computes structural metrics
used by the risk engine: downstream reach, propagation depth, centrality,
and critical-application exposure.
"""
import networkx as nx
from app.models import Ecosystem

def build_graph(eco: Ecosystem) -> nx.DiGraph:
    g = nx.DiGraph()
    for n in eco.nodes:
        g.add_node(n.id, **n.model_dump())
    for e in eco.edges:
        g.add_edge(e.source, e.target)
    return g

def upstream_dependents(g: nx.DiGraph, node_id: str) -> set[str]:
    """All nodes that (transitively) depend ON node_id — i.e. everything
    that would be affected if node_id is compromised. Since edges point
    dependent -> dependency, this is the set of ancestors."""
    if node_id not in g:
        return set()
    return nx.ancestors(g, node_id)

def affected_applications(g: nx.DiGraph, node_id: str) -> list[str]:
    deps = upstream_dependents(g, node_id)
    return [n for n in deps if g.nodes[n].get("type") == "application"]

def propagation_depth(g: nx.DiGraph, node_id: str) -> int:
    """Longest shortest path (in the reversed graph) from node_id up to
    any application — represents how many hops the compromise must travel."""
    if node_id not in g:
        return 0
    rev = g.reverse(copy=False)
    lengths = nx.single_source_shortest_path_length(rev, node_id)
    app_lengths = [
        dist for n, dist in lengths.items()
        if g.nodes[n].get("type") == "application"
    ]
    return max(app_lengths) if app_lengths else 0

def centrality_scores(g: nx.DiGraph) -> dict[str, float]:
    """Betweenness centrality restricted to package nodes — approximates
    how structurally load-bearing a package is across many dependency chains."""
    return nx.betweenness_centrality(g)

def num_dependency_chains(g: nx.DiGraph, node_id: str) -> int:
    """Rough count of distinct simple paths from any application down to
    node_id, capped for performance."""
    apps = [n for n, d in g.nodes(data=True) if d.get("type") == "application"]
    count = 0
    for app in apps:
        try:
            paths = list(nx.all_simple_paths(g, source=app, target=node_id, cutoff=6))
            count += len(paths)
        except nx.NodeNotFound:
            continue
        if count > 200:  # safety cap
            break
    return count