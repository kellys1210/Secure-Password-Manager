# input_validation_service.py

import re
from typing import Any, Union


class InputValidationService:
    """
    Validates and sanitizes user input from the front end.
    Provides protection against XSS attacks and ensures data integrity.
    """

    @staticmethod
    def is_valid_master_username(username: str) -> bool:
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
        if len(username) < 1 or len(username) > 80:
            return False

        # Username contains only alphanumeric characters, underscores and hyphens
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            return False

        return True

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
        if len(master_password) < 8 or len(master_password) > 255:
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
        return self.is_valid_master_username(username) and not self._contains_xss_risk(username)

    def is_valid_application_password(self, password: str) -> bool:
        """
        Validates application password.

        Note: Application passwords are displayed to users on the front end.
        Use contains_xss_risk() to check for potentially malicious content.
        Validation requirements are currently the same as master password.

        :param password: The application password to validate
        :return: True if valid, False otherwise
        """
        return self.is_valid_master_password(password) and not self._contains_xss_risk(password)

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
        if re.search(r'<[^>]*>', user_input):
            return True

        # Check for common XSS patterns
        xss_patterns = [
            r'javascript:',
            r'on\w+\s*=',  # Event handlers like onclick=, onload=
            r'<script',
            r'</script',
            r'<iframe',
            r'<object',
            r'<embed',
        ]

        for pattern in xss_patterns:
            if re.search(pattern, user_input, re.IGNORECASE):
                return True

        return False
