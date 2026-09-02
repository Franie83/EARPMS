
#!/bin/sh
set -eu
flask --app wsgi:app db upgrade
flask --app wsgi:app seed
exec gunicorn -w "${WEB_CONCURRENCY:-4}" -b "${BIND:-0.0.0.0:8000}" --access-logfile - --error-logfile - wsgi:app
