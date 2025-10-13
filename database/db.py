from os import environ

from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = environ.get("DATABASE_URL")
db = SQLAlchemy(app)


# Example table creation:
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def json(self):
        return {'id': self.id, 'username': self.username, 'email': self.email}


with app.app_context():
    db.create_all()


@app.route('/')
def index():
    return 'Hi :)'


# Example GET on users table created above:
@app.route('/users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        return make_response(jsonify([user.json() for user in users]), 200)
    except Exception as e:
        return make_response(jsonify({'message': 'error getting users'}), 500)


# Example POST on users table created above:
@app.route('/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        new_user = User(username=data['username'], email=data['email'])
        db.session.add(new_user)
        db.session.commit()
        return make_response(jsonify({'message': 'user created'}), 201)
    except Exception as e:
        return make_response(jsonify({'message': 'error creating user'}), 500)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
