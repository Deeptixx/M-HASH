"""
Compromise propagation simulation.
Starts at a compromised package and walks UP the dependency graph
(since edges point dependent -> dependency) in BFS layers, producing
a T0..Tn timeline exactly like the spec's demo flow.
"""
import networkx as nx

def simulate_compromise(g: nx.DiGraph, pkg_id: str) -> dict:
    if pkg_id not in g:
        return {"error": f"Unknown package: {pkg_id}"}

    rev = g.reverse(copy=False)  # now edges point dependency -> dependent, so BFS walks downstream impact
    layers: list[list[str]] = []
    visited = {pkg_id}
    frontier = [pkg_id]
    layers.append(frontier)

    while frontier:
        next_frontier = []
        for node in frontier:
            for neighbor in rev.successors(node):
                if neighbor not in visited:
                    visited.add(neighbor)
                    next_frontier.append(neighbor)
        if next_frontier:
            layers.append(next_frontier)
        frontier = next_frontier

    timeline = []
    for t, layer in enumerate(layers):
        entries = []
        for node_id in layer:
            node = g.nodes[node_id]
            entries.append({
                "id": node_id,
                "name": node["name"],
                "type": node.get("type", "unknown"),
                "criticality": node.get("criticality"),
            })
        timeline.append({"t": t, "label": f"T{t}", "nodes": entries})

    affected_apps = [
        {"id": n, "name": g.nodes[n].get("name", n), "criticality": g.nodes[n].get("criticality")}
        for n in visited if g.nodes[n].get("type") == "application"
    ]
    affected_services = [n for n in visited if g.nodes[n].get("type") == "service"]
    affected_packages = [n for n in visited if g.nodes[n].get("type") == "package"]
    critical_apps = [a for a in affected_apps if a["criticality"] == "critical"]

    # propagation paths: package -> ... -> each affected application (for path visualization)
    paths = []
    for app in affected_apps:
        try:
            path = nx.shortest_path(rev, source=pkg_id, target=app["id"])
            paths.append({
                "application": app["name"],
                "path": [{"id": n, "name": g.nodes[n].get("name", n), "type": g.nodes[n].get("type")} for n in path],
            })
        except nx.NetworkXNoPath:
            continue

    return {
        "compromised_package": {"id": pkg_id, "name": g.nodes[pkg_id].get("name", pkg_id)},
        "timeline": timeline,
        "propagation_depth": len(layers) - 1,
        "affected_applications": affected_apps,
        "critical_applications": critical_apps,
        "affected_services_count": len(affected_services),
        "affected_packages_count": len(affected_packages) - 1,  # exclude the compromised pkg itself
        "total_blast_radius": len(affected_apps),
        "propagation_paths": paths,
        "highlighted_node_ids": list(visited),  # for frontend graph highlighting
    }