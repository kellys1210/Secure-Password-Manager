# totp_route.py

"""
QR Code Generator for TOTP Authentication

This module generates QR codes containing TOTP secrets for two-factor authentication.
The QR codes follow the Key URI Format specification and can be scanned by authenticator apps
like Google Authenticator, Authy, or Microsoft Authenticator.
"""
import io

import pyotp
import qrcode
from PIL.Image import Image


class Totp:
    """Generates QR codes for TOTP (Time-based One-Time Password) authentication."""

    ISSUER = "Capstone Password Manager"

    def generate_qr_code_image(self, secret: str, username: str) -> io.BytesIO:
        """
        Generate a QR code image containing a TOTP secret for the given username.

        :param secret: Base32-encoded secret key for TOTP authentication
        :param username: The username/email to associate with this TOTP secret
        :return: BytesIO buffer containing PNG image data of the QR code
        """
        if not secret or not username or not self.ISSUER:
            raise ValueError("Secret, username, or issuer not provided when trying to generated a QR code image.")

        totp_uri = self._get_totp_uri(
            secret=secret,
            username=username,
            issuer=self.ISSUER
        )
        image = self._create_qr(totp_uri)
        image_bytes = self._convert_image_to_bytesio(image)

        return image_bytes

    @staticmethod
    def generate_secret() -> str:
        """
        Generate a random base32-encoded secret for TOTP.

        :return: A 32-character base32 string suitable for TOTP
        """
        return pyotp.random_base32()

    @staticmethod
    def verify_totp_code(secret: str, user_code: str) -> bool:
        """
        Verify a TOTP code against the stored secret.

        :param secret: The base32-encoded secret stored in your database
        :param user_code: The 6-digit code entered by the user
        :return: True if the code is valid, False otherwise
        """
        if not secret or not user_code:
            raise ValueError("Secret or User Code not provided when trying to verify TOTP code.")
        totp = pyotp.TOTP(secret)
        return totp.verify(user_code)  # Default 30 second validity

    @staticmethod
    def _get_totp_uri(secret: str, username: str, issuer: str) -> str:
        """
        Create a TOTP URI following the Key URI Format specification.

        The URI format is: otpauth://totp/ISSUER:USERNAME?secret=SECRET&issuer=ISSUER

        :param secret: Base32-encoded secret key
        :param username: Account identifier (username or email)
        :param issuer: Service name displayed in authenticator app
        :return: Formatted TOTP URI string ready for QR code encoding
        """
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=username,
            issuer_name=issuer
        )

    @staticmethod
    def _convert_image_to_bytesio(image: Image) -> io.BytesIO:
        """
        Convert a PIL (Python Image Library) Image to a BytesIO buffer in PNG format.
        BytesIO object is data stored in memory to avoid saving the file to a hard drive.

        :param image: PIL Image object to convert
        :return: BytesIO buffer containing PNG image data, positioned at start
        """
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer

    @staticmethod
    def _create_qr(data: str) -> Image:
        """
        Create a QR code image from the given data string.

        :param data: The string data to encode in the QR code
        :return: PIL Image object containing the QR code
        """
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(data)
        qr.make(fit=True)
        return qr.make_image(fill_color="black", back_color="white")
