
# Edo State Ministry of Education EARPMS — Flask Production Stack

This package contains the EARPMS React frontend connected to a production-oriented Python Flask API and PostgreSQL database.

## Architecture

- React + Vite frontend
- Nginx reverse proxy/static server
- Flask + Gunicorn API
- SQLAlchemy + Flask-Migrate
- PostgreSQL 17
- JWT authentication
- Server-side RBAC and school isolation
- Audit logging
- Optional Gemini AI services

The browser no longer uses localStorage as the application datastore. It may retain a temporary UI recovery cache, but authenticated state is hydrated from Flask and mutations are synchronized to the server.

## Local development

1. Start PostgreSQL and Flask API from `backend/`.
2. Create the database schema with `flask --app wsgi:app db upgrade`.
3. Seed the supplied benchmark data with `flask --app wsgi:app seed`.
4. In `frontend/`, install dependencies and run `npm run dev`.
5. Set `VITE_API_BASE_URL=http://localhost:8000/api` for a separate frontend dev server.

## Production Docker

Create a `.env` file beside `docker-compose.yml` with strong random values for `POSTGRES_PASSWORD`, `SECRET_KEY`, `JWT_SECRET_KEY`, and `DEMO_PASSWORD`. Restrict `CORS_ORIGINS` to the public origin if the frontend and API are deployed separately.

Then:

```bash
docker compose build
docker compose up -d
```

Open `http://localhost:8080`.

The API container runs database migrations before Gunicorn starts. The first run seeds the supplied benchmark dataset if the database is empty.

## Security

- Never ship the benchmark/demo password unchanged.
- Put the stack behind HTTPS in production.
- Keep PostgreSQL private; do not expose port 5432 publicly.
- Rotate JWT/application secrets if compromised.
- Use a dedicated production Gemini API key with appropriate quota controls.


## SQLite testing / demo mode

The delivered test configuration uses an in-memory SQLite database, so PostgreSQL is not required to run the backend test suite. From `backend/`:

```bash
python -m pytest -q
```

For UI testing, `frontend/.env.production` intentionally sets `VITE_DEMO_MODE=true`. The Quick Role Switcher therefore issues a real short-lived demo JWT for the selected seeded account; it is not merely changing the React user's label. The API-side switch endpoint exists only when `DEMO_MODE=true`. Set both demo flags to `false` before production deployment.
