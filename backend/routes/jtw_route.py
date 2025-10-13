# jtw_route.py

from flask import Blueprint, request, jsonify

from backend.jwt_session_management import JwtToken

# TODO: Blueprint needs to be registered in main application. Need to figure this out in the future

jwt_bp = Blueprint('auth', __name__)
jwt_token = JwtToken()


@jwt_bp.route('jwt/setup', methods=['POST'])
def generate_jwt_session_token():
    """
    Generate and return a JWT session token for the specified user.

    Expected JSON body:
        {
            "username": "example_user_name"
        }

    :return: JSON with JWT token on success, or error message with appropriate status code
             - 200: JWT token generated successfully
             - 400: Missing username
             - 500: Server error
    :rtype: Response
    """
    try:
        data = request.get_json()
        username = data.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400

        # Generate JWT session management token
        jwt_token_string = jwt_token.generate_jwt(username)

        # Send JWT token
        return jsonify({'jwt': jwt_token_string}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@jwt_bp.route('jwt/verify', methods=['POST'])
def verify_jwt_token():
    """
    Verify a JWT token provided by the user.

    Expected JSON body:
        {
            "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }

    :return: JSON with verification result and appropriate status code
             - 200: JWT token verified successfully
             - 400: Missing JWT token
             - 401: Invalid JWT token
             - 500: Server error
    :rtype: Response
    """
    try:
        data = request.get_json()
        jwt_token_string = data.get('jwt')
        if not jwt_token_string:
            return jsonify({'error': 'JWT Token not provided'}), 400

        if jwt_token.validate_jwt(jwt_token_string):
            return jsonify({'message': 'JWT Token verified successfully'}), 200
        else:
            return jsonify({'error': 'Invalid JWT Token'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500
