#!/usr/bin/env python3
"""
Test script to verify TOTP functionality after fixes
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app.service.totp_service import TotpService
import pyotp


def test_totp_functionality():
    """Test TOTP secret generation, QR code URI, and verification"""
    print("Testing TOTP functionality...")

    # Initialize TOTP service
    totp = TotpService()

    # Test 1: Secret generation
    print("\n1. Testing secret generation...")
    secret = totp.generate_secret()
    print(f"✓ Generated secret: {secret[:20]}...")
    assert len(secret) <= 255, "Secret too long for database"
    assert secret.isalnum(), "Secret contains invalid characters"

    # Test 2: QR code URI generation
    print("\n2. Testing TOTP URI generation...")
    uri = pyotp.TOTP(secret).provisioning_uri(
        name="test@example.com", issuer_name="Capstone Password Manager"
    )
    print(f"✓ Generated TOTP URI: {uri[:80]}...")
    assert uri.startswith("otpauth://totp/"), "Invalid TOTP URI format"
    assert "secret=" in uri, "Missing secret in URI"

    # Test 3: Code generation and verification
    print("\n3. Testing code verification...")
    totp_generator = pyotp.TOTP(secret)
    current_code = totp_generator.now()
    print(f"✓ Current code: {current_code}")
    assert len(current_code) == 6, "Code not 6 digits"
    assert current_code.isdigit(), "Code contains non-digits"

    # Test 4: Verify the code
    print("\n4. Testing verification...")
    is_valid = totp.verify_totp_code(secret, current_code)
    print(f"✓ Code verification: {is_valid}")
    assert is_valid, "Code verification failed"

    # Test 5: Test with invalid code
    print("\n5. Testing invalid code rejection...")
    is_valid_invalid = totp.verify_totp_code(secret, "000000")
    print(f"✓ Invalid code rejected: {not is_valid_invalid}")
    assert not is_valid_invalid, "Invalid code was accepted"

    print("\n✅ All TOTP functionality tests passed!")
    return True


if __name__ == "__main__":
    try:
        test_totp_functionality()
        print("\n🎉 TOTP fixes are working correctly!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
