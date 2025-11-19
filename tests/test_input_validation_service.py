from backend.app.service import InputValidationService


class TestIsValidMasterUsername:
    """Tests for is_valid_master_username method"""

    def setup_method(self):
        """Setup method to create service instance"""
        self.service = InputValidationService()

    def test_valid_username_email_format(self):
        """Test valid username with email format"""
        assert self.service.is_valid_master_username("user@example.com") is True

    def test_valid_username_email_with_numbers(self):
        """Test valid email username with numbers"""
        assert self.service.is_valid_master_username("user123@domain.com") is True

    def test_valid_username_email_with_underscore(self):
        """Test valid email username with underscore in local part"""
        assert self.service.is_valid_master_username("user_name@example.com") is True

    def test_valid_username_email_with_dot(self):
        """Test valid email username with dot in local part"""
        assert self.service.is_valid_master_username("user.name@example.com") is True

    def test_valid_username_short_email(self):
        """Test valid short email"""
        assert self.service.is_valid_master_username("a@b.co") is True

    def test_valid_username_email_max_length(self):
        """Test valid email at maximum length (80 characters)"""
        # Create an email exactly 80 characters: local(64) + @ + domain(15)
        email = "a" * 64 + "@" + "b" * 10 + ".com"
        assert self.service.is_valid_master_username(email) is True

    def test_valid_username_with_leading_trailing_whitespace(self):
        """Test that whitespace is stripped and email is valid"""
        assert self.service.is_valid_master_username("  user@example.com  ") is True

    def test_invalid_username_not_email_alphanumeric(self):
        """Test invalid username - alphanumeric only (not email format)"""
        assert self.service.is_valid_master_username("user123") is False

    def test_invalid_username_not_email_with_underscore(self):
        """Test invalid username - has underscore but not email format"""
        assert self.service.is_valid_master_username("user_name_123") is False

    def test_invalid_username_not_email_with_hyphen(self):
        """Test invalid username - has hyphen but not email format"""
        assert self.service.is_valid_master_username("user-name-123") is False

    def test_invalid_username_not_email_mixed_characters(self):
        """Test invalid username - mixed characters but not email format"""
        assert self.service.is_valid_master_username("User_Name-123") is False

    def test_invalid_username_single_character(self):
        """Test invalid username with single character (not email)"""
        assert self.service.is_valid_master_username("a") is False

    def test_invalid_username_empty_string(self):
        """Test invalid empty username"""
        assert self.service.is_valid_master_username("") is False

    def test_invalid_username_only_whitespace(self):
        """Test invalid username with only whitespace"""
        assert self.service.is_valid_master_username("   ") is False

    def test_invalid_username_too_long(self):
        """Test invalid username exceeding maximum length (over 80 chars)"""
        # Create an email over 80 characters
        email = "a" * 70 + "@example.com"  # This will be over 80 chars
        assert self.service.is_valid_master_username(email) is False

    def test_invalid_username_no_at_symbol(self):
        """Test invalid email - missing @ symbol"""
        assert self.service.is_valid_master_username("userexample.com") is False

    def test_invalid_username_no_domain(self):
        """Test invalid email - missing domain"""
        assert self.service.is_valid_master_username("user@") is False

    def test_invalid_username_no_tld(self):
        """Test invalid email - missing top-level domain"""
        assert self.service.is_valid_master_username("user@domain") is False

    def test_invalid_username_no_local_part(self):
        """Test invalid email - missing local part"""
        assert self.service.is_valid_master_username("@example.com") is False

    def test_invalid_username_with_spaces(self):
        """Test invalid email with spaces"""
        assert self.service.is_valid_master_username("user @example.com") is False
        assert self.service.is_valid_master_username("user@ example.com") is False

    def test_invalid_username_starts_with_dot(self):
        """Test invalid email starting with dot"""
        assert self.service.is_valid_master_username(".user@example.com") is False

    def test_invalid_username_consecutive_dots(self):
        """Test invalid email with consecutive dots"""
        assert self.service.is_valid_master_username("user..name@example.com") is False

    def test_invalid_username_domain_starts_with_dot(self):
        """Test invalid email with domain starting with dot"""
        assert self.service.is_valid_master_username("user@.example.com") is False


