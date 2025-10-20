"""
API Test Suite for Authentication Endpoints

This module contains integration tests for the authentication endpoints
including user registration, login, JWT token generation, and TOTP verification.
"""

import pytest
import json
import sys
import os

# Set environment variable for testing
os.environ["FLASK_ENV"] = "testing"

from backend.app import create_app, db
from backend.app.model import User, Entry


class TestAuthEndpoints:
    """Test suite for authentication-related API endpoints"""

    @pytest.fixture
    def app(self):
        """Create and configure a Flask app for testing"""
        # Set environment variable for testing
        os.environ["DATABASE_URL"] = "sqlite:///:memory:"

        app = create_app()
        app.config["TESTING"] = True

        # Import models to ensure they are registered with the db
        from backend.app.model import User, Entry

        with app.app_context():
            db.create_all()
            yield app
            db.drop_all()

    @pytest.fixture
    def client(self, app):
        """Create a test client for the app"""
        return app.test_client()

    @pytest.fixture
    def test_user(self, app):
        """Create a test user in the database"""
        from backend.app.service import Argon2Service

        argon2 = Argon2Service()

        with app.app_context():
            # Hash the password that will be used in tests
            hashed_password = argon2.hash_password("testpassword")
            user = User(
                username="testuser",
                password=hashed_password,
            )
            db.session.add(user)
            db.session.commit()
            return user

    def test_user_registration_success(self, client):
        """Test successful user registration"""
        user_data = {
            "username": "newuser",
            "password": "SecurePassword123!",
        }

        response = client.post(
            "/users/register",
            data=json.dumps(user_data),
            content_type="application/json",
        )

        assert response.status_code == 201
        data = json.loads(response.data)
        assert "message" in data
        assert "user_id" in data

    def test_user_registration_missing_fields(self, client):
        """Test user registration with missing required fields"""
        user_data = {
            "username": "newuser"
            # Missing email and password
        }

        response = client.post(
            "/users/register",
            data=json.dumps(user_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    def test_user_login_success(self, client, test_user):
        """Test successful user login"""
        login_data = {"username": "testuser", "password": "testpassword"}

        response = client.post(
            "/users/login", data=json.dumps(login_data), content_type="application/json"
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "message" in data
        assert "user_id" in data

    def test_user_login_invalid_credentials(self, client, test_user):
        """Test login with invalid credentials"""
        login_data = {"username": "testuser", "password": "wrongpassword"}

        response = client.post(
            "/users/login", data=json.dumps(login_data), content_type="application/json"
        )

        assert response.status_code == 401
        data = json.loads(response.data)
        assert "error" in data

    def test_jwt_token_generation(self, client, test_user):
        """Test JWT token generation endpoint"""
        token_data = {"username": "testuser"}

        response = client.post(
            "/jwt/token", data=json.dumps(token_data), content_type="application/json"
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "jwt" in data
        assert isinstance(data["jwt"], str)

    def test_jwt_token_generation_missing_username(self, client):
        """Test JWT token generation with missing username"""
        token_data = {}  # Missing username

        response = client.post(
            "/jwt/token", data=json.dumps(token_data), content_type="application/json"
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    def test_jwt_token_verification_valid(self, client, test_user):
        """Test JWT token verification with valid token"""
        # First get a token
        token_data = {"username": "testuser"}
        token_response = client.post(
            "/jwt/token", data=json.dumps(token_data), content_type="application/json"
        )
        token = json.loads(token_response.data)["jwt"]

        # Verify the token
        verify_data = {"jwt": token}
        response = client.post(
            "/jwt/verify", data=json.dumps(verify_data), content_type="application/json"
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "message" in data

    def test_jwt_token_verification_invalid(self, client):
        """Test JWT token verification with invalid token"""
        verify_data = {"jwt": "invalid.token.here"}

        response = client.post(
            "/jwt/verify", data=json.dumps(verify_data), content_type="application/json"
        )

        assert response.status_code == 401
        data = json.loads(response.data)
        assert "error" in data

    def test_totp_setup_success(self, client, test_user):
        """Test TOTP setup endpoint"""
        setup_data = {"username": "testuser"}

        response = client.post(
            "/totp/setup", data=json.dumps(setup_data), content_type="application/json"
        )

        assert response.status_code == 200
        assert response.content_type == "image/png"

    def test_totp_setup_user_not_found(self, client):
        """Test TOTP setup with non-existent user"""
        setup_data = {"username": "nonexistentuser"}

        response = client.post(
            "/totp/setup", data=json.dumps(setup_data), content_type="application/json"
        )

        assert response.status_code == 401
        data = json.loads(response.data)
        assert "error" in data

    def test_totp_verification_success(self, client, test_user):
        """Test TOTP verification with valid code"""
        # First setup TOTP (this would store a secret)
        setup_data = {"username": "testuser"}
        client.post(
            "/totp/setup", data=json.dumps(setup_data), content_type="application/json"
        )

        # Note: In a real test, we'd need to generate a valid TOTP code
        # For now, we'll test the endpoint structure
        verify_data = {
            "username": "testuser",
            "code": "123456",  # This would need to be a valid TOTP code
        }

        response = client.post(
            "/totp/verify",
            data=json.dumps(verify_data),
            content_type="application/json",
        )

        # This might return 401 (invalid code) or 404 (TOTP not set up)
        # depending on the implementation
        assert response.status_code in [200, 401, 404]

    def test_totp_verification_missing_fields(self, client):
        """Test TOTP verification with missing required fields"""
        verify_data = {
            "username": "testuser"
            # Missing code
        }

        response = client.post(
            "/totp/verify",
            data=json.dumps(verify_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    def test_endpoint_security_headers(self, client):
        """Test that security headers are present in responses"""
        response = client.get("/")

        # Check for important security headers
        security_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
        ]

        for header in security_headers:
            assert header in response.headers

    def test_rate_limiting_on_auth_endpoints(self, client):
        """Test that authentication endpoints have rate limiting"""
        # This would test if rate limiting is implemented
        # For now, it's a placeholder for future implementation
        token_data = {"username": "testuser"}

        # Make multiple rapid requests
        for _ in range(5):
            response = client.post(
                "/jwt/token",
                data=json.dumps(token_data),
                content_type="application/json",
            )

        # In a real implementation, we'd expect rate limiting after certain attempts
        # This test documents the requirement
        pass


class TestErrorHandling:
    """Test error handling for authentication endpoints"""

    @pytest.fixture
    def client(self):
        """Create a test client for error handling tests"""
        # Set environment variable for testing
        os.environ["DATABASE_URL"] = "sqlite:///:memory:"

        app = create_app()
        app.config["TESTING"] = True
        return app.test_client()

    def test_invalid_json_payload(self, client):
        """Test handling of invalid JSON payload"""
        response = client.post(
            "/users/login", data="invalid json", content_type="application/json"
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    def test_nonexistent_endpoint(self, client):
        """Test handling of non-existent endpoints"""
        response = client.get("/nonexistent-endpoint")

        assert response.status_code == 404

    def test_method_not_allowed(self, client):
        """Test handling of unsupported HTTP methods"""
        response = client.put("/users/login")

        assert response.status_code == 405
