# users_routes.py
# Source: https://flask-sqlalchemy.readthedocs.io/en/stable/quickstart/#define-models

from flask import Blueprint, request, jsonify
from app import db
from app.models.user_model import User

user_bp = Blueprint('user', __name__)

"""
Interaction with database container

Add, Update User:
    - Store Username + Hashed Master Password + Generated Secret
    - How to update master password? TOTP Authentication required?
"""


@user_bp.route('/user/register', methods=['POST'])
def register_user():
    """
    Register a new user with username and password.

    Expected JSON body:
        {
            "username": "example_user",
            "password": "secure_password123"
        }

    :return: JSON with registration result and appropriate status code
             - 200: User registered successfully
             - 400: Missing username or password
             - 500: Server error
    :rtype: Response
    """
    try:
        data = request.get_json()
        new_username = data.get('username')
        new_password = data.get('password')
        if not new_username or not new_password:
            return (jsonify({'error': 'Username and password are required'}), 400)

        # TODO: Check if user exists

        # Create new User object
        new_user = User(
            username = new_username, 
            password = new_password
        )

        # Add and save user to PostsgreSQL
        db.session.add(new_user)
        db.session.commit()

        return (jsonify({'message': "Registration Successful"}), 201)

    except Exception as e:
        db.session.rollback()
        return (jsonify({'error': str(e)}), 500)

@user_bp.route('/user/register', methods=['GET'])
def get_all_registered_users():
    """
    Get a list of all registered users.

    :return: JSON array containing the following:
            {
                "id" : user.id,
                "username" : user.username
            }

            and an HTTP status code:
            - 200: List of users obtained successfully
            - 500: Server error
    :rtype: Response
    """
    try:

        users = User.query.all()

        result = []
        for user in users:
            result.append({
                "id": user.id, 
                "username": user.username
            })

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
