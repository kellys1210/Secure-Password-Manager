# source: https://blog.devgenius.io/part-1-containerized-backend-with-flask-and-postgresql-f28e48c96224

from flask import Flask
from app import create_app

application = create_app()

@application.route('/')
def index():
    return ":)"

if __name__ == '__main__':
    application.run(host='0.0.0.0', port = 8080, debug=True)