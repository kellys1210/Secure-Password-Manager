# Source: https://dev.to/francescoxx/python-crud-rest-api-using-flask-sqlalchemy-postgres-docker-docker-compose-3kh4
#         https://blog.devgenius.io/part-1-containerized-backend-with-flask-and-postgresql-f28e48c96224


from app import db

class Entry(db.Model):

    __tablename__ = 'entries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    application = db.Column(db.String(120), nullable=False)
    username = db.Column(db.String(80), nullable=False)
    password = db.Column(db.String(255), nullable=False)

    def __str__(self):
        return f"Entry {self.username} for application {self.application}"


