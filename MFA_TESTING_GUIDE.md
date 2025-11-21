# MFA Testing Guide

## Overview

This guide covers testing the Multi-Factor Authentication (MFA) implementation using TOTP (Time-based One-Time Password) for the Password Manager application.

## Current Status

- **Backend Deployment**: In progress (showing 503 Service Unavailable)
- **TOTP Service Unit Tests**: ✅ All 30 tests passed
- **Integration Test Script**: ✅ Created (`test_mfa_integration.py`)

## Test Environment Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Required Python packages installed
- Backend service accessible (local or deployed)

### Local Testing Setup

```bash
# Set up environment variables
export FLASK_ENV=testing
export DATABASE_URL=sqlite:///:memory:

# Run TOTP service unit tests
python3 -m pytest tests/test_totp_service.py -v

# Run integration tests
python3 test_mfa_integration.py
```

## Test Coverage

### 1. TOTP Service Unit Tests (✅ Completed)

**File**: `tests/test_totp_service.py`
**Status**: All 30 tests passed

**Test Categories:**

- **Secret Generation** (4 tests)
  - Returns string
  - Correct length (32 characters)
  - Valid base32 format
  - Unique generation
- **TOTP Verification** (5 tests)
  - Valid code verification
  - Invalid code rejection
  - Wrong length code rejection
  - Non-numeric code rejection
  - Expired code rejection
- **TOTP URI Generation** (2 tests)
  - Correct format
  - Special character handling
- **QR Code Generation** (2 tests)
  - Returns image
  - Handles long data
- **Image Conversion** (4 tests)
  - Returns BytesIO
  - Contains data
  - Correct position
  - Valid PNG format
- **Integration Tests** (9 tests)
  - Full QR code generation flow
  - Various username formats
  - End-to-end secret generation and verification
- **Edge Cases** (4 tests)
  - Empty secret handling
  - Empty code handling
  - Empty username handling
  - Very long username handling

### 2. Integration Tests (✅ Created)

**File**: `test_mfa_integration.py`
**Status**: Ready to run

**Test Flow:**

1. User registration
2. TOTP setup (QR code generation)
3. TOTP verification with valid code
4. TOTP verification with invalid code
5. Error handling for missing fields

**Run Command:**

```bash
python3 test_mfa_integration.py
```

## Manual Testing Procedures

### Once Deployment is Complete

#### Test 1: TOTP Setup Endpoint

```bash
# Register a test user first (if not already registered)
curl -X POST https://password-manager-backend-ts4ajixepa-uw.a.run.app/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"TestPassword123!"}'

# Test TOTP setup
curl -X POST https://password-manager-backend-ts4ajixepa-uw.a.run.app/totp/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com"}' \
  --output qr_code.png

# Expected: QR code image saved as qr_code.png
```

#### Test 2: TOTP Verification Endpoint

```bash
# Generate a valid TOTP code using a tool like Google Authenticator
# or use pyotp to generate one:

python3 -c "import pyotp; print(pyotp.TOTP('SECRET_FROM_DB').now())"

# Test verification with valid code
curl -X POST https://password-manager-backend-ts4ajixepa-uw.a.run.app/totp/verify \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","code":"123456"}'

# Expected: {"message":"TOTP verified successfully","jwt":"<token>"}
```

#### Test 3: Complete MFA Flow

```bash
# 1. Register user
# 2. Setup TOTP (get QR code)
# 3. Scan QR code with authenticator app
# 4. Get code from app
# 5. Verify code
# 6. Receive JWT token
```

### Frontend Testing

#### Test MFA Setup Component

1. Navigate to MFA setup page
2. Verify QR code displays
3. Enter TOTP code from authenticator app
4. Verify successful setup and redirect

#### Test MFA Verification Component

1. Login with username/password
2. Get redirected to MFA verification
3. Enter TOTP code
4. Verify successful login and redirect to vault

## Expected Results

### Successful TOTP Setup

- **Endpoint**: `POST /totp/setup`
- **Status**: 200 OK
- **Response**: PNG image (QR code)
- **Database**: User record updated with TOTP secret

### Successful TOTP Verification

- **Endpoint**: `POST /totp/verify`
- **Status**: 200 OK
- **Response**:

```json
{
  "message": "TOTP verified successfully",
  "jwt": "<jwt_token_string>"
}
```

### Error Cases

- **Missing username/code**: 400 Bad Request
- **Invalid username**: 401 Unauthorized
- **TOTP not set up**: 404 Not Found
- **Invalid TOTP code**: 401 Unauthorized

## Debugging Tips

### Backend Issues

1. Check logs for TOTP secret generation
2. Verify database connection
3. Confirm environment variables:
   - `DATABASE_URL`
   - `FLASK_ENV`
   - `USE_CLOUD_SQL=false`

### TOTP Code Issues

1. Check time synchronization between server and client
2. Verify secret is properly stored in database
3. Test with pyotp to generate valid codes:

```python
import pyotp
secret = "USER_SECRET_FROM_DB"
totp = pyotp.TOTP(secret)
print("Current code:", totp.now())
```

### QR Code Issues

1. Verify QR code can be scanned
2. Check URI format: `otpauth://totp/ISSUER:USERNAME?secret=SECRET&issuer=ISSUER`
3. Test with multiple authenticator apps

## Security Considerations

- TOTP secrets should be encrypted at rest
- JWT tokens should have appropriate expiration
- Rate limiting on verification attempts
- Secure transmission of QR codes

## Next Steps

1. Wait for backend deployment to complete
2. Run manual tests against deployed service
3. Test frontend MFA components
4. Perform end-to-end testing
5. Document any issues found

## Test Results Summary

- **Unit Tests**: ✅ 30/30 passed
- **Integration Tests**: ⏳ Pending deployment
- **Manual Tests**: ⏳ Pending deployment
- **Frontend Tests**: ⏳ Pending deployment
