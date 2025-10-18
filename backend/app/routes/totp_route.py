# totp_route.py

from app.model import User
from flask import Blueprint, request, jsonify, send_file

from app.service import TotpService, JwtTokenService
from app import db

totp_bp = Blueprint("totp", __name__)
totp = TotpService()
jwt_token = JwtTokenService()


@totp_bp.route("/setup", methods=["POST"])
def setup_totp():
    """
    Generate and store TOTP secret, then return QR code for authenticator app setup.

    This endpoint creates a new TOTP secret for the user and returns a QR code
    image that can be scanned by authenticator apps (Google Authenticator, Authy, etc.).

    Expected JSON payload:
        {
            "username": "example_user_name"
        }

    Returns:
        - 200: PNG image of QR code for TOTP setup
        - 400: Missing username in request
        - 401: User not found
        - 500: Server error during QR code generation

    Note:
        The TOTP secret is stored in the database but not committed in this endpoint.
        Ensure db.session.commit() is called after successful TOTP verification.
    """
    try:
        data = request.get_json()
        username = data.get("username")

        if not username:
            return jsonify({"error": "Username is required"}), 400

        # Verify user exists
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 401

        # Generate and store TOTP secret
        secret = totp.generate_secret()
        user.secret = secret
        # Note: Not committing here as mentioned in the comment

        # Generate and return QR code image
        qr_image = totp.generate_qr_code_image(secret, username)
        return send_file(
            qr_image,
            mimetype="image/png",
            as_attachment=False,
            download_name=f"totp_qr_{username}.png",
        )

    except Exception as e:
        db.session.rollback()
        return (
            jsonify({"error": "Failed to generate TOTP setup", "details": str(e)}),
            500,
        )


@totp_bp.route("/verify", methods=["POST"])
def verify_totp():
    """
    Verify a TOTP code entered by the user.

    Expected JSON body:
        {
            "username": "example_user_name",
            "code": "123456"
        }

    :return: JSON with verification result and appropriate status code
             - 200: TOTP verified successfully (includes JWT token)
             - 400: Missing username or code
             - 401: Username not found or invalid TOTP code
             - 404: TOTP not set up for user
             - 500: Server error
    :rtype: Response

    Success response (200):
        {
            "message": "TOTP verified successfully",
            "jwt": "<token_string>"
        }

    Error responses:
        - 400: {"error": "Username and code are required"}
        - 401: {"error": "Username not found"} or {"error": "Invalid TOTP code"}
        - 404: {"error": "TOTP not set up for this user"}
        - 500: {"error": "<error_message>"}
    """
    try:
        data = request.get_json()
        username = data.get("username")
        user_code = data.get("code")
        if not username or not user_code:
            return jsonify({"error": "Username and code are required"}), 400

        # Check if user exists, and password is valid
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "Username not found"}), 401

        # Verify TOTP with user secret
        secret = user.secret
        if not secret:
            return jsonify({"error": "TOTP not set up for this user"}), 404

        # Verify TOTP Code, return JWT session token if successful
        if totp.verify_totp_code(secret, user_code):
            return (
                jsonify(
                    {
                        "message": "TOTP verified successfully",
                        "jwt": jwt_token.generate_jwt(username),
                    }
                ),
                200,
            )
        else:
            return jsonify({"error": "Invalid TOTP code"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500
