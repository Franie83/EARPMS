
import json, os
from pathlib import Path
from werkzeug.security import generate_password_hash
from . import db
from .models import Record, Credential, AuditEvent

RESOURCES = {
    # Quick Access seed only. Business/application records are never recreated
    # automatically on restart or update.
    "users": "INITIAL_USERS",
}

def seed_if_empty():
    # Seed only a genuinely new database. AuditEvent is deliberately checked too:
    # the application supports permanent deletion/archival, so an empty Record table
    # does NOT mean the database should silently resurrect demo data on restart.
    if Record.query.first() or AuditEvent.query.first():
        return
    data=json.loads((Path(__file__).resolve().parents[1]/"seed.json").read_text(encoding="utf-8"))
    for resource, key in RESOURCES.items():
        rows=data.get(key)
        if isinstance(rows, dict): rows=[rows]
        for index, row in enumerate(rows or []):
            # Some singleton configuration records intentionally have no application id.
            # Give every persisted record a stable synthetic key so SQLite/PostgreSQL
            # share the same storage contract without mutating the original payload.
            record_id = row.get("id") if isinstance(row, dict) else None
            if not record_id:
                record_id = f"{resource}-{index + 1}"
            db.session.add(Record(id=record_id, resource=resource, payload=row))
    db.session.commit()
    db.session.add(AuditEvent(actor='system', action='SEED', entity_type='system', entity_id='initial-seed', description='Initial EARPMS seed data loaded.'))
    db.session.commit()
    default=os.getenv("DEMO_PASSWORD", "ChangeMe!2026")
    for u in data.get("INITIAL_USERS", []):
        db.session.add(Credential(user_id=u["id"], password_hash=generate_password_hash(default)))
    db.session.commit()
