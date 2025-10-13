# entries_routes.py

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

from flask import Blueprint
entries_routes = Blueprint("entries_routes", __name__)