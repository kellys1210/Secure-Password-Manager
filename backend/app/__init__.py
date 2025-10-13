# source: https://blog.devgenius.io/part-1-containerized-backend-with-flask-and-postgresql-f28e48c96224

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from os import environ

db = SQLAlchemy()

def create_app():

    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = environ.get("DATABASE_URL")
    db.init_app(app)

    with app.app_context():
        db.create_all()

    return app

    