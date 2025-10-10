# jwt_token.py
#  https://www.youtube.com/watch?v=7Q17ubqLfaM


from datetime import datetime, timedelta

import jwt


class JwtToken:
    """
    Handles JWT token generation and validation for user authentication.

    Uses HS256 algorithm with a 30-minute token expiration period.
    """
    SECRET_KEY = "I'm super secret and never change"
    ALG = "HS256"
    TOKEN_EXPIRATION_MINUTES = 30

    def generate_jwt(self, user_id: str) -> str:
        """
        Generate a JWT token for a given user.

        :param user_id: Unique identifier for the user
        :return: Encoded JWT token as a string
        """
        header = {
            "alg": self.ALG,
            "typ": "JWT"
        }
        payload = {
            "sub": user_id,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes=self.TOKEN_EXPIRATION_MINUTES)
        }
        return self._encode_jwt(header, payload)

    def _validate_jwt(self, encoded_jwt: str) -> bool:
        """
        Validate a JWT token's signature and expiration.

        :param encoded_jwt: The encoded JWT token to validate
        :return: True if token is valid, False otherwise
        """
        try:
            return bool(
                jwt.decode(encoded_jwt, self.SECRET_KEY, algorithms=["HS256"])
            )
        except:
            return False

    def _encode_jwt(self, header: dict, payload: dict) -> str:
        """
        Encode header and payload into a JWT token.

        :param header: JWT header containing algorithm and type
        :param payload: JWT payload containing claims
        :return: Encoded JWT token as a string
        """
        return jwt.encode(
            payload,
            self.SECRET_KEY,
            algorithm="HS256",
            headers=header
        )
