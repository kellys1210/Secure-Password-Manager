from backend.app.service import InputValidationService


class TestIsValidMasterUsername:
    """Tests for is_valid_master_username method"""

    def test_valid_username_alphanumeric(self):
        """Test valid alphanumeric username"""
        assert InputValidationService.is_valid_master_username("user123") is True

    def test_valid_username_with_underscore(self):
        """Test valid username with underscores"""
        assert InputValidationService.is_valid_master_username("user_name_123") is True

    def test_valid_username_with_hyphen(self):
        """Test valid username with hyphens"""
        assert InputValidationService.is_valid_master_username("user-name-123") is True

    def test_valid_username_mixed_characters(self):
        """Test valid username with mix of allowed characters"""
        assert InputValidationService.is_valid_master_username("User_Name-123") is True

    def test_valid_username_single_character(self):
        """Test valid username with minimum length (1 character)"""
        assert InputValidationService.is_valid_master_username("a") is True

    def test_valid_username_max_length(self):
        """Test valid username at maximum length (80 characters)"""
        username = "a" * 80
        assert InputValidationService.is_valid_master_username(username) is True

    def test_valid_username_with_leading_trailing_whitespace(self):
        """Test that whitespace is stripped and username is valid"""
        assert InputValidationService.is_valid_master_username("  username  ") is True

    def test_invalid_username_empty_string(self):
        """Test invalid empty username"""
        assert InputValidationService.is_valid_master_username("") is False

    def test_invalid_username_only_whitespace(self):
        """Test invalid username with only whitespace"""
        assert InputValidationService.is_valid_master_username("   ") is False

    def test_invalid_username_too_long(self):
        """Test invalid username exceeding maximum length"""
        username = "a" * 81
        assert InputValidationService.is_valid_master_username(username) is False

    def test_invalid_username_with_special_characters(self):
        """Test invalid username with special characters"""
        assert InputValidationService.is_valid_master_username("user@name") is False
        assert InputValidationService.is_valid_master_username("user#name") is False
        assert InputValidationService.is_valid_master_username("user$name") is False

    def test_invalid_username_with_spaces(self):
        """Test invalid username with spaces in the middle"""
        assert InputValidationService.is_valid_master_username("user name") is False

    def test_invalid_username_with_dots(self):
        """Test invalid username with dots"""
        assert InputValidationService.is_valid_master_username("user.name") is False

    def test_invalid_username_with_unicode(self):
        """Test invalid username with unicode characters"""
        assert InputValidationService.is_valid_master_username("usér") is False
        assert InputValidationService.is_valid_master_username("用户") is False


class TestIsValidMasterPassword:
    """Tests for is_valid_master_password method"""

    def test_valid_password_minimum_length(self):
        """Test valid password with minimum length (8 characters)"""
        assert InputValidationService.is_valid_master_password("12345678") is True

    def test_valid_password_with_special_characters(self):
        """Test valid password with special characters"""
        assert InputValidationService.is_valid_master_password("P@ssw0rd!") is True

    def test_valid_password_with_spaces(self):
        """Test valid password with spaces"""
        assert InputValidationService.is_valid_master_password("pass word 123") is True

    def test_valid_password_max_length(self):
        """Test valid password at maximum length (255 characters)"""
        password = "a" * 255
        assert InputValidationService.is_valid_master_password(password) is True

    def test_valid_password_with_leading_trailing_whitespace(self):
        """Test that whitespace is stripped and password is valid"""
        assert InputValidationService.is_valid_master_password("  password123  ") is True

    def test_invalid_password_too_short(self):
        """Test invalid password below minimum length"""
        assert InputValidationService.is_valid_master_password("1234567") is False

    def test_invalid_password_empty_string(self):
        """Test invalid empty password"""
        assert InputValidationService.is_valid_master_password("") is False

    def test_invalid_password_only_whitespace(self):
        """Test invalid password with only whitespace"""
        assert InputValidationService.is_valid_master_password("       ") is False

    def test_invalid_password_too_long(self):
        """Test invalid password exceeding maximum length"""
        password = "a" * 256
        assert InputValidationService.is_valid_master_password(password) is False

    def test_valid_password_unicode(self):
        """Test valid password with unicode characters"""
        assert InputValidationService.is_valid_master_password("pässwörd") is True


class TestIsValidApplicationUsername:
    """Tests for is_valid_application_username method"""

    def setup_method(self):
        """Setup method to create service instance"""
        self.service = InputValidationService()

    def test_valid_application_username(self):
        """Test valid application username"""
        assert self.service.is_valid_application_username("user123") is True

    def test_valid_application_username_with_underscore(self):
        """Test valid application username with underscore"""
        assert self.service.is_valid_application_username("user_name") is True

    def test_invalid_application_username_with_html_tags(self):
        """Test invalid application username with HTML tags"""
        assert self.service.is_valid_application_username("<script>alert('xss')</script>") is False
        assert self.service.is_valid_application_username("user<b>name</b>") is False

    def test_invalid_application_username_with_javascript(self):
        """Test invalid application username with javascript protocol"""
        assert self.service.is_valid_application_username("javascript:alert(1)") is False

    def test_invalid_application_username_with_event_handler(self):
        """Test invalid application username with event handlers"""
        assert self.service.is_valid_application_username("onclick=alert(1)") is False

    def test_invalid_application_username_basic_validation_fails(self):
        """Test that basic username validation is also checked"""
        assert self.service.is_valid_application_username("user@name") is False
        assert self.service.is_valid_application_username("") is False


