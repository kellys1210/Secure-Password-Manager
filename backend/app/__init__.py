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

    # Import blueprints
    from app.routes.users_routes import user_bp
    from app.routes.entries_routes import entry_bp

    app.register_blueprint(user_bp)
    app.register_blueprint(entry_bp)

    with app.app_context():
        db.create_all()

    return app
