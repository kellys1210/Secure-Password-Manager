# user_model.py

"""
User model for authentication and account management.

This module defines the User database model using SQLAlchemy ORM. It stores
user credentials and TOTP secrets for two-factor authentication.

Source: https://dev.to/francescoxx/python-crud-rest-api-using-flask-sqlalchemy-postgres-docker-docker-compose-3kh4
        https://blog.devgenius.io/part-1-containerized-backend-with-flask-and-postgresql-f28e48c96224
"""

from backend.app import db


class User(db.Model):
    """
    User model representing application users with authentication credentials.

    This model stores user account information including username, password hash,
    and TOTP secret for two-factor authentication. Each user is uniquely identified
    by their username.

    Attributes:
        user_id (int): Primary key, auto-incremented unique identifier for each user.
        username (str): Unique username for login, maximum 80 characters.
        password (str): Hashed password for authentication, maximum 255 characters.
                       Should never store plain text passwords.
        secret (str): TOTP secret key for two-factor authentication, maximum 255 characters.
                     Optional field, null if 2FA is not enabled.

    Table:
        users: PostgreSQL table storing user records.

    Example:
        >>> user = User(username='john_doe', password=hashed_password)
        >>> db.session.add(user)
        >>> db.session.commit()
    """

    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    secret = db.Column(db.String(255), nullable=True)

    def __str__(self):
        """
        Return string representation of the User instance.

        Returns:
            str: Formatted string with username (e.g., "User john_doe").
        """
        return f"User {self.username}"

    def __repr__(self):
        """
        Return detailed string representation for debugging.

        Returns:
            str: Representation showing user ID and username.
        """
        return f"<User(id={self.id}, username='{self.username}')>"
