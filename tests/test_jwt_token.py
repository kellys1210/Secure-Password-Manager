# test_jwt_token.py

from datetime import datetime, timedelta
import time
from unittest.mock import patch

import jwt
import pytest

from backend.service import JwtToken


class TestJwtToken:
    """Test suite for JwtToken class."""

    @pytest.fixture
    def jwt_handler(self):
        """Fixture to provide a fresh JwtToken instance for each test."""
        return JwtToken()

    def test_generate_jwt_returns_string(self, jwt_handler):
        """Test that generate_jwt returns a string token."""
        token = jwt_handler.generate_jwt("user123")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_generate_jwt_creates_valid_token(self, jwt_handler):
        """Test that generated token can be decoded successfully."""
        user_id = "user123"
        token = jwt_handler.generate_jwt(user_id)

        # Decode without verification to check structure
        decoded = jwt.decode(
            token,
            jwt_handler.SECRET_KEY,
            algorithms=[jwt_handler.ALG]
        )

        assert decoded["sub"] == user_id
        assert "iat" in decoded
        assert "exp" in decoded

    def test_generate_jwt_includes_correct_user_id(self, jwt_handler):
        """Test that the token contains the correct user ID in the 'sub' claim."""
        user_id = "test_user_456"
        token = jwt_handler.generate_jwt(user_id)

        decoded = jwt.decode(
            token,
            jwt_handler.SECRET_KEY,
            algorithms=[jwt_handler.ALG]
        )

        assert decoded["sub"] == user_id

    @patch("backend.service.jwt_token.datetime")
    def test_generate_jwt_expiration_time(self, mock_datetime, jwt_handler):
        """Test that token expiration is set correctly (30 minutes from issued time)."""
        fixed_time = datetime(2024, 1, 1, 12, 0, 0)
        mock_datetime.utcnow.return_value = fixed_time

        token = jwt_handler.generate_jwt("user123")

        # Decode WITHOUT validating expiration
        decoded = jwt.decode(
            token,
            jwt_handler.SECRET_KEY,
            algorithms=[jwt_handler.ALG],
            options={"verify_exp": False}
        )

        # Verify that exp is 30 minutes (1800 seconds) after iat
        assert decoded["exp"] - decoded["iat"] == 30 * 60
        assert decoded["sub"] == "user123"
    def test_validate_jwt_accepts_valid_token(self, jwt_handler):
        """Test that _validate_jwt returns True for a valid token."""
        token = jwt_handler.generate_jwt("user123")
        assert jwt_handler.validate_jwt(token) is True

    def test_validate_jwt_rejects_invalid_signature(self, jwt_handler):
        """Test that _validate_jwt returns False for a token with invalid signature."""
        token = jwt_handler.generate_jwt("user123")
        # Tamper with the token
        tampered_token = token[:-5] + "wrong"

        assert jwt_handler.validate_jwt(tampered_token) is False

    def test_validate_jwt_rejects_expired_token(self, jwt_handler):
        """Test that _validate_jwt returns False for an expired token."""
        # Create a token that's already expired
        with patch("backend.service.jwt_token.datetime") as mock_datetime:
            past_time = datetime.utcnow() - timedelta(hours=1)
            mock_datetime.utcnow.return_value = past_time
            token = jwt_handler.generate_jwt("user123")

        # Now validate it in the present
        assert jwt_handler.validate_jwt(token) is False

    def test_validate_jwt_rejects_malformed_token(self, jwt_handler):
        """Test that _validate_jwt returns False for malformed tokens."""
        malformed_tokens = [
            "not.a.token",
            "invalid_token_string",
            "",
            "a.b",  # Missing part
        ]

        for token in malformed_tokens:
            assert jwt_handler.validate_jwt(token) is False

    def test_validate_jwt_rejects_wrong_secret(self, jwt_handler):
        """Test that a token signed with a different secret is rejected."""
        # Create token with different secret
        payload = {"sub": "user123", "exp": datetime.utcnow() + timedelta(minutes=30)}
        wrong_token = jwt.encode(payload, "wrong_secret", algorithm="HS256")

        assert jwt_handler.validate_jwt(wrong_token) is False

    def test_encode_jwt_creates_valid_structure(self, jwt_handler):
        """Test that _encode_jwt creates a properly structured JWT."""
        header = {"alg": "HS256", "typ": "JWT"}
        payload = {
            "sub": "user123",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes=30)
        }

        token = jwt_handler._encode_jwt(header, payload)

        # JWT should have 3 parts separated by dots
        assert token.count(".") == 2
        assert isinstance(token, str)

    def test_encode_jwt_respects_custom_payload(self, jwt_handler):
        """Test that _encode_jwt correctly encodes custom payload data."""
        header = {"alg": "HS256", "typ": "JWT"}
        custom_payload = {
            "sub": "custom_user",
            "role": "admin",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes=30)
        }

        token = jwt_handler._encode_jwt(header, custom_payload)
        decoded = jwt.decode(token, jwt_handler.SECRET_KEY, algorithms=["HS256"])

        assert decoded["sub"] == "custom_user"
        assert decoded["role"] == "admin"

    def test_multiple_tokens_for_same_user_are_different(self, jwt_handler):
        """Test that generating multiple tokens for the same user produces different tokens."""
        user_id = "user123"
        token1 = jwt_handler.generate_jwt(user_id)
        time.sleep(1)
        token2 = jwt_handler.generate_jwt(user_id)

        # Tokens should be different due to different iat timestamps
        assert token1 != token2

    def test_tokens_for_different_users_are_different(self, jwt_handler):
        """Test that tokens for different users are distinct."""
        token1 = jwt_handler.generate_jwt("user1")
        token2 = jwt_handler.generate_jwt("user2")

        assert token1 != token2

        decoded1 = jwt.decode(token1, jwt_handler.SECRET_KEY, algorithms=["HS256"])
        decoded2 = jwt.decode(token2, jwt_handler.SECRET_KEY, algorithms=["HS256"])

        assert decoded1["sub"] != decoded2["sub"]

    def test_class_constants(self, jwt_handler):
        """Test that class constants are set correctly."""
        assert jwt_handler.SECRET_KEY == "I'm super secret and never change"
        assert jwt_handler.ALG == "HS256"
        assert jwt_handler.TOKEN_EXPIRATION_MINUTES == 30

    def test_validate_jwt_with_none(self, jwt_handler):
        """Test that _validate_jwt handles None input gracefully."""
        assert jwt_handler.validate_jwt(None) is False

    @pytest.mark.parametrize("user_id", [
        "user123",
        "admin@example.com",
        "12345",
        "user-with-dashes",
        "user_with_underscores",
    ])
    def test_generate_jwt_with_various_user_ids(self, jwt_handler, user_id):
        """Test that generate_jwt works with various user ID formats."""
        token = jwt_handler.generate_jwt(user_id)
        decoded = jwt.decode(token, jwt_handler.SECRET_KEY, algorithms=["HS256"])
        assert decoded["sub"] == user_id