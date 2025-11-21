#!/usr/bin/env python3
"""
MFA Integration Test Script

This script tests the complete MFA flow:
1. User registration
2. TOTP setup (QR code generation)
3. TOTP verification with valid code
4. Login with MFA verification
"""

import json
import sys
import time
import pyotp
import requests
from pathlib import Path

# Add backend to path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from backend.app import create_app, db
from backend.app.model import User
from backend.app.service import Argon2Service


class MfaIntegrationTest:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.app = None
        self.client = None
        self.test_username = "mfa_test_user@example.com"
        self.test_password = "MfaTestPassword123!"
        self.totp_secret = None

    def setup_local_app(self):
        """Setup local Flask app for testing"""
        print("Setting up local test environment...")

        # Set environment variables
        import os

        os.environ["FLASK_ENV"] = "testing"
        os.environ["DATABASE_URL"] = "sqlite:///:memory:"

        self.app = create_app()
        self.app.config["TESTING"] = True

        with self.app.app_context():
            db.create_all()

        self.client = self.app.test_client()
        print("✓ Local test environment ready")

    def register_user(self):
        """Test user registration"""
        print(f"\n1. Testing user registration for {self.test_username}...")

        user_data = {
            "username": self.test_username,
            "password": self.test_password,
        }

        response = self.client.post(
            "/users/register",
            data=json.dumps(user_data),
            content_type="application/json",
        )

        if response.status_code == 201:
            print("✓ User registration successful")
            return True
        elif response.status_code == 409:
            print("✓ User already exists (continuing)")
            return True
        else:
            print(f"✗ Registration failed: {response.status_code} - {response.data}")
            return False

    def test_totp_setup(self):
        """Test TOTP setup endpoint"""
        print(f"\n2. Testing TOTP setup for {self.test_username}...")

        setup_data = {"username": self.test_username}

        response = self.client.post(
            "/totp/setup",
            data=json.dumps(setup_data),
            content_type="application/json",
        )

        if response.status_code == 200:
            print("✓ TOTP setup successful - QR code generated")

            # Verify user has secret stored
            with self.app.app_context():
                user = User.query.filter_by(username=self.test_username).first()
                if user and user.secret:
                    self.totp_secret = user.secret
                    print(
                        f"✓ TOTP secret stored in database (length: {len(self.totp_secret)})"
                    )
                    return True
                else:
                    print("✗ TOTP secret not found in database")
                    return False
        else:
            print(f"✗ TOTP setup failed: {response.status_code} - {response.data}")
            return False

    def test_totp_verification(self):
        """Test TOTP verification with valid code"""
        print(f"\n3. Testing TOTP verification for {self.test_username}...")

        if not self.totp_secret:
            print("✗ No TOTP secret available for verification")
            return False

        # Generate valid TOTP code
        print(f"TOTP secret type: {type(self.totp_secret)}")
        print(f"TOTP secret value: {self.totp_secret}")
        totp = pyotp.TOTP(self.totp_secret)
        valid_code = totp.now()
        print(f"Generated valid TOTP code: {valid_code}")

        verify_data = {"username": self.test_username, "code": valid_code}

        response = self.client.post(
            "/totp/verify",
            data=json.dumps(verify_data),
            content_type="application/json",
        )

        if response.status_code == 200:
            data = json.loads(response.data)
            if "jwt" in data:
                print("✓ TOTP verification successful - JWT token received")
                return True
            else:
                print("✓ TOTP verification successful but no JWT token")
                return True
        else:
            print(
                f"✗ TOTP verification failed: {response.status_code} - {response.data}"
            )
            return False

    def test_totp_verification_invalid_code(self):
        """Test TOTP verification with invalid code"""
        print(f"\n4. Testing TOTP verification with invalid code...")

        verify_data = {"username": self.test_username, "code": "000000"}  # Invalid code

        response = self.client.post(
            "/totp/verify",
            data=json.dumps(verify_data),
            content_type="application/json",
        )

        if response.status_code == 401:
            print("✓ Invalid TOTP code correctly rejected")
            return True
        else:
            print(f"✗ Expected 401 for invalid code, got {response.status_code}")
            return False

    def test_missing_fields(self):
        """Test error handling for missing fields"""
        print(f"\n5. Testing error handling for missing fields...")

        # Test missing username
        response = self.client.post(
            "/totp/verify",
            data=json.dumps({"code": "123456"}),
            content_type="application/json",
        )

        if response.status_code == 400:
            print("✓ Missing username correctly rejected")
        else:
            print(f"✗ Expected 400 for missing username, got {response.status_code}")

        # Test missing code
        response = self.client.post(
            "/totp/verify",
            data=json.dumps({"username": self.test_username}),
            content_type="application/json",
        )

        if response.status_code == 400:
            print("✓ Missing code correctly rejected")
            return True
        else:
            print(f"✗ Expected 400 for missing code, got {response.status_code}")
            return False

    def cleanup(self):
        """Clean up test data"""
        print(f"\n6. Cleaning up test data...")
        with self.app.app_context():
            user = User.query.filter_by(username=self.test_username).first()
            if user:
                db.session.delete(user)
                db.session.commit()
                print("✓ Test user removed from database")

        # Clean up database
        with self.app.app_context():
            db.drop_all()
            print("✓ Test database cleaned up")

    def run_all_tests(self):
        """Run all MFA integration tests"""
        print("=" * 60)
        print("MFA INTEGRATION TEST SUITE")
        print("=" * 60)

        try:
            self.setup_local_app()

            tests = [
                self.register_user,
                self.test_totp_setup,
                self.test_totp_verification,
                self.test_totp_verification_invalid_code,
                self.test_missing_fields,
            ]

            passed = 0
            total = len(tests)

            for test in tests:
                if test():
                    passed += 1
                else:
                    print(f"✗ Test failed: {test.__name__}")

            print(f"\n" + "=" * 60)
            print(f"RESULTS: {passed}/{total} tests passed")

            if passed == total:
                print("🎉 All MFA integration tests passed!")
            else:
                print("❌ Some tests failed. Check output above.")

        finally:
            self.cleanup()

        return passed == total


if __name__ == "__main__":
    # Test with local backend
    tester = MfaIntegrationTest("http://localhost:8080")
    success = tester.run_all_tests()

    sys.exit(0 if success else 1)
