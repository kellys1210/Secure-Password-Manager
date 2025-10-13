# Source: https://dev.to/francescoxx/python-crud-rest-api-using-flask-sqlalchemy-postgres-docker-docker-compose-3kh4
#         https://blog.devgenius.io/part-1-containerized-backend-with-flask-and-postgresql-f28e48c96224

from app import db

class User(db.Model):

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

    def __str__(self):
        return f"User {self.username}"