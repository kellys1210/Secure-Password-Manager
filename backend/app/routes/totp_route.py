# totp_route.py

from backend.app.model import User
from flask import Blueprint, request, jsonify, send_file

from backend.app.service import TotpService, JwtTokenService
from backend.app import db
import pyotp

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
    import logging

    logger = logging.getLogger(__name__)

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
        db.session.commit()

        # Log the secret for debugging (should be removed in production)
        logger.info(f"TOTP setup for user {username} - Secret: {secret}")

        # Generate TOTP URI for verification
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=username, issuer_name=totp.ISSUER
        )
        logger.info(f"TOTP URI: {totp_uri}")

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
        logger.error(f"TOTP setup error: {str(e)}")
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
        - 404: {"error": "TOTP not up for this user"}
        - 500: {"error": "<error_message>"}
    """
    import logging
    import time

    logger = logging.getLogger(__name__)

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Expected a JSON object"}), 400

        username = data.get("username")
        user_code = data.get("code")

        # Ensure username and code are strings
        if username is not None and not isinstance(username, str):
            username = str(username)
        if user_code is not None and not isinstance(user_code, str):
            user_code = str(user_code)

        logger.info(f"TOTP verify request - Username: {username}, Code: {user_code}")

        if not username or not user_code:
            return jsonify({"error": "Username and code are required"}), 400

        # Check if user exists
        user = User.query.filter_by(username=username).first()
        if not user:
            logger.warning(f"User not found: {username}")
            return jsonify({"error": "Username not found"}), 401

        # Verify TOTP with user secret
        secret = user.secret
        if not secret:
            logger.warning(f"TOTP not set up for user: {username}")
            return jsonify({"error": "TOTP not set up for this user"}), 404

        # Ensure secret is a string
        if secret is not None and not isinstance(secret, str):
            logger.warning(f"Secret is not a string: {type(secret)}, converting...")
            secret = str(secret)

        if not secret:
            logger.error("Secret is empty after conversion")
            return jsonify({"error": "Invalid TOTP secret"}), 500

        # Verify TOTP Code, return JWT session token if successful
        verification_result = totp.verify_totp_code(secret, user_code)
        if verification_result:
            logger.info(f"TOTP verification successful for user: {username}")
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
            logger.warning(f"TOTP verification failed for user: {username}")
            return jsonify({"error": "Invalid TOTP code"}), 401

    except Exception as e:
        logger.error(f"TOTP verification error: {str(e)}")
        return jsonify({"error": str(e)}), 500
