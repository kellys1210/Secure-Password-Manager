# test_totp_service.py

"""
Unit tests for the TOTP QR Code Generator module.

Tests cover:
- Secret generation
- TOTP verification
- QR code generation
- URI formatting
- Image conversion
"""
import io
import re

import pyotp
import pytest
from PIL import Image
from backend.app.service import TotpService


class TestSecretGeneration:
    """Tests for TOTP secret generation."""

    def test_generate_secret_returns_string(self):
        """Test that generate_secret returns a string."""
        secret = TotpService.generate_secret()
        assert isinstance(secret, str)

    def test_generate_secret_length(self):
        """Test that generated secret is 32 characters long."""
        secret = TotpService.generate_secret()
        assert len(secret) == 32

    def test_generate_secret_is_base32(self):
        """Test that generated secret contains only valid base32 characters."""
        secret = TotpService.generate_secret()
        # Base32 alphabet: A-Z and 2-7
        assert re.match(r'^[A-Z2-7]+$', secret)

    def test_generate_secret_is_unique(self):
        """Test that multiple calls generate different secrets."""
        secrets = {TotpService.generate_secret() for _ in range(10)}
        assert len(secrets) == 10  # All should be unique


class TestTotpVerification:
    """Tests for TOTP code verification."""

    @pytest.fixture
    def valid_secret(self):
        """Fixture providing a valid TOTP secret."""
        return pyotp.random_base32()

    def test_verify_valid_code(self, valid_secret):
        """Test that a valid TOTP code is verified successfully."""
        totp = pyotp.TOTP(valid_secret)
        current_code = totp.now()

        assert TotpService.verify_totp_code(valid_secret, current_code) is True

    def test_verify_invalid_code(self, valid_secret):
        """Test that an invalid TOTP code is rejected."""
        invalid_code = "000000"
        assert TotpService.verify_totp_code(valid_secret, invalid_code) is False

    def test_verify_wrong_length_code(self, valid_secret):
        """Test that codes with wrong length are rejected."""
        assert TotpService.verify_totp_code(valid_secret, "123") is False
        assert TotpService.verify_totp_code(valid_secret, "123456789") is False

    def test_verify_non_numeric_code(self, valid_secret):
        """Test that non-numeric codes are rejected."""
        assert TotpService.verify_totp_code(valid_secret, "abcdef") is False

    def test_verify_expired_code(self, valid_secret):
        """Test that an expired code is rejected."""
        totp = pyotp.TOTP(valid_secret)
        # Get a code from 2 minutes ago (outside validity window)
        import time
        old_code = totp.at(time.time() - 120)
        assert TotpService.verify_totp_code(valid_secret, old_code) is False


class TestTotpUri:
    """Tests for TOTP URI generation."""

    @pytest.fixture
    def totp_instance(self):
        """Fixture providing a Totp instance."""
        return TotpService()

    def test_get_totp_uri_format(self, totp_instance):
        """Test that URI follows the correct format."""
        secret = "JBSWY3DPEHPK3PXP"
        username = "user@example.com"
        issuer = "Test Issuer"

        uri = totp_instance._get_totp_uri(secret, username, issuer)

        user_name_uri = "user%40example.com"
        expected = f"otpauth://totp/Test%20Issuer:{user_name_uri}?secret={secret}&issuer=Test%20Issuer"
        assert uri == expected

    def test_get_totp_uri_with_special_characters(self, totp_instance):
        """Test URI generation with special characters in username."""
        secret = "JBSWY3DPEHPK3PXP"
        username = "user+test@example.com"
        issuer = "Test Issuer"

        uri = totp_instance._get_totp_uri(secret, username, issuer)

        user_name_uri = "user%2Btest%40example.com"
        expected = f"otpauth://totp/Test%20Issuer:{user_name_uri}?secret={secret}&issuer=Test%20Issuer"
        assert uri == expected


class TestQrCodeGeneration:
    """Tests for QR code image generation."""

    @pytest.fixture
    def totp_instance(self):
        """Fixture providing a Totp instance."""
        return TotpService()

    def test_create_qr_returns_image(self, totp_instance):
        """Test that _create_qr returns a qrcode PilImage."""
        from qrcode.image.pil import PilImage

        data = "test data"
        img = totp_instance._create_qr(data)
        assert isinstance(img, PilImage)

    def test_create_qr_with_long_data(self, totp_instance):
        """Test QR code creation with long data string."""
        from qrcode.image.pil import PilImage

        data = "x" * 1000
        img = totp_instance._create_qr(data)
        assert isinstance(img, PilImage)


