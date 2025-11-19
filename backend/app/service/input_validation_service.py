# input_validation_service.py

import re
from typing import Any


class InputValidationService:
    """
    Validates and sanitizes user input from the front end.
    Provides protection against XSS attacks and ensures data integrity.
    """

    def is_valid_master_username(self, username: str) -> bool:
        """
        Validates that a master username meets security requirements.

        Requirements:
        - Length: 1-80 characters
        - Characters: alphanumeric, underscores, and hyphens only

        :param username: The username string to validate
        :return: True if valid, False otherwise
        """
        username = username.strip()

        # Username is correct length
        if not (1 <= len(username) <= 80):
            return False
        return self.is_valid_email(username)

    @staticmethod
    def is_valid_master_password(master_password: str) -> bool:
        """
        Validates that a master password meets minimum security requirements.

        Requirements:
        - Minimum length: 8 characters

        :param master_password: The password string to validate
        :return: True if valid, False otherwise
        """
        master_password = master_password.strip()

        # Password meets minimum length requirement
        if not (8 <= len(master_password) <= 512):
            return False

        return True

    def is_valid_application_username(self, username: str) -> bool:
        """
        Validates application username.

        Note: Application usernames are displayed to users on the front end.
        Use contains_xss_risk() to check for potentially malicious content.
        Validation requirements are currently the same as master username.

        :param username: The application username to validate
        :return: True if valid, False otherwise
        """
        # Username is correct length
        if 1 <= len(username) <= 80 and not self._contains_xss_risk(username):
            return True
        return False

    def is_valid_application_password(self, password: str) -> bool:
        """
        Validates application password.

        Note: Application passwords are displayed to users on the front end.
        Use contains_xss_risk() to check for potentially malicious content.
        Validation requirements are currently the same as master password.

        :param password: The application password to validate
        :return: True if valid, False otherwise
        """
        return self.is_valid_master_password(password) and not self._contains_xss_risk(
            password
        )

    def is_valid_application_name(self, application_name: str):
        """
        Validates application name.

        Note: Application names are displayed to users on the front end.
        Use contains_xss_risk() to check for potentially malicious content.
        Validation requirements are currently the same as master username.

        :param application_name: The application name to store
        :return: True if valid, False otherwise
        """
        # Name is correct length
        if 1 <= len(application_name) <= 120 and not self._contains_xss_risk(application_name):
            return True
        return False


    @staticmethod
    def clean_input(user_input: Any) -> str:
        """
        Cleans user input by stripping whitespace.

        Note: This method only strips whitespace. For XSS protection when
        displaying data to users, use contains_xss_risk().

        :param user_input: The input to clean
        :return: Cleaned input with leading/trailing whitespace removed
        """
        if isinstance(user_input, str):
            return user_input.strip()
        return str(user_input).strip()

    @staticmethod
    def is_valid_email(email: str) -> bool:
        """
        Validates if a string is a valid email address format.

        Uses regex pattern matching to verify the email structure contains
        valid characters, an @ symbol, and a domain with extension.

        :param email: The email address to validate
        :return: True if email format is valid, False otherwise
        """
        valid_email_regex = r"^[a-zA-Z0-9_]+[\._]?[a-zA-Z0-9_]*[@]\w+[\w.-]*[.]\w+$"
        return bool(re.match(valid_email_regex, email))

    @staticmethod
    def _contains_xss_risk(user_input: str) -> bool:
        """
        Checks if user input contains potentially dangerous characters for XSS attacks.

        This method detects common XSS patterns including HTML tags, JavaScript protocols,
        and event handlers. Use this to reject inputs that may pose security risks.

        Recommended usage: Call this on application usernames/passwords during validation
        and return an error to the user if it returns True.

        :param user_input: The string to check for XSS risk
        :return: True if input contains XSS risk patterns, False otherwise
        """
        if not isinstance(user_input, str):
            user_input = str(user_input)

        # Check for HTML tags
        if re.search(r"<[^>]*>", user_input):
            return True

        # Check for common XSS patterns
        xss_patterns = [
            r"javascript:",
            r"on\w+\s*=",  # Event handlers like onclick=, onload=
            r"<script",
            r"</script",
            r"<iframe",
            r"<object",
            r"<embed",
        ]

        for pattern in xss_patterns:
            if re.search(pattern, user_input, re.IGNORECASE):
                return True

        return False
