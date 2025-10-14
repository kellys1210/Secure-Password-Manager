# pw_manager_routes.py

from flask import Blueprint
entry_bp = Blueprint("entry", __name__)

"""
-User Add Password
-User Delete Password
-User Update Password

Inputs:
    {
        application: application_name
        password: hashed_password
        jwt: jwt_token_string
    }

Output:
    {
        200: Acction successful, jwt token valid
        Error Code: Action unsuccessful due to invalid information or invalid jwt token
    }

"""