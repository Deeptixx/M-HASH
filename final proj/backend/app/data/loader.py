import json
from app.data.sample_dataset import get_sample_ecosystem
from app.models import Ecosystem

def load_builtin() -> Ecosystem:
    return Ecosystem(**get_sample_ecosystem())

def load_from_json_bytes(raw: bytes) -> Ecosystem:
    data = json.loads(raw)
    return Ecosystem(**data)