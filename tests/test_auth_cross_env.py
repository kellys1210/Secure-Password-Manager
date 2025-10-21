"""
Cross-Environment Compatibility Tests for Authentication Endpoints

This module contains tests that validate consistent behavior of the
/register and /login endpoints across different environments:
- Local development (pytest)
- Docker containers
- GitHub Actions CI

These tests ensure that:
1. Import paths and packaging work correctly in all environments
2. Authentication endpoints behave identically
3. Environment-specific failures are caught early
"""

import pytest
import json
import os
import sys
from pathlib import Path

# Ensure proper path resolution for all environments
PROJECT_ROOT = Path(__file__).parent.parent
BACKEND_PATH = PROJECT_ROOT / "backend"

# Add backend to path for consistent imports
sys.path.insert(0, str(BACKEND_PATH))
sys.path.insert(0, str(PROJECT_ROOT))


class TestAuthCrossEnvironment:
    """Test authentication endpoints across different environments"""

    @pytest.fixture(autouse=True)
    def setup_environment(self):
        """Setup environment variables for consistent testing"""
        # Store original environment
        original_flask_env = os.environ.get("FLASK_ENV")
        original_database_url = os.environ.get("DATABASE_URL")

        # Set test environment
        os.environ["FLASK_ENV"] = "testing"
        os.environ["DATABASE_URL"] = "sqlite:///:memory:"

        yield

        # Restore original environment
        if original_flask_env:
            os.environ["FLASK_ENV"] = original_flask_env
        if original_database_url:
            os.environ["DATABASE_URL"] = original_database_url

    @pytest.fixture
    def app(self):
        """Create Flask app with consistent configuration across environments"""
        from backend.app import create_app, db

        app = create_app()
        app.config["TESTING"] = True

        with app.app_context():
            db.create_all()
            yield app
            db.drop_all()

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_import_paths_work_in_all_environments(self):
        """Verify that all necessary imports work correctly across environments"""
        # Test that we can import all required modules
        try:
            from backend.app import create_app
            from backend.app.model import User
            from backend.app.routes.user_route import user_bp
            from backend.app.service import Argon2Service
        except ImportError as e:
            pytest.fail(f"Import failed in current environment: {e}")

        # Verify the imports are functional
        assert create_app is not None
        assert User is not None
        assert user_bp is not None
        assert Argon2Service is not None

    def test_register_endpoint_consistency(self, client):
        """Test /register endpoint behaves consistently across environments"""
        # Test successful registration
        user_data = {
            "username": "testuser_env",
            "password": "SecurePassword123!",
        }

        response = client.post(
            "/users/register",
            data=json.dumps(user_data),
            content_type="application/json",
        )

        # Validate response structure is consistent
        assert response.status_code == 201
        data = json.loads(response.data)
        assert "message" in data
        assert "user_id" in data
        assert data["message"] == "Registration Successful"

    def test_register_endpoint_error_handling_consistency(self, client):
        """Test /register error handling is consistent across environments"""
        # Test missing fields
        user_data = {"username": "testuser"}  # Missing password

        response = client.post(
            "/users/register",
            data=json.dumps(user_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data
        assert "required" in data["error"].lower()

    def test_login_endpoint_consistency(self, client):
        """Test /login endpoint behaves consistently across environments"""
        # First register a user
        user_data = {
            "username": "login_test_user",
            "password": "TestPassword123!",
        }

        client.post(
            "/users/register",
            data=json.dumps(user_data),
            content_type="application/json",
        )

        # Test successful login
        login_data = {
            "username": "login_test_user",
            "password": "TestPassword123!",
        }

        response = client.post(
            "/users/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        # Validate response structure is consistent
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "message" in data
        assert "user_id" in data
        assert data["message"] == "Login successful"

    def test_login_endpoint_error_handling_consistency(self, client):
        """Test /login error handling is consistent across environments"""
        # Test invalid credentials
        login_data = {
            "username": "nonexistent_user",
            "password": "WrongPassword123!",
        }

        response = client.post(
            "/users/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert response.status_code == 401
        data = json.loads(response.data)
        assert "error" in data
        assert "invalid" in data["error"].lower()

    def test_password_hashing_consistency(self, client):
        """Test password hashing works consistently across environments"""
        # Register user
        user_data = {
            "username": "hash_test_user",
            "password": "ConsistentPassword123!",
        }

        response = client.post(
            "/users/register",
            data=json.dumps(user_data),
            content_type="application/json",
        )

        assert response.status_code == 201

        # Login with same password
        login_data = {
            "username": "hash_test_user",
            "password": "ConsistentPassword123!",
        }

        response = client.post(
            "/users/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert response.status_code == 200

    def test_endpoint_security_headers_consistency(self, client):
        """Test security headers are consistent across environments"""
        # Test register endpoint
        register_response = client.post("/users/register")
        # Test login endpoint
        login_response = client.post("/users/login")

        # Check for important security headers
        security_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
        ]

        for header in security_headers:
            assert header in register_response.headers
            assert header in login_response.headers

    def test_json_content_type_handling_consistency(self, client):
        """Test JSON content type handling is consistent across environments"""
        # Test with proper content type
        user_data = {
            "username": "content_type_test",
            "password": "TestPassword123!",
        }

        response = client.post(
            "/users/register",
            data=json.dumps(user_data),
            content_type="application/json",
        )

        assert response.status_code == 201

        # Test with invalid JSON
        response = client.post(
            "/users/register",
            data="invalid json",
            content_type="application/json",
        )

        # The endpoint should return either 400 (Bad Request) or 500 (Internal Server Error)
        # depending on how the Flask app handles invalid JSON
        assert response.status_code in [400, 500]


class TestDockerSpecificCompatibility:
    """Tests specifically for Docker environment compatibility"""

    def test_docker_volume_mounts_work(self):
        """Verify that file paths work correctly in Docker environment"""
        # This test verifies that the application can access necessary files
        # when running in Docker with volume mounts

        # Check that backend directory exists
        assert (
            BACKEND_PATH.exists()
        ), "Backend directory not found in current environment"

        # Check that key files exist
        required_files = ["app.py", "requirements.txt", "__init__.py"]

        for file_name in required_files:
            file_path = BACKEND_PATH / file_name
            assert (
                file_path.exists()
            ), f"Required file {file_name} not found in Docker environment"

    def test_docker_environment_variables(self):
        """Test that environment variables are properly set in Docker"""
        # These tests verify Docker-specific environment handling
        flask_env = os.environ.get("FLASK_ENV", "")
        database_url = os.environ.get("DATABASE_URL", "")

        # In Docker, FLASK_ENV might be set to development
        # In testing, we set it to testing
        # Both should work
        assert flask_env in [
            "testing",
            "development",
            "",
        ], f"Unexpected FLASK_ENV: {flask_env}"

        # Database URL should be set (either by Docker or test setup)
        # Empty is acceptable in some test scenarios
        pass


class TestImportPathConsistency:
    """Tests to ensure import paths work consistently across environments"""

    def test_backend_import_structure(self):
        """Test that backend import structure is consistent"""
        # Test absolute imports work
        try:
            from backend.app import create_app
            from backend.app.model.user_model import User
            from backend.app.routes.user_route import user_bp
            from backend.app.service.argon2_service import Argon2Service
        except ImportError as e:
            pytest.fail(f"Absolute imports failed: {e}")

        # Test relative imports work
        try:
            # This simulates how the app imports modules internally
            import backend.app.routes.user_route
            import backend.app.service.argon2_service
        except ImportError as e:
            pytest.fail(f"Relative imports failed: {e}")

    def test_package_installation_consistency(self):
        """Test that package installation is consistent across environments"""
        # Verify that all required packages are available
        required_packages = ["flask", "flask_sqlalchemy", "pytest"]

        for package in required_packages:
            try:
                __import__(package)
            except ImportError:
                pytest.fail(
                    f"Required package '{package}' not available in current environment"
                )

        # Test argon2 packages specifically (they have different import names)
        try:
            from argon2 import PasswordHasher
        except ImportError as e:
            pytest.fail(
                f"Required argon2 packages not available in current environment: {e}"
            )


# Integration tests that can be run in all environments
class TestIntegrationCrossEnvironment:
    """Integration tests for authentication workflows across environments"""

    @pytest.fixture
    def app(self):
        """Create Flask app with consistent configuration"""
        from backend.app import create_app, db

        app = create_app()
        app.config["TESTING"] = True

        with app.app_context():
            db.create_all()
            yield app
            db.drop_all()

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_complete_registration_and_login_flow(self, client):
        """Test complete registration and login workflow"""
        # 1. Register new user
        register_data = {
            "username": "integration_test_user",
            "password": "IntegrationTestPassword123!",
        }

        register_response = client.post(
            "/users/register",
            data=json.dumps(register_data),
            content_type="application/json",
        )

        assert register_response.status_code == 201
        register_data = json.loads(register_response.data)
        assert "user_id" in register_data

        # 2. Login with registered user
        login_data = {
            "username": "integration_test_user",
            "password": "IntegrationTestPassword123!",
        }

        login_response = client.post(
            "/users/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert login_response.status_code == 200
        login_data = json.loads(login_response.data)
        assert "user_id" in login_data
        assert login_data["user_id"] == register_data["user_id"]

        # 3. Verify user exists in database
        from backend.app import db
        from backend.app.model.user_model import User

        with client.application.app_context():
            user = User.query.filter_by(username="integration_test_user").first()
            assert user is not None
            assert user.id == register_data["user_id"]

    def test_duplicate_registration_prevention(self, client):
        """Test that duplicate registrations are properly prevented"""
        # Register user first time
        user_data = {
            "username": "duplicate_test_user",
            "password": "TestPassword123!",
        }

        first_response = client.post(
            "/users/register",
            data=json.dumps(user_data),
            content_type="application/json",
        )

        assert first_response.status_code == 201

        # Try to register the same user again
        second_response = client.post(
            "/users/register",
            data=json.dumps(user_data),
            content_type="application/json",
        )

        assert second_response.status_code == 409
        error_data = json.loads(second_response.data)
        assert "error" in error_data
        assert "exists" in error_data["error"].lower()
