# argon_service.py

from argon2 import PasswordHasher


class Argon2Service:
    """Wrapper class for Argon2 password hashing operations."""

    def __init__(self):
        """Initialize the Argon2 password hasher with default parameters."""
        self._ph = PasswordHasher()

    def hash_password(self, string: str) -> str:
        """
        Hash a password using Argon2.

        :param string: The string to hash (typically a password)
        :return: The Argon2 hash string
        """
        return self._ph.hash(string)

    def verify_hash(self, hashed_password: str, password: str) -> bool:
        """
        Verify that a password matches the given hash.

        :param hashed_password: The Argon2 hash to verify against
        :param password: The plaintext password to verify
        :return: True if the string matches the hash, False otherwise
        """
        try:
            return self._ph.verify(hashed_password, password)
        except Exception:
            return False

    def check_needs_rehash(self, hashed_password: str) -> bool:
        """
        Check if a hash needs to be regenerated with current parameters.

        :param hashed_password: The Argon2 hash to check
        :return: True if the hash should be regenerated, False otherwise
        """
        return self._ph.check_needs_rehash(hashed_password)