class TestIsValidApplicationPassword:
    """Tests for is_valid_application_password method"""

    def setup_method(self):
        """Setup method to create service instance"""
        self.service = InputValidationService()

    def test_valid_application_password(self):
        """Test valid application password"""
        assert self.service.is_valid_application_password("password123") is True

    def test_valid_application_password_with_special_chars(self):
        """Test valid application password with allowed special characters"""
        # Note: Special chars are allowed in passwords, but XSS patterns are not
        assert self.service.is_valid_application_password("P@ssw0rd!#$") is True

    def test_invalid_application_password_with_html_tags(self):
        """Test invalid application password with HTML tags"""
        assert self.service.is_valid_application_password("<script>alert('xss')</script>") is False
        assert self.service.is_valid_application_password("pass<b>word</b>") is False

    def test_invalid_application_password_with_javascript(self):
        """Test invalid application password with javascript protocol"""
        assert self.service.is_valid_application_password("javascript:alert(1)") is False

    def test_invalid_application_password_basic_validation_fails(self):
        """Test that basic password validation is also checked"""
        assert self.service.is_valid_application_password("short") is False
        assert self.service.is_valid_application_password("") is False


class TestCleanInput:
    """Tests for clean_input method"""

    def test_clean_input_string(self):
        """Test cleaning a string input"""
        assert InputValidationService.clean_input("  hello  ") == "hello"

    def test_clean_input_no_whitespace(self):
        """Test cleaning input with no whitespace"""
        assert InputValidationService.clean_input("hello") == "hello"

    def test_clean_input_only_leading_whitespace(self):
        """Test cleaning input with only leading whitespace"""
        assert InputValidationService.clean_input("  hello") == "hello"

    def test_clean_input_only_trailing_whitespace(self):
        """Test cleaning input with only trailing whitespace"""
        assert InputValidationService.clean_input("hello  ") == "hello"

    def test_clean_input_tabs_and_newlines(self):
        """Test cleaning input with tabs and newlines"""
        assert InputValidationService.clean_input("\t\nhello\n\t") == "hello"

    def test_clean_input_preserves_internal_whitespace(self):
        """Test that internal whitespace is preserved"""
        assert InputValidationService.clean_input("  hello world  ") == "hello world"

    def test_clean_input_integer(self):
        """Test cleaning integer input"""
        assert InputValidationService.clean_input(123) == "123"

    def test_clean_input_float(self):
        """Test cleaning float input"""
        assert InputValidationService.clean_input(123.45) == "123.45"

    def test_clean_input_boolean(self):
        """Test cleaning boolean input"""
        assert InputValidationService.clean_input(True) == "True"
        assert InputValidationService.clean_input(False) == "False"

    def test_clean_input_none(self):
        """Test cleaning None input"""
        assert InputValidationService.clean_input(None) == "None"

    def test_clean_input_empty_string(self):
        """Test cleaning empty string"""
        assert InputValidationService.clean_input("") == ""

    def test_clean_input_only_whitespace(self):
        """Test cleaning string with only whitespace"""
        assert InputValidationService.clean_input("     ") == ""


