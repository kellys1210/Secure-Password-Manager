# pw_manager_route.py

from flask import Blueprint, request, jsonify

from backend.app import db
from backend.app.model import Entry, User
from backend.app.service import JwtTokenService, InputValidationService

pw_manager_bp = Blueprint("pw_manager", __name__)
jwt_token = JwtTokenService()
ivs = InputValidationService()


@pw_manager_bp.route("/password", methods=["PUT"])
def add_update_password():
    """
    Add or update a password entry for an application.

    Expected JSON body:
        {
            "jwt": "valid_jwt_token",
            "application": "application_name",
            "application_username": "application_username"
            "password": "hashed_password"
            "id": Optional["application_row_id"]
        }

    :return: JSON with operation result and appropriate status code
             - 201: Password stored/updated successfully
             - 400: Invalid JWT, missing fields, or validation error
             - 404: User not found
             - 500: Server error
    """
    try:
        data = request.get_json()
        jwt = data.get("jwt")
        application_name = data.get("application")
        application_username = data.get("application_username")
        password = data.get("password")
        id_ = data.get("id")

        # Validate JWT token
        if not jwt or not jwt_token.validate_jwt(jwt):
            return jsonify({"error": "JWT token expired or invalid"}), 400

        # Validate required fields
        if not application_name or not application_username or not password:
            return (
                jsonify({"error": "Application name, application username, and password are required"}),
                400,
            )

        # Get user from JWT
        username = jwt_token.get_username_from_jwt(jwt)
        user = User.query.filter_by(username=username).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Check if application username and password are valid before storing or updating in the database
        if (not ivs.is_valid_application_username(application_username)
                or not ivs.is_valid_application_password(password)
                or not ivs.is_valid_application_name(application_name)):
            return jsonify({"error": "Application name, username, or password are invalid"}), 400

        # Check if entry already exists for this user and application
        existing_entry = None
        if id_:
            existing_entry = Entry.query.filter_by(
                id=id_
            ).first()

        if existing_entry:
            # Update existing entry
            existing_entry.application = application_name
            existing_entry.username = application_username
            existing_entry.password = password
            message = "Entry updated successfully"
        else:
            # Create new entry
            entry = Entry(
                user_id=user.id,
                application=application_name,
                username=application_username,
                password=password,
            )
            db.session.add(entry)
            message = "Password stored successfully"

        db.session.commit()
        return jsonify({"message": message}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@pw_manager_bp.route("/password", methods=["DELETE"])
def delete_password():
    """
    Delete a password entry for a specific application.

    Expected JSON body:
        {
            "jwt": "valid_jwt_token",
            "id": "application_row_id"
        }

    :return: JSON with deletion result and appropriate status code
             - 200: Password deleted successfully
             - 400: Invalid JWT or missing fields
             - 404: User or entry not found
             - 500: Server error
    """
    try:
        data = request.get_json()
        jwt = data.get("jwt")
        id_ = data.get("id")

        # Validate JWT token
        if not jwt or not jwt_token.validate_jwt(jwt):
            return jsonify({"error": "JWT token expired or invalid"}), 400

        # Validate required fields
        if not id_:
            return jsonify({"error": "Application ID is required"}), 400

        # Get user from JWT
        username = jwt_token.get_username_from_jwt(jwt)
        user = User.query.filter_by(username=username).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Find and delete the entry
        entry = Entry.query.filter_by(user_id=user.id, id=id_).first()

        if not entry:
            return (
                jsonify({"error": "Password entry not found for this application"}),
                404,
            )

        db.session.delete(entry)
        db.session.commit()

        return jsonify({"message": "Password deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@pw_manager_bp.route("/passwords", methods=["POST"])
def get_all_passwords():
    """
    Retrieve all application/password pairs for the authenticated user.

    Expected JSON body:
        {
            "jwt": "valid_jwt_token"
        }

    :return: JSON with all password entries and appropriate status code
             - 200: Passwords retrieved successfully
             - 400: Invalid JWT or missing token
             - 404: User not found
             - 500: Server error
    """
    try:
        data = request.get_json()
        jwt = data.get("jwt")

        # Validate JWT token
        if not jwt or not jwt_token.validate_jwt(jwt):
            return jsonify({"error": "JWT token expired or invalid"}), 400

        # Get user from JWT
        username = jwt_token.get_username_from_jwt(jwt)
        user = User.query.filter_by(username=username).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Get all entries for this user
        entries = Entry.query.filter_by(user_id=user.id).all()

        # Format the response
        passwords = [
            {
                "id": entry.id,
                "application_name": entry.application,
                "application_username": entry.username,
                "password": entry.password
            }
            for entry in entries
        ]

        return jsonify({"passwords": passwords}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
