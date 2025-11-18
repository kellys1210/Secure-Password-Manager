#!/usr/bin/env python3
"""
Create a test user with MFA for QR code testing
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app import db
from backend.app.model.user_model import User
from backend.app.service.totp_service import TotpService
from backend.app.service.argon2_service import Argon2Service
from backend.app import create_app

application = create_app()
import pyotp


def create_test_user():
    """Create a test user with MFA enabled"""

    print("🚀 Creating test user for MFA QR code testing...")
    print("=" * 60)

    # Set database configuration to use the Docker PostgreSQL
    import os

    os.environ["DATABASE_URL"] = (
        "postgresql://passwordmanager:testpassword@password-manager-db:5432/passwordmanager"
    )
    os.environ["USE_CLOUD_SQL"] = "false"

    # Reinitialize the app with the new configuration
    global application
    application = create_app()

    # Test user credentials
    test_username = "testuser_mfa"
    test_password = "TestPassword123!"

    with application.app_context():
        try:
            # Check if user already exists
            existing_user = User.query.filter_by(username=test_username).first()

            if existing_user:
                print(f"✓ User '{test_username}' already exists")
                user = existing_user
            else:
                # Create new user
                print(f"⏳ Creating new user: {test_username}")

                # Hash the password
                argon2 = Argon2Service()
                password_hash = argon2.hash_password(test_password)

                # Create user
                user = User(username=test_username, password=password_hash)
                db.session.add(user)
                db.session.commit()
                print(f"✅ User '{test_username}' created successfully")

            # Generate TOTP secret
            print(f"\n⏳ Generating TOTP secret for {test_username}...")
            totp = TotpService()
            secret = totp.generate_secret()

            # Store secret in database
            user.secret = secret
            db.session.commit()
            print(f"✅ TOTP secret generated and stored")

            # Generate QR code
            print(f"\n⏳ Generating QR code...")
            qr_image = totp.generate_qr_code_image(secret, test_username)

            # Save QR code to file
            qr_filename = f"qr_code_{test_username}.png"
            with open(qr_filename, "wb") as f:
                f.write(qr_image.getvalue())

            print(f"✅ QR code saved as: {qr_filename}")

            # Display TOTP URI for manual entry
            totp_uri = pyotp.TOTP(secret).provisioning_uri(
                name=test_username, issuer_name="Capstone Password Manager"
            )

            print(f"\n" + "=" * 60)
            print(f"🎉 TEST USER CREATED SUCCESSFULLY!")
            print(f"=" * 60)
            print(f"\n📋 USER CREDENTIALS:")
            print(f"   Username: {test_username}")
            print(f"   Password: {test_password}")
            print(f"\n🔐 MFA SETUP:")
            print(f"   QR Code File: {qr_filename}")
            print(f"\n📱 TO SETUP MFA:")
            print(
                f"   1. Open your authenticator app (Google Authenticator, Authy, etc.)"
            )
            print(f"   2. Scan the QR code: {qr_filename}")
            print(f"   OR manually enter:")
            print(f"   3. Account: {test_username}")
            print(f"   4. Key: {secret}")
            print(f"   5. Type: TOTP (Time-based)")
            print(f"\n🔍 TO TEST VERIFICATION:")
            print(f"   Use the 6-digit code from your authenticator app")
            print(f"   at: https://deploy-preview-44--secure-pw-manager.netlify.app")
            print(f"\n" + "=" * 60)

            return True

        except Exception as e:
            print(f"❌ Error: {e}")
            db.session.rollback()
            return False


if __name__ == "__main__":
    success = create_test_user()
    if success:
        print("\n✨ Test user ready for MFA testing!")
    else:
        print("\n💥 Failed to create test user")
        sys.exit(1)
