
from pathlib import Path
import os
import sys

HERE = Path(__file__).resolve().parent
os.chdir(HERE)
sys.path.insert(0, str(HERE))

# SQLite is deliberate for local/integration testing. Production remains PostgreSQL.
os.environ.setdefault("DATABASE_URL", "sqlite:///earpms_test.db")
os.environ.setdefault("TESTING", "true")
os.environ.setdefault("AUTO_CREATE_DB", "true")
os.environ.setdefault("SEED_ON_STARTUP", "true")
os.environ.setdefault("DEMO_MODE", "true")
os.environ.setdefault("SECRET_KEY", "test-secret-key-test-secret-key-test-secret-key")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-test-jwt-secret-key-test")

import pytest

raise SystemExit(pytest.main(["-q", "tests"]))
