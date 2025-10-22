# jwt_token_service.py
#  https://www.youtube.com/watch?v=7Q17ubqLfaM


from datetime import datetime, timedelta
import os
import jwt


class JwtTokenService:
    """
    Handles JWT token generation and validation for user authentication.

    Uses HS256 algorithm with a 30-minute token expiration period.
    """
    JWT_SECRET = os.getenv('JWT_SECRET')
    ALG = "HS256"
    TOKEN_EXPIRATION_MINUTES = 30

    def generate_jwt(self, username: str) -> str:
        """
        Generate a JWT token for a given user.

        :param username: Unique identifier for the user
        :return: Encoded JWT token as a string
        """
        header = {
            "alg": self.ALG,
            "typ": "JWT"
        }
        payload = {
            "sub": username,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes=self.TOKEN_EXPIRATION_MINUTES)
        }
        return self._encode_jwt(header, payload)

    def validate_jwt(self, encoded_jwt: str) -> bool:
        """
        Validate a JWT token's signature and expiration.

        :param encoded_jwt: The encoded JWT token to validate
        :return: True if token is valid, False otherwise
        """
        try:
            return bool(
                jwt.decode(encoded_jwt, self.JWT_SECRET, algorithms=["HS256"])
            )
        except:
            return False

    def get_username_from_jwt(self, encoded_jwt: str) -> str | None:
        """
        Extract the username from a JWT token.

        :param encoded_jwt: The encoded JWT token
        :return: Username if token is valid, None otherwise
        """
        try:
            decoded = jwt.decode(
                encoded_jwt,
                self.JWT_SECRET,
                algorithms=[self.ALG]
            )
            return decoded.get("sub")
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None

    def _encode_jwt(self, header: dict, payload: dict) -> str:
        """
        Encode header and payload into a JWT token.

        :param header: JWT header containing algorithm and type
        :param payload: JWT payload containing claims
        :return: Encoded JWT token as a string
        """
        return jwt.encode(
            payload,
            self.JWT_SECRET,
            algorithm="HS256",
            headers=header
        )


