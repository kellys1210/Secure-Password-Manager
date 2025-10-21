"""
Flask application factory module.

This module provides the application factory pattern for creating and configuring
the Flask application instance. It initializes the database connection, registers
blueprints for modular routing, and ensures database tables are created on startup.

The factory pattern allows for flexible configuration and easier testing by enabling
multiple application instances with different configurations.

source: https://blog.devgenius.io/part-1-containerized-backend-with-flask-and-postgresql-f28e48c96224
"""

from os import environ

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

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
    app.config["SQLALCHEMY_DATABASE_URI"] = environ.get("DATABASE_URL")
    db.init_app(app)

    # Configure CORS to allow requests from the React frontend
    CORS(
        app,
        origins=["http://localhost:3000", "http://localhost:5173"],
        methods=["GET", "POST", "PUT", "DELETE"],
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
        return response

    @app.route("/")
    def index():
        return "You're in the backend :)"

    with app.app_context():
        """
        User must be initialized before Entry
        """
        from backend.app.model import User
        from backend.app.model import Entry

        db.create_all()

    return app