class TestIsValidEmail:
    """Tests for is_valid_email method"""

    def test_valid_email_standard_format(self):
        """Test valid standard email format"""
        assert InputValidationService.is_valid_email("user@example.com") is True

    def test_valid_email_with_numbers(self):
        """Test valid email with numbers"""
        assert InputValidationService.is_valid_email("user123@domain.com") is True
        assert InputValidationService.is_valid_email("test456@example.org") is True

    def test_valid_email_with_underscore(self):
        """Test valid email with underscore in local part"""
        assert InputValidationService.is_valid_email("user_name@example.com") is True

    def test_valid_email_with_dot(self):
        """Test valid email with dot in local part"""
        assert InputValidationService.is_valid_email("user.name@company.com") is True
        assert InputValidationService.is_valid_email("first.last@domain.org") is True

    def test_valid_email_short(self):
        """Test valid short email"""
        assert InputValidationService.is_valid_email("a@b.co") is True

    def test_valid_email_subdomain(self):
        """Test valid email with subdomain"""
        assert InputValidationService.is_valid_email("user@mail.example.com") is True

    def test_invalid_email_empty_string(self):
        """Test invalid empty email"""
        assert InputValidationService.is_valid_email("") is False

    def test_invalid_email_no_at_symbol(self):
        """Test invalid email without @ symbol"""
        assert InputValidationService.is_valid_email("notanemail") is False
        assert InputValidationService.is_valid_email("user.example.com") is False

    def test_invalid_email_no_local_part(self):
        """Test invalid email without local part"""
        assert InputValidationService.is_valid_email("@example.com") is False

    def test_invalid_email_no_domain(self):
        """Test invalid email without domain"""
        assert InputValidationService.is_valid_email("user@") is False

    def test_invalid_email_no_tld(self):
        """Test invalid email without top-level domain"""
        assert InputValidationService.is_valid_email("user@domain") is False

    def test_invalid_email_with_spaces(self):
        """Test invalid email with spaces"""
        assert InputValidationService.is_valid_email("user @example.com") is False
        assert InputValidationService.is_valid_email("user@ example.com") is False
        assert InputValidationService.is_valid_email("user@exam ple.com") is False

    def test_invalid_email_consecutive_dots(self):
        """Test invalid email with consecutive dots"""
        assert InputValidationService.is_valid_email("user..name@example.com") is False

    def test_invalid_email_starts_with_dot(self):
        """Test invalid email starting with dot"""
        assert InputValidationService.is_valid_email(".user@example.com") is False

    def test_invalid_email_ends_with_dot(self):
        """Test invalid email ending with dot"""
        assert InputValidationService.is_valid_email("user@example.com.") is False

    def test_invalid_email_domain_starts_with_dot(self):
        """Test invalid email with domain starting with dot"""
        assert InputValidationService.is_valid_email("user@.com") is False

    def test_invalid_email_just_at_symbol(self):
        """Test invalid email that is just @ symbol"""
        assert InputValidationService.is_valid_email("@") is False

    def test_invalid_email_multiple_at_symbols(self):
        """Test invalid email with multiple @ symbols"""
        assert InputValidationService.is_valid_email("user@@example.com") is False
        assert InputValidationService.is_valid_email("user@domain@example.com") is False

    def test_invalid_email_uppercase_letters(self):
        """Test that uppercase letters are rejected (based on current regex)"""
        # Note: Current regex only accepts lowercase
        assert InputValidationService.is_valid_email("User@Example.com") is False
        assert InputValidationService.is_valid_email("USER@EXAMPLE.COM") is False


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
        password = "a" * 513
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

    def test_invalid_application_username_empty_string(self):
        """Test invalid empty application username"""
        assert self.service.is_valid_application_username("") is False

    def test_valid_application_username_at_max_length(self):
        """Test valid application username at 80 characters"""
        username = "a" * 80
        assert self.service.is_valid_application_username(username) is True

    def test_invalid_application_username_too_long(self):
        """Test invalid application username over 80 characters"""
        username = "a" * 81
        assert self.service.is_valid_application_username(username) is False


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
        assert self.service.is_valid_application_password("javascript:alert(1)password") is False

    def test_invalid_application_password_with_event_handler(self):
        """Test invalid application password with event handlers"""
        assert self.service.is_valid_application_password("onclick=alert(1)password") is False

    def test_invalid_application_password_too_short(self):
        """Test invalid application password below minimum length"""
        assert self.service.is_valid_application_password("short") is False

    def test_invalid_application_password_empty_string(self):
        """Test invalid empty application password"""
        assert self.service.is_valid_application_password("") is False

    def test_valid_application_password_at_max_length(self):
        """Test valid application password at 255 characters"""
        password = "a" * 255
        assert self.service.is_valid_application_password(password) is True

    def test_invalid_application_password_too_long(self):
        """Test invalid application password over 255 characters"""
        password = "a" * 513
        assert self.service.is_valid_application_password(password) is False


class TestCleanInput:
    """Tests for clean_input method"""

    def test_clean_input_with_leading_whitespace(self):
        """Test cleaning input with leading whitespace"""
        assert InputValidationService.clean_input("  hello") == "hello"

    def test_clean_input_with_trailing_whitespace(self):
        """Test cleaning input with trailing whitespace"""
        assert InputValidationService.clean_input("hello  ") == "hello"

    def test_clean_input_with_both_whitespace(self):
        """Test cleaning input with both leading and trailing whitespace"""
        assert InputValidationService.clean_input("  hello  ") == "hello"

    def test_clean_input_no_whitespace(self):
        """Test cleaning input with no whitespace"""
        assert InputValidationService.clean_input("hello") == "hello"

    def test_clean_input_with_internal_whitespace(self):
        """Test cleaning input preserves internal whitespace"""
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


