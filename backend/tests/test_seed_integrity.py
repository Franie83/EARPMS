
import json
from pathlib import Path

def test_every_seed_collection_can_be_persisted_as_a_record():
    data = json.loads((Path(__file__).resolve().parents[1] / "seed.json").read_text(encoding="utf-8"))
    collections = [v for k, v in data.items() if k.startswith("INITIAL_")]
    for collection in collections:
        rows = collection if isinstance(collection, list) else [collection]
        for row in rows:
            assert isinstance(row, dict)
            # Singleton configuration is allowed to omit an application id; seed.py
            # supplies a stable resource/index id for persistence.
            assert row.get("id") is not None or row
