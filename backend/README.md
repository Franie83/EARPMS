
# EARPMS Flask Production Backend

This backend replaces the original Express/Vite server-side API and browser `localStorage` persistence with a Flask REST API, SQLAlchemy persistence, JWT authentication, RBAC, audit logging, PostgreSQL support, deterministic AI fallback, and optional Gemini integration.

## Run locally

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/macOS
flask --app wsgi:app run --debug
```

The first startup imports **Quick Access login accounts only** from `seed.json`. Schools, pupils, examinations, questions, scripts, results and report cards are never automatically seeded. Demo users share the password in `DEMO_PASSWORD`; change it before production. The development launcher stores the SQLite database outside the release folder so business data survives application updates and relaunches.

## Production

Use PostgreSQL and Gunicorn. Set unique `SECRET_KEY` and `JWT_SECRET_KEY`, restrict `CORS_ORIGINS`, configure HTTPS at the reverse proxy, and remove/rotate the demo credentials. Example:

```bash
gunicorn -w 4 -b 0.0.0.0:8000 --access-logfile - --error-logfile - wsgi:app
```

For production migrations, add Alembic/Flask-Migrate migrations before changing schema. The current record store deliberately keeps the original nested application contract intact, while PostgreSQL supplies durable transactional persistence.

## Main API areas

- `/api/auth/*` authentication and password management
- `/api/state` complete application snapshot
- CRUD resources under `/api/{resource}`
- Examination workflow: question verification, schemes, approval, paper generation
- Script intake, examiner finalization, result finalization and rankings
- Student promotion/transfer/status, daily attendance and report-card generation
- Public `/api/verify/report-card/<code>` verification
- `/api/gemini/*` theory evaluation, document parsing and rubric generation
- `/api/health` liveness/readiness check

## SQLite test mode

The test suite intentionally uses SQLite so backend integration tests do not require PostgreSQL. Run from this directory:

```bash
python run_tests.py
```

The suite covers authentication, state hydration, school isolation, RBAC, demo-role JWT switching, fixed examination paper assignment, deterministic variable paper generation, CBT submission/result creation, and public report-card verification.

`DEMO_MODE=true` is enabled in the supplied testing/demo configuration. Before production deployment, set `DEMO_MODE=false` and set `VITE_DEMO_MODE=false` in the frontend.


## Local SQLite testing

The integration test suite deliberately uses SQLite so development and CI do not require PostgreSQL.
Run from the repository root:

```powershell
python backend/run_tests.py
```

`DEMO_MODE=true` keeps the Quick Role Switcher enabled for testing. Set both `DEMO_MODE=false` and `VITE_DEMO_MODE=false` before production deployment.
