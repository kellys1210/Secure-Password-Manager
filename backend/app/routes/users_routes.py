# user_route.py

from flask import Blueprint, request, jsonify

# user_bp = Blueprint('user', __name__)
users_routes = Blueprint('users_routes', __name__)

@users_routes.route("/health")
def health():
    return jsonify({"ok": True})

"""
Interaction with database container

Add, Update User:
    - Store Username + Hashed Master Password + Generated Secret
    - How to update master password? TOTP Authentication required?
"""


# @user_bp.route('/user/register', methods=['POST'])
# def register_user():
#     """
#     Register a new user with username and password.

#     Expected JSON body:
#         {
#             "username": "example_user",
#             "password": "secure_password123"
#         }

#     :return: JSON with registration result and appropriate status code
#              - 200: User registered successfully
#              - 400: Missing username or password
#              - 500: Server error
#     :rtype: Response
#     """
#     try:
#         data = request.get_json()
#         username = data.get('username')
#         password = data.get('password')
#         if not username or not password:
#             return jsonify({'error': 'Username and password are required'}), 400

#         # TODO Store in DB
#         success = True
#         if success:
#             return jsonify({'message': "Registration Successful"}), 200

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
