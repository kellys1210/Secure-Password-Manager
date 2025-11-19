# jwt_model.py

"""
JWT denylist model for token revocation and management.

This module defines the JwtDenyList database model using SQLAlchemy ORM. It stores
revoked JWT tokens to prevent their reuse after logout or forced invalidation.

This is commonly used for:
- Token denylisting after logout
- Token revocation for security purposes
- Preventing reuse of compromised tokens
"""

from backend.app import db


class JwtDenyList(db.Model):
    """
    JwtDenyList model representing revoked JSON Web Tokens.

    This model stores JWT tokens that have been denylisted in the database,
    typically after user logout or when tokens need to be forcibly invalidated
    for security reasons. Each token is uniquely identified by its auto-incremented ID.

    Attributes:
        id (int): Primary key, auto-incremented unique identifier for each token.
        token (str): The denylisted JWT token string, maximum 8192 characters.

    Table:
        jwt_denylist: PostgreSQL table storing denylisted JWT token records.

    Example:
        >>> denylisted = JwtDenyList(token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
        >>> db.session.add(denylisted)
        >>> db.session.commit()
    """

    __tablename__ = "jwt_denylist"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(8192), nullable=False)  # 8KB per token