class TestIsValidApplicationName:
    def test_valid_application_name(self):
        """Test that valid application names are accepted."""
        validator = InputValidationService()
        assert validator.is_valid_application_name("Google")
        assert validator.is_valid_application_name("My Bank Account")
        assert validator.is_valid_application_name("Work Email 2024")
        assert validator.is_valid_application_name("a")  # Minimum length
        assert validator.is_valid_application_name("A" * 120)  # Maximum length

    def test_application_name_too_short(self):
        """Test that empty application names are rejected."""
        validator = InputValidationService()
        assert not validator.is_valid_application_name("")

    def test_application_name_too_long(self):
        """Test that application names exceeding 120 characters are rejected."""
        validator = InputValidationService()
        assert not validator.is_valid_application_name("A" * 121)
        assert not validator.is_valid_application_name("A" * 200)

    def test_application_name_with_special_characters(self):
        """Test that application names with special characters are accepted."""
        validator = InputValidationService()
        assert validator.is_valid_application_name("My-App")
        assert validator.is_valid_application_name("App_Name")
        assert validator.is_valid_application_name("App.Name")
        assert validator.is_valid_application_name("App (Personal)")
        assert validator.is_valid_application_name("Email #1")

    def test_application_name_xss_script_tag(self):
        """Test that application names containing script tags are rejected."""
        validator = InputValidationService()
        assert not validator.is_valid_application_name("<script>alert('xss')</script>")
        assert not validator.is_valid_application_name("App<script>alert('xss')</script>")

    def test_application_name_xss_html_tags(self):
        """Test that application names containing HTML tags are rejected."""
        validator = InputValidationService()
        assert not validator.is_valid_application_name("<div>App Name</div>")
        assert not validator.is_valid_application_name("<img src='x' onerror='alert(1)'>")
        assert not validator.is_valid_application_name("<iframe src='malicious.com'></iframe>")

    def test_application_name_xss_javascript_protocol(self):
        """Test that application names with javascript: protocol are rejected."""
        validator = InputValidationService()
        assert not validator.is_valid_application_name("javascript:alert('xss')")
        assert not validator.is_valid_application_name("App javascript:void(0)")

    def test_application_name_xss_event_handlers(self):
        """Test that application names with event handlers are rejected."""
        validator = InputValidationService()
        assert not validator.is_valid_application_name("App onclick=alert('xss')")
        assert not validator.is_valid_application_name("App onload=malicious()")
        assert not validator.is_valid_application_name("App onmouseover=steal()")

    def test_application_name_with_numbers(self):
        """Test that application names with numbers are accepted."""
        validator = InputValidationService()
        assert validator.is_valid_application_name("App123")
        assert validator.is_valid_application_name("2024 Tax Software")
        assert validator.is_valid_application_name("Version 3.0")

    def test_application_name_with_unicode(self):
        """Test that application names with unicode characters are accepted."""
        validator = InputValidationService()
        assert validator.is_valid_application_name("Café Application")
        assert validator.is_valid_application_name("日本語アプリ")
        assert validator.is_valid_application_name("App™")


class TestEdgeCases:
    """Tests for edge cases and integration scenarios"""

    def setup_method(self):
        """Setup method to create service instance"""
        self.service = InputValidationService()

    def test_username_with_maximum_length_and_whitespace(self):
        """Test email username at max length with surrounding whitespace"""
        # Create valid email at 80 chars, add whitespace
        email = "a" * 64 + "@" + "b" * 10 + ".com"  # 80 chars exactly
        username = "  " + email + "  "
        assert self.service.is_valid_master_username(username) is True

    def test_username_that_becomes_empty_after_strip(self):
        """Test username that is only whitespace"""
        assert self.service.is_valid_master_username("   ") is False

    def test_password_with_maximum_length_and_whitespace(self):
        """Test password at max length with surrounding whitespace"""
        # 255 chars + whitespace should strip to 255 chars
        password = "  " + "a" * 255 + "  "
        assert InputValidationService.is_valid_master_password(password) is True

    def test_application_username_combines_both_validations(self):
        """Test that application username checks both format and XSS"""
        # Valid format but contains XSS
        assert self.service.is_valid_application_username("user<script>") is False
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

    def test_master_username_email_validation_integration(self):
        """Test that master username properly validates email format and length"""
        # Valid email within length
        assert self.service.is_valid_master_username("test@example.com") is True
        # Invalid - not email format
        assert self.service.is_valid_master_username("testuser") is False
        # Invalid - email too long
        long_email = "a" * 70 + "@example.com"
        assert self.service.is_valid_master_username(long_email) is False
