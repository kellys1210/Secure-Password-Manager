# source: https://blog.devgenius.io/part-1-containerized-backend-with-flask-and-postgresql-f28e48c96224

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from os import environ

db = SQLAlchemy()

def create_app():

    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = environ.get("DATABASE_URL")
    db.init_app(app)

    # Import blueprints
    from app.routes.users_routes import users_routes
    from app.routes.entries_routes import entries_routes

    app.register_blueprint(users_routes)
    app.register_blueprint(entries_routes)

    with app.app_context():
        db.create_all()

    return app

    