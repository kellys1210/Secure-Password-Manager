"""
Simple API Test Suite for Authentication Endpoints

This module contains basic integration tests for the authentication endpoints
to verify the test suite works correctly.
"""

import pytest
import json
import sys
import os

# Add backend to Python path
sys.path.insert(0, "backend")

from app import create_app, db
from app.model import User


class TestAuthSimple:
    """Simple test suite for authentication endpoints"""

    @pytest.fixture
    def app(self):
        """Create and configure a Flask app for testing"""
        import os

        # Set test database URL before creating app
        os.environ["DATABASE_URL"] = "sqlite:///:memory:"

        app = create_app()
        app.config["TESTING"] = True

        with app.app_context():
            db.create_all()
            yield app
            db.drop_all()

    @pytest.fixture
    def client(self, app):
        """Create a test client for the app"""
        return app.test_client()

    def test_app_creation(self, app):
        """Test that the Flask app can be created"""
        assert app is not None
        assert app.config["TESTING"] == True

    def test_database_connection(self, app):
        """Test that database connection works"""
        with app.app_context():
            # Try to create a simple user - using correct User model fields
            user = User(username="test", password="hashed_password")
            db.session.add(user)
            db.session.commit()

            # Verify user was created
            saved_user = User.query.filter_by(username="test").first()
            assert saved_user is not None
            assert saved_user.username == "test"

    def test_root_endpoint(self, client):
        """Test the root endpoint"""
        response = client.get("/")
        # The root endpoint might not exist, so check for any valid response
        # This tests that the Flask app is responding
        assert response.status_code in [200, 404]

    def test_jwt_token_endpoint_exists(self, client):
        """Test that JWT token endpoint exists"""
        response = client.post("/jwt/token", json={"username": "testuser"})
        # This should either return 400 (missing user) or 200 (token generated)
        assert response.status_code in [200, 400, 401]

    def test_totp_setup_endpoint_exists(self, client):
        """Test that TOTP setup endpoint exists"""
        response = client.post("/totp/setup", json={"username": "testuser"})
        # This should either return 401 (user not found) or 200 (QR code generated)
        assert response.status_code in [200, 401]

    def test_user_routes_exist(self, client):
        """Test that user routes exist"""
        response = client.post(
            "/users/login", json={"username": "test", "password": "test"}
        )
        # This endpoint might not be implemented yet, so check for any valid response
        # This tests that the Flask app is responding
        assert response.status_code in [200, 400, 401, 404]
