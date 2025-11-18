# MFA Testing Guide - Netlify Deployment

## Deployment Status

✅ **Frontend deployed successfully!**

- **Production URL**: https://keen-valkyrie-d0ccf6.netlify.app
- **Unique deploy URL**: https://691ccb3a6710c717593cf437--keen-valkyrie-d0ccf6.netlify.app

## Required Setup Steps

### 1. Configure Environment Variable

The deployment needs the API URL configured to connect to the backend:

1. Go to your Netlify dashboard: https://app.netlify.com
2. Find your site "keen-valkyrie-d0ccf6"
3. Go to: **Site settings** → **Build & deploy** → **Environment**
4. Click **Environment variables** and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://password-manager-backend-ts4ajixepa-uw.a.run.app`
5. Go to **Deploys** tab and click **Trigger deploy** → **Deploy site**

### 2. Verify Backend is Running

The backend should be accessible at: https://password-manager-backend-ts4ajixepa-uw.a.run.app

Test backend connectivity:

```bash
curl -I https://password-manager-backend-ts4ajixepa-uw.a.run.app/health
```

## MFA Testing Steps

### Test 1: User Registration & Login

1. **Open**: https://keen-valkyrie-d0ccf6.netlify.app
2. **Register** a new user account
3. **Login** with the new credentials

### Test 2: MFA Setup

1. After login, navigate to **MFA Setup** page
2. **Generate QR Code** - this should work without "Expected a string value" errors
3. **Scan QR Code** with authenticator app (Google Authenticator, Authy, etc.)
4. Verify QR code displays correctly

### Test 3: MFA Verification

1. **Enter TOTP code** from your authenticator app
2. **Verify** the code - this should work without "Invalid TOTP code" errors
3. **Complete MFA setup** successfully

### Test 4: Subsequent Logins

1. **Logout** and login again
2. **Enter TOTP code** when prompted
3. **Verify** successful authentication with MFA

## Test Scenarios to Verify

### ✅ Positive Test Cases

- [ ] User registration works
- [ ] QR code generation works
- [ ] TOTP verification with valid codes works
- [ ] JWT token generation works
- [ ] MFA-protected login works

### ❌ Negative Test Cases

- [ ] Invalid TOTP codes are properly rejected
- [ ] Missing username/code shows appropriate error
- [ ] User not found shows appropriate error
- [ ] TOTP not set up shows appropriate error

### 🔒 Security Test Cases

- [ ] No "Expected a string value" errors
- [ ] No sensitive data in error messages
- [ ] JWT tokens are properly generated
- [ ] Type validation prevents injection attacks

## Expected Results After Fix

### Before the Fix (Issues)

- ❌ "Expected a string value" error during MFA setup
- ❌ "Invalid TOTP code" error even with valid codes
- ❌ JWT token generation failures
- ❌ MFA verification completely blocked

### After the Fix (Expected)

- ✅ QR code generation works
- ✅ TOTP verification with valid codes works
- ✅ JWT tokens generate successfully
- ✅ MFA setup and verification complete successfully
- ✅ Clear error messages for invalid inputs

## Troubleshooting

### Common Issues

**Issue**: "Expected a string value" error persists

- **Solution**: Ensure `VITE_API_URL` environment variable is set in Netlify

**Issue**: Backend connection fails

- **Solution**: Verify backend is running at https://password-manager-backend-ts4ajixepa-uw.a.run.app

**Issue**: QR code doesn't display

- **Solution**: Check browser console for errors, ensure CORS is configured

**Issue**: TOTP verification fails

- **Solution**: Ensure time synchronization between device and server

### Debug Steps

1. Check browser developer console for errors
2. Verify network requests to backend are successful
3. Check Netlify function logs for server-side errors
4. Verify environment variables are properly set

## Testing Tools

### Browser Developer Tools

- **Console**: Check for JavaScript errors
- **Network**: Monitor API requests/responses
- **Application**: Check localStorage for JWT tokens

### Authenticator Apps

- Google Authenticator
- Authy
- Microsoft Authenticator
- Any TOTP-compatible app

## Success Criteria

The MFA fix is successful when:

- ✅ Users can complete MFA setup without errors
- ✅ TOTP verification works with valid codes
- ✅ Invalid codes are properly rejected
- ✅ JWT tokens are generated successfully
- ✅ No "Expected a string value" errors occur
- ✅ No "Invalid TOTP code" errors with valid codes

## Next Steps After Testing

1. **Document results** in the PR
2. **Update testing status** in the PR template
3. **Verify all test scenarios** pass
4. **Prepare for merge** if all tests pass
