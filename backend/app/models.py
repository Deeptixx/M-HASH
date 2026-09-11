from pydantic import BaseModel
from typing import Optional, Literal

NodeType = Literal["application", "service", "package"]

class Node(BaseModel):
    id: str
    type: NodeType
    name: str
    criticality: Optional[str] = None       # for applications: "critical" | "standard"
    version: Optional[str] = None            # for packages
    severity: Optional[int] = None           # 0-10 CVSS-like, for packages
    replaceability: Optional[str] = None     # "low" | "medium" | "high" (ease of swap)

class Edge(BaseModel):
    source: str
    target: str
    relation: Literal["depends_on"] = "depends_on"

class Ecosystem(BaseModel):
    nodes: list[Node]
    edges: list[Edge]

class SimulateRequest(BaseModel):
    package_id: str

class MitigationRequest(BaseModel):
    package_id: str
    strategy: Literal["do_nothing", "patch_isolate", "immediate_replace", "gradual_migration"]