class TestContainsXssRisk:
    """Tests for _contains_xss_risk method"""

    def test_safe_input_alphanumeric(self):
        """Test safe alphanumeric input"""
        assert InputValidationService._contains_xss_risk("user123") is False

    def test_safe_input_with_special_chars(self):
        """Test safe input with common special characters"""
        assert InputValidationService._contains_xss_risk("P@ssw0rd!#$%") is False

    def test_safe_input_with_spaces(self):
        """Test safe input with spaces"""
        assert InputValidationService._contains_xss_risk("hello world") is False

    def test_xss_risk_script_tag_lowercase(self):
        """Test detection of lowercase script tag"""
        assert InputValidationService._contains_xss_risk("<script>alert('xss')</script>") is True

    def test_xss_risk_script_tag_uppercase(self):
        """Test detection of uppercase script tag"""
        assert InputValidationService._contains_xss_risk("<SCRIPT>alert('xss')</SCRIPT>") is True

    def test_xss_risk_script_tag_mixed_case(self):
        """Test detection of mixed case script tag"""
        assert InputValidationService._contains_xss_risk("<ScRiPt>alert('xss')</ScRiPt>") is True

    def test_xss_risk_javascript_protocol(self):
        """Test detection of javascript protocol"""
        assert InputValidationService._contains_xss_risk("javascript:alert(1)") is True
        assert InputValidationService._contains_xss_risk("JavaScript:alert(1)") is True

    def test_xss_risk_onclick_event(self):
        """Test detection of onclick event handler"""
        assert InputValidationService._contains_xss_risk("onclick=alert(1)") is True
        assert InputValidationService._contains_xss_risk("onClick=alert(1)") is True

    def test_xss_risk_onload_event(self):
        """Test detection of onload event handler"""
        assert InputValidationService._contains_xss_risk("onload=alert(1)") is True

    def test_xss_risk_onmouseover_event(self):
        """Test detection of onmouseover event handler"""
        assert InputValidationService._contains_xss_risk("onmouseover=alert(1)") is True

    def test_xss_risk_iframe_tag(self):
        """Test detection of iframe tag"""
        assert InputValidationService._contains_xss_risk("<iframe src='evil.com'></iframe>") is True

    def test_xss_risk_object_tag(self):
        """Test detection of object tag"""
        assert InputValidationService._contains_xss_risk("<object data='evil.com'></object>") is True

    def test_xss_risk_embed_tag(self):
        """Test detection of embed tag"""
        assert InputValidationService._contains_xss_risk("<embed src='evil.com'>") is True

    def test_xss_risk_generic_html_tag(self):
        """Test detection of generic HTML tags"""
        assert InputValidationService._contains_xss_risk("<div>content</div>") is True
        assert InputValidationService._contains_xss_risk("<b>bold</b>") is True
        assert InputValidationService._contains_xss_risk("<img src='x'>") is True

    def test_xss_risk_self_closing_tag(self):
        """Test detection of self-closing HTML tags"""
        assert InputValidationService._contains_xss_risk("<img src='x' />") is True
        assert InputValidationService._contains_xss_risk("<br/>") is True

    def test_xss_risk_tag_with_attributes(self):
        """Test detection of tags with attributes"""
        assert InputValidationService._contains_xss_risk("<a href='evil.com'>link</a>") is True

    def test_safe_input_with_angle_brackets_math(self):
        """Test that mathematical angle brackets might be detected (known limitation)"""
        # This is a known limitation - mathematical expressions may be flagged
        result = InputValidationService._contains_xss_risk("5 < 10 and 10 > 5")
        # Documenting current behavior - this will return True due to angle brackets
        assert result is True

    def test_xss_risk_non_string_input(self):
        """Test XSS risk check with non-string input"""
        assert InputValidationService._contains_xss_risk(123) is False
        assert InputValidationService._contains_xss_risk(None) is False

    def test_xss_risk_empty_string(self):
        """Test XSS risk check with empty string"""
        assert InputValidationService._contains_xss_risk("") is False

    def test_xss_risk_event_handler_with_space(self):
        """Test detection of event handler with space before equals"""
        assert InputValidationService._contains_xss_risk("onclick =alert(1)") is True
        assert InputValidationService._contains_xss_risk("onclick  =alert(1)") is True


class TestEdgeCases:
    """Tests for edge cases and integration scenarios"""

    def setup_method(self):
        """Setup method to create service instance"""
        self.service = InputValidationService()

    def test_username_with_maximum_length_and_whitespace(self):
        """Test username at max length with surrounding whitespace"""
        # 80 chars + whitespace should strip to 80 chars
        username = "  " + "a" * 80 + "  "
        assert InputValidationService.is_valid_master_username(username) is True

    def test_username_that_becomes_empty_after_strip(self):
        """Test username that is only whitespace"""
        assert InputValidationService.is_valid_master_username("   ") is False

    def test_password_with_maximum_length_and_whitespace(self):
        """Test password at max length with surrounding whitespace"""
        # 255 chars + whitespace should strip to 255 chars
        password = "  " + "a" * 255 + "  "
        assert InputValidationService.is_valid_master_password(password) is True

    def test_application_username_combines_both_validations(self):
        """Test that application username checks both format and XSS"""
        # Valid format but contains XSS
        assert self.service.is_valid_application_username("user<script>") is False
        # Invalid format
        assert self.service.is_valid_application_username("user@name") is False
        # Valid format and no XSS
        assert self.service.is_valid_application_username("username") is True

    def test_application_password_combines_both_validations(self):
        """Test that application password checks both format and XSS"""
        # Valid format but contains XSS
        assert self.service.is_valid_application_password("password123<script>") is False
        # Invalid format (too short)
        assert self.service.is_valid_application_password("short") is False
        # Valid format and no XSS
        assert self.service.is_valid_application_password("password123") is True

    def test_clean_input_with_various_types(self):
        """Test clean_input handles various input types correctly"""
        assert InputValidationService.clean_input("  text  ") == "text"
        assert InputValidationService.clean_input(42) == "42"
        assert InputValidationService.clean_input(3.14) == "3.14"
        assert InputValidationService.clean_input(True) == "True"
        assert InputValidationService.clean_input([1, 2, 3]) == "[1, 2, 3]"
