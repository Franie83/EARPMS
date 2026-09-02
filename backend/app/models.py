
from datetime import datetime, timezone
from . import db

class Record(db.Model):
    __tablename__ = "records"
    id = db.Column(db.String(128), primary_key=True)
    resource = db.Column(db.String(64), primary_key=True)
    payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    __table_args__ = (db.Index("ix_records_resource", "resource"),)

class Credential(db.Model):
    __tablename__ = "credentials"
    user_id = db.Column(db.String(128), primary_key=True)
    password_hash = db.Column(db.String(255), nullable=False)
    last_login_at = db.Column(db.DateTime(timezone=True))

class AuditEvent(db.Model):
    __tablename__ = "audit_events"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    actor = db.Column(db.String(128), nullable=False)
    action = db.Column(db.String(64), nullable=False)
    entity_type = db.Column(db.String(128), nullable=False)
    entity_id = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text)
    old_value = db.Column(db.JSON)
    new_value = db.Column(db.JSON)
    ip_address = db.Column(db.String(64))
