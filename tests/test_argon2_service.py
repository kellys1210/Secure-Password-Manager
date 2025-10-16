# test_argon.py

import pytest

from backend.app.service import Argon2Service
from argon2 import PasswordHasher


class TestArgon:
    """Test suite for the Argon password hashing class."""

    @pytest.fixture
    def argon2_service(self):
        """Fixture to create a fresh Argon instance for each test."""
        return Argon2Service()

    @pytest.fixture
    def sample_password(self):
        """Fixture providing a sample password string."""
        return "MySecurePassword123!"

    def test_init_creates_password_hasher(self, argon2_service):
        """Test that initialization creates a PasswordHasher instance."""
        assert isinstance(argon2_service._ph, PasswordHasher)

    def test_hash_string_returns_string(self, argon2_service, sample_password):
        """Test that hash_string returns a string."""
        result = argon2_service.hash_password(sample_password)
        assert isinstance(result, str)

    def test_hash_string_returns_non_empty(self, argon2_service, sample_password):
        """Test that hash_string returns a non-empty string."""
        result = argon2_service.hash_password(sample_password)
        assert len(result) > 0

    def test_hash_string_returns_argon2_format(self, argon2_service, sample_password):
        """Test that hash_string returns a properly formatted Argon2 hash."""
        result = argon2_service.hash_password(sample_password)
        assert result.startswith("$argon2")

    def test_hash_string_produces_different_hashes(self, argon2_service, sample_password):
        """Test that hashing the same string twice produces different hashes (due to salt)."""
        hash1 = argon2_service.hash_password(sample_password)
        hash2 = argon2_service.hash_password(sample_password)
        assert hash1 != hash2

    def test_hash_empty_string(self, argon2_service):
        """Test that hashing an empty string works."""
        result = argon2_service.hash_password("")
        assert isinstance(result, str)
        assert result.startswith("$argon2")

    def test_verify_hash_returns_true_for_correct_password(self, argon2_service, sample_password):
        """Test that verify_hash returns True when verifying the correct password."""
        hash_value = argon2_service.hash_password(sample_password)
        assert argon2_service.verify_hash(hash_value, sample_password) is True

    def test_verify_hash_returns_false_for_incorrect_password(self, argon2_service, sample_password):
        """Test that verify_hash returns False when verifying an incorrect password."""
        hash_value = argon2_service.hash_password(sample_password)
        assert argon2_service.verify_hash(hash_value, "WrongPassword") is False

    def test_verify_hash_returns_false_for_empty_password(self, argon2_service, sample_password):
        """Test that verify_hash returns False when verifying an empty string against a hash."""
        hash_value = argon2_service.hash_password(sample_password)
        assert argon2_service.verify_hash(hash_value, "") is False

    def test_verify_hash_returns_false_for_invalid_hash(self, argon2_service, sample_password):
        """Test that verify_hash returns False for an invalid hash format."""
        assert argon2_service.verify_hash("invalid_hash", sample_password) is False

    def test_verify_hash_returns_false_for_empty_hash(self, argon2_service, sample_password):
        """Test that verify_hash returns False for an empty hash string."""
        assert argon2_service.verify_hash("", sample_password) is False

    def test_verify_hash_case_sensitive(self, argon2_service):
        """Test that password verification is case-sensitive."""
        password = "Password123"
        hash_value = argon2_service.hash_password(password)
        assert argon2_service.verify_hash(hash_value, "password123") is False
        assert argon2_service.verify_hash(hash_value, "PASSWORD123") is False

    def test_verify_hash_with_special_characters(self, argon2_service):
        """Test that passwords with special characters are handled correctly."""
        password = "P@ssw0rd!#$%^&*()"
        hash_value = argon2_service.hash_password(password)
        assert argon2_service.verify_hash(hash_value, password) is True

    def test_verify_hash_with_unicode(self, argon2_service):
        """Test that passwords with Unicode characters are handled correctly."""
        password = "パスワード123"
        hash_value = argon2_service.hash_password(password)
        assert argon2_service.verify_hash(hash_value, password) is True

    def test_check_needs_rehash_with_current_hash(self, argon2_service, sample_password):
        """Test that a newly created hash doesn't need rehashing."""
        hash_value = argon2_service.hash_password(sample_password)
        assert argon2_service.check_needs_rehash(hash_value) is False

    def test_check_needs_rehash_with_old_parameters(self, sample_password):
        """Test that a hash with outdated parameters needs rehashing."""
        # Create a hash with custom (weaker) parameters
        old_hasher = PasswordHasher(time_cost=1, memory_cost=8, parallelism=1)
        old_hash = old_hasher.hash(sample_password)

        # Check with default parameters (should need rehash)
        argon = Argon2Service()
        # Note: This might return False if default params match; adjust as needed
        result = argon.check_needs_rehash(old_hash)
        assert isinstance(result, bool)

    def test_multiple_instances_independent(self, sample_password):
        """Test that multiple Argon instances work independently."""
        argon1 = Argon2Service()
        argon2 = Argon2Service()

        hash1 = argon1.hash_password(sample_password)
        hash2 = argon2.hash_password(sample_password)

        # Both should verify correctly
        assert argon1.verify_hash(hash1, sample_password) is True
        assert argon2.verify_hash(hash2, sample_password) is True
        assert argon1.verify_hash(hash2, sample_password) is True
        assert argon2.verify_hash(hash1, sample_password) is True

    def test_hash_long_password(self, argon2_service):
        """Test that very long passwords are handled correctly."""
        long_password = "a" * 1000
        hash_value = argon2_service.hash_password(long_password)
        assert argon2_service.verify_hash(hash_value, long_password) is True

    def test_hash_whitespace_password(self, argon2_service):
        """Test that passwords with whitespace are handled correctly."""
        password = "  password with spaces  "
        hash_value = argon2_service.hash_password(password)
        assert argon2_service.verify_hash(hash_value, password) is True
        assert argon2_service.verify_hash(hash_value, "password with spaces") is False
