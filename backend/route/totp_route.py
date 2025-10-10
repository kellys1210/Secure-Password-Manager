# totp_route.py

from flask import Blueprint, request, jsonify, send_file

from backend.totp import Totp

# TODO: Blueprint needs to be registered in main application. Need to figure this out in the future

auth_bp = Blueprint('auth', __name__)
totp = Totp()


@auth_bp.route('/totp/setup', methods=['POST'])
def setup_totp():
    """
    Generate and return a QR code for TOTP setup.

    Expected JSON body:
        {
            "username": "example_user_name"
        }

    :return: PNG image of QR code on success, or JSON error message with appropriate status code
    :rtype: Response
    :raises: 400 if username is missing
    :raises: 500 if an unexpected error occurs
    """
    try:
        data = request.get_json()
        username = data.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400

        # Generate and store secret
        secret = totp.generate_secret()
        # TODO: Save secret to database associated with username

        # Sent QR Code
        qr_image = totp.generate_qr_code_image(secret, username)
        return send_file(
            qr_image,
            mimetype='image/png',
            as_attachment=False,
            download_name=f'totp_qr_{username}.png'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/totp/verify', methods=['POST'])
def verify_totp():
    """
    Verify a TOTP code entered by the user.

    Expected JSON body:
        {
            "username": "example_user_name",
            "code": "123456"
        }

    :return: JSON with verification result and appropriate status code
             - 200: TOTP verified successfully
             - 400: Missing username or code
             - 401: Invalid TOTP code
             - 404: TOTP not set up for user
             - 500: Server error
    :rtype: Response
    """
    try:
        data = request.get_json()
        username = data.get('username')
        user_code = data.get('code')
        if not username or not user_code:
            return jsonify({'error': 'Username and code are required'}), 400

        # TODO: Retrieve user secret from database via username
        secret = None
        if not secret:
            return jsonify({'error': 'TOTP not set up for this user'}), 404

        if totp.verify_totp_code(secret, user_code):
            return jsonify({'message': 'TOTP verified successfully'}), 200
        else:
            return jsonify({'error': 'Invalid TOTP code'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500
