
import os
from datetime import timedelta
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from werkzeug.middleware.proxy_fix import ProxyFix


db = SQLAlchemy()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=["300 per minute"])
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    # PyJWT requires a sufficiently long HMAC secret for HS256. In development,
    # normalize accidentally short inherited environment values so a harmless
    # launcher/environment mismatch does not produce insecure-key warnings.
    # Production still fails fast below rather than silently altering a secret.
    secret_key = os.getenv("SECRET_KEY", "dev-only-change-me")
    jwt_secret_key = os.getenv("JWT_SECRET_KEY", "dev-jwt-change-me")
    if os.getenv("FLASK_ENV") != "production":
        if len(secret_key) < 32:
            secret_key = (secret_key + "-earpms-development-secret-padding-2026")[:64]
        if len(jwt_secret_key) < 32:
            jwt_secret_key = (jwt_secret_key + "-earpms-development-jwt-padding-2026")[:64]

    app.config.update(
        SECRET_KEY=secret_key,
        SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL", "sqlite:///earpms.db"),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY=jwt_secret_key,
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=8),
        MAX_CONTENT_LENGTH=int(os.getenv("MAX_CONTENT_LENGTH_MB", "20")) * 1024 * 1024,
        JSON_SORT_KEYS=False,
        TESTING=os.getenv("TESTING", "false").lower() == "true",
        SESSION_COOKIE_SECURE=os.getenv('FLASK_ENV') == 'production',
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE='Lax',
    )
    if os.getenv("FLASK_ENV") == "production":
        for key in ("SECRET_KEY", "JWT_SECRET_KEY"):
            value=os.getenv(key, "")
            if len(value) < 48 or "change-me" in value.lower():
                raise RuntimeError(f"{key} must be a strong production secret (48+ characters)")
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    origins=os.getenv("CORS_ORIGINS", "http://localhost:5173")
    CORS(app, origins=[x.strip() for x in origins.split(",") if x.strip()], supports_credentials=True)

    from .routes import api
    app.register_blueprint(api, url_prefix="/api")

    @app.after_request
    def security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        return response

    with app.app_context():
        if app.config["TESTING"] or os.getenv("AUTO_CREATE_DB", "false").lower() == "true":
            db.create_all()
            if app.config["TESTING"] or os.getenv("SEED_ON_STARTUP", "true").lower() == "true":
                from .seed import seed_if_empty
                seed_if_empty()
    @app.cli.command("seed")
    def seed_command():
        from .seed import seed_if_empty
        seed_if_empty()
        print("EARPMS seed data loaded.")
    return app
