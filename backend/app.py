# app.y

"""
Entry point for the Flask backend service.

This module serves as the main entry point for the containerized Flask application.
It initializes the Flask app using the application factory pattern and defines
the root route. When run directly, it starts the development server on all
network interfaces (0.0.0.0) at port 8080.

The application is designed to run in a containerized environment and can be
served by WSGI servers (e.g., Gunicorn, uWSGI) in production by importing
the 'application' object.

source: https://blog.devgenius.io/part-1-containerized-backend-with-flask-and-postgresql-f28e48c96224
"""

from app import create_app

application = create_app()


@application.route('/')
def index():
    return ":)"


if __name__ == '__main__':
    application.run(host='0.0.0.0', port=8080, debug=True)