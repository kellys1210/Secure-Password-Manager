# user_route.py
# Source: https://flask-sqlalchemy.readthedocs.io/en/stable/quickstart/#define-models

from backend.app import db
from backend.app.model import User
from flask import Blueprint, request, jsonify

from app.service import Argon2Service

user_bp = Blueprint("user", __name__)
argon2 = Argon2Service()

"""
Interaction with database container

Add, Update User:
    - Store Username + Hashed Master Password + Generated Secret
    - How to update master password? TOTP Authentication required?
"""


@user_bp.route("/register", methods=["POST"])
def register_user():
    """
    Register a new user with username and password.

    Expected JSON body:
        {
            "username": "example_user",
            "password": "secure_password123"
        }

    :return: JSON with registration result and appropriate status code
             - 201: User registered successfully
             - 400: Missing username or password
             - 409: Username already exists
             - 500: Server error
    :rtype: Response
    """
    try:
        data = request.get_json()
        new_username = data.get("username")
        new_password = data.get("password")

        if not new_username or not new_password:
            return jsonify({"error": "Username and password are required"}), 400

        # Check if user already exists
        if User.query.filter_by(username=new_username).first():
            return jsonify({"error": "Username already exists"}), 409

        # Create master password hash
        new_password_hash = argon2.hash_password(new_password)

        # Create new User object
        new_user = User(username=new_username, password=new_password_hash)

        # Add and save user to PostgreSQL
        db.session.add(new_user)
        db.session.commit()

        return (
            jsonify({"message": "Registration Successful", "user_id": new_user.id}),
            201,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@user_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate a user with username and password.

    Expected JSON payload:
        {
            "username": "string",
            "password": "string"
        }

    Returns:
        JSON response with authentication result and appropriate HTTP status code.
        - 200: Login successful
        - 400: Missing username or password, or invalid JSON
        - 401: Invalid credentials (username not found or password incorrect)
    """
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"error": "Invalid JSON payload"}), 400

        username = data.get("username")
        password = data.get("password")

        # Validate required fields
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        # Check if user exists
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        # Verify password (plain password against stored hash)
        if not argon2.verify_hash(user.password, password):
            return jsonify({"error": "Invalid credentials"}), 401

        # Check if stored hash needs to be rehashed with new parameters
        if argon2.check_needs_rehash(user.password):
            user.password = argon2.hash_password(password)
            db.session.commit()

        return jsonify({"message": "Login successful", "user_id": user.id}), 200
    except Exception as e:
        return jsonify({"error": "Invalid request format"}), 400


@user_bp.route("/register", methods=["GET"])
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

        return (
            jsonify({"id": user.id, "username": user.username} for user in users),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
