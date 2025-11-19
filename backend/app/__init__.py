"""
Flask application factory module.

This module provides the application factory pattern for creating and configuring
the Flask application instance. It initializes the database connection, registers
blueprints for modular routing, and ensures database tables are created on startup.

The factory pattern allows for flexible configuration and easier testing by enabling
multiple application instances with different configurations.

source: https://blog.devgenius.io/part-1-containerized-backend-with-flask-and-postgresql-f28e48c96224
"""

import os

from flask import Flask, request, redirect
from flask_sqlalchemy import SQLAlchemy
import sqlalchemy
from flask_cors import CORS
from google.cloud.sql.connector import Connector, IPTypes
import pg8000

db = SQLAlchemy()


def create_app():
    """
    Create and configure the Flask application instance.

    This factory function initializes the Flask application with database
    configuration from environment variables, registers route blueprints,
    and creates all database tables if they don't exist.

    Returns:
        Flask: Configured Flask application instance ready to serve requests.

    Environment Variables:
        DATABASE_URL: PostgreSQL connection string for the database.

    Note:
        The database tables are automatically created on application startup
        if they don't already exist. This is suitable for development but
        should be replaced with proper migrations (e.g., Flask-Migrate) in
        production environments.
    """
    app = Flask(__name__)
    use_cloud_sql = os.getenv("USE_CLOUD_SQL", "false").lower() == "true"

    print(f"--- DB_SWITCH: USE_CLOUD_SQL is set to {use_cloud_sql} ---")

    if use_cloud_sql:

        instance_connection_name = os.environ["INSTANCE_CONNECTION_NAME"]
        db_user = os.environ["DB_USER"]
        db_pass = os.environ["DB_PASS"]
        db_name = os.environ["DB_NAME"]

        ip_type = IPTypes.PRIVATE if os.environ.get("PRIVATE_IP") else IPTypes.PUBLIC

        connector = Connector(ip_type=ip_type)

        def getconn() -> pg8000.dbapi.Connection:
            conn = connector.connect(
                instance_connection_name,
                "pg8000",
                user=db_user,
                password=db_pass,
                db=db_name,
            )
            return conn

        engine = sqlalchemy.create_engine(
            "postgresql+pg8000://",
            creator=getconn,
            pool_size=5,
            max_overflow=2,
            pool_timeout=30,
            pool_recycle=1800,
        )

        app.config["SQLALCHEMY_DATABASE_URI"] = str(engine.url)
        app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"creator": getconn}

    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")

    db.init_app(app)

    # Configure CORS to allow requests from the React frontend
    CORS(
        app,
        origins=[
            "http://localhost:3000",
            "http://localhost:5173",
            "https://secure-pw-manager.netlify.app",
            "https://deploy-preview-*--secure-pw-manager.netlify.app"
        ],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # Import blueprints
    from backend.app.routes.user_route import user_bp
    from backend.app.routes.totp_route import totp_bp
    from backend.app.routes.pw_manager_route import pw_manager_bp
    from backend.app.routes.jwt_route import jwt_bp

    app.register_blueprint(user_bp, url_prefix="/users")
    app.register_blueprint(totp_bp, url_prefix="/totp")
    app.register_blueprint(pw_manager_bp, url_prefix="/pw_manager")
    app.register_blueprint(jwt_bp, url_prefix="/jwt")

    # Add security headers to all responses
    @app.after_request
    def after_request(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        return response

    # Enforce HTTPS
    @app.before_request
    def before_request():
        # Skip HTTPS enforcement in development and testing environments
        if app.debug or app.config.get("TESTING"):
            return

        # Detect protocol of original request from Cloud Run, defaults to http
        proto = request.headers.get("X-Forwarded-Proto", "http")

        # Skip for common development hosts
        if proto != "https" and not request.host.startswith(
            ("localhost", "127.0.0.1", "::1")
        ):
            url = request.url.replace("http://", "https://", 1)
            return redirect(
                url, code=301
            )  # HTTP - Permanent redirect response to browser

    @app.route("/")
    def index():
        return "You're in the backend :)"

    @app.route("/db_check")
    def db_check():
        """
        Verify active database connectivity and return current server time.

        This endpoint checks whether the application can successfully connect
        to the configured database (either local or Cloud SQL). It executes a simple
        `SELECT NOW()` query to confirm connection health and retrieve a timestamp
        from the database server.

        Returns:
            tuple: A JSON response and HTTP status code.
                - On success: {"status": "Connected to <DB type>", "timestamp": "<UTC time>"}, 200
                - On failure: {"status": "Connection to <DB type> failed", "error": "<error message>"}, 500

        Note:
            The response differentiates between Cloud SQL and local database connections
            based on the `USE_CLOUD_SQL` environment variable. This endpoint is primarily
            intended for deployment verification and troubleshooting.
        """
        db_type = "Cloud SQL" if use_cloud_sql else "Local DB (flask_db)"
        try:
            with db.engine.connect() as connection:
                result = connection.execute(sqlalchemy.text("SELECT NOW()")).scalar()
            return {"status": f"Connected to {db_type}", "timestamp": str(result)}, 200
        except Exception as e:
            return {"status": f"Connection to {db_type} failed", "error": str(e)}, 500

    with app.app_context():
        """
        User must be initialized before Entry
        """
        from backend.app.model import User
        from backend.app.model import Entry

        db.create_all()

    return app