class TestImageConversion:
    """Tests for image to BytesIO conversion."""

    @pytest.fixture
    def sample_image(self):
        """Fixture providing a sample PIL Image."""
        return Image.new('RGB', (100, 100), color='white')

    def test_convert_image_to_bytesio_returns_bytesio(self, sample_image):
        """Test that conversion returns a BytesIO object."""
        result = TotpService._convert_image_to_bytesio(sample_image)
        assert isinstance(result, io.BytesIO)

    def test_convert_image_bytesio_not_empty(self, sample_image):
        """Test that converted BytesIO contains data."""
        result = TotpService._convert_image_to_bytesio(sample_image)
        assert len(result.getvalue()) > 0

    def test_convert_image_bytesio_position(self, sample_image):
        """Test that BytesIO position is at start."""
        result = TotpService._convert_image_to_bytesio(sample_image)
        assert result.tell() == 0

    def test_convert_image_is_valid_png(self, sample_image):
        """Test that converted data is valid PNG format."""
        result = TotpService._convert_image_to_bytesio(sample_image)
        # PNG files start with specific magic bytes
        assert result.getvalue().startswith(b'\x89PNG')


class TestGenerateQrCodeImage:
    """Integration tests for the main QR code generation method."""

    @pytest.fixture
    def totp_instance(self):
        """Fixture providing a Totp instance."""
        return TotpService()

    def test_generate_qr_code_image_returns_bytesio(self, totp_instance):
        """Test that generate_qr_code_image returns BytesIO."""
        secret = TotpService.generate_secret()
        username = "test@example.com"

        result = totp_instance.generate_qr_code_image(secret, username)

        assert isinstance(result, io.BytesIO)

    def test_generate_qr_code_image_contains_data(self, totp_instance):
        """Test that generated QR code contains image data."""
        secret = TotpService.generate_secret()
        username = "test@example.com"

        result = totp_instance.generate_qr_code_image(secret, username)

        assert len(result.getvalue()) > 0

    def test_generate_qr_code_image_is_valid_png(self, totp_instance):
        """Test that generated QR code is valid PNG."""
        secret = TotpService.generate_secret()
        username = "test@example.com"

        result = totp_instance.generate_qr_code_image(secret, username)

        assert result.getvalue().startswith(b'\x89PNG')

    def test_generate_qr_code_can_be_opened_as_image(self, totp_instance):
        """Test that generated QR code can be opened as PIL Image."""
        secret = TotpService.generate_secret()
        username = "test@example.com"

        result = totp_instance.generate_qr_code_image(secret, username)

        # Should be able to open as image without error
        img = Image.open(result)
        assert img.format == 'PNG'

    @pytest.mark.parametrize("username", [
        "simple",
        "user@example.com",
        "user+tag@example.com",
        "user.name@example.com"
    ])
    def test_generate_qr_code_with_different_usernames(self, totp_instance, username):
        """Test QR code generation with various username formats."""
        secret = TotpService.generate_secret()

        result = totp_instance.generate_qr_code_image(secret, username)

        assert isinstance(result, io.BytesIO)
        assert len(result.getvalue()) > 0

    def test_generate_qr_code_integration(self, totp_instance):
        """Full integration test: generate secret, create QR, verify code."""
        # Generate secret
        secret = TotpService.generate_secret()
        username = "test@example.com"

        # Generate QR code
        qr_image = totp_instance.generate_qr_code_image(secret, username)
        assert isinstance(qr_image, io.BytesIO)

        # Verify a TOTP code generated from the same secret
        totp = pyotp.TOTP(secret)
        current_code = totp.now()
        assert TotpService.verify_totp_code(secret, current_code) is True

class TestEdgeCases:
    """Tests for edge cases and error handling."""

    @pytest.fixture
    def totp_instance(self):
        """Fixture providing a Totp instance."""
        return TotpService()

    def test_verify_empty_secret(self):
        """Test verification with empty secret."""
        with pytest.raises(ValueError):
            TotpService.verify_totp_code("", "123456")

    def test_verify_empty_code(self):
        """Test verification with empty code."""
        secret = TotpService.generate_secret()
        with pytest.raises(ValueError):
            TotpService.verify_totp_code(secret, "")

    def test_generate_qr_with_empty_username(self, totp_instance):
        """Test QR generation with empty username."""
        secret = TotpService.generate_secret()
        with pytest.raises(ValueError):
            totp_instance.generate_qr_code_image(secret, "")

    def test_generate_qr_with_very_long_username(self, totp_instance):
        """Test QR generation with very long username."""
        secret = TotpService.generate_secret()
        username = "x" * 200
        result = totp_instance.generate_qr_code_image(secret, username)
        assert isinstance(result, io.BytesIO)
