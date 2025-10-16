# entry_model.py

"""
Entry model for password vault storage.

This module defines the Entry database model using SQLAlchemy ORM. It stores
encrypted password entries for different applications, associated with individual users.

Source: https://dev.to/francescoxx/python-crud-rest-api-using-flask-sqlalchemy-postgres-docker-docker-compose-3kh4
        https://blog.devgenius.io/part-1-containerized-backend-with-flask-and-postgresql-f28e48c96224
"""

from app import db


class Entry(db.Model):
    """
    Entry model representing stored credentials for applications in the password vault.

    This model stores user-specific password entries for various applications or services.
    Each entry is linked to a user and contains the application name along with
    associated credentials.

    Attributes:
        entry_id (int): Primary key, auto-incremented unique identifier for each entry.
        user_id (int): Foreign key referencing the User who owns this entry.
                      Links to users.id table. Required field.
        application (str): Name of the application or service (e.g., "Gmail", "GitHub").
                          Maximum 120 characters. Required field.
        application (str): Username for the application and service login. Maximum 255 characters.
        password (str): Encrypted password for the application. Maximum 255 characters.
                       Should be encrypted before storage. Required field.

    Table:
        entries: PostgreSQL table storing password vault entries.

    Relationships:
        Belongs to User via user_id foreign key.

    Example:
        >>> entry = Entry(
        ...     user_id=1,
        ...     application='GitHub',
        ...     application_username='GitHubAccount',
        ...     password=encrypted_password
        ... )
        >>> db.session.add(entry)
        >>> db.session.commit()

    Security Note:
        Passwords should be encrypted before storing in this table. Never store
        plain text passwords.
    """
    __tablename__ = 'entries'

    entry_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    application = db.Column(db.String(120), nullable=False)
    application_username = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)

    def __str__(self):
        """
        Return string representation of the Entry instance.

        Returns:
            str: Formatted string showing username and application
                (e.g., "Entry john_doe for application GitHub").
        """
        return f"Entry {self.username} for application {self.application}"

    def __repr__(self):
        """
        Return detailed string representation for debugging.

        Returns:
            str: Representation showing entry ID, user ID, and application.
        """
        return f"<Entry(id={self.entry_id}, user_id={self.user_id}, application='{self.application}')>"