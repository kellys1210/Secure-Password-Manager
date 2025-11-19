# Deployment Testing Guide

## Creating a Clean Testing Branch

```bash
# 1. Add all changes
git add .

# 2. Commit with descriptive message
git commit -m "feat: implement Option 2 environment variable fix

- Remove eval() security concern from env.js
- Implement intelligent environment detection
- Add environment-specific .env files (.development, .production)
- Create comprehensive netlify.toml configuration
- Enhance auth.js with proper API base URL logic
- Add documentation and testing files

Fixes #46: Environment variable handling in production"

# 3. Create a new testing branch
git checkout -b feature/env-var-testing

# 4. Push to create remote branch for testing
git push -u origin feature/env-var-testing
```

## Testing Steps

### 1. Netlify Deploy Preview

1. After pushing, Netlify will automatically create a deploy preview
2. Check the Netlify dashboard for the deploy preview URL
3. Test the deploy preview to verify:
   - Frontend loads correctly
   - API calls work with proper backend URL
   - No network errors between frontend and backend

### 2. Environment Variable Verification

1. Open browser developer tools
2. Check Console for any environment-related errors
3. Verify Network tab shows requests to correct backend URL
4. Test login/registration flow to ensure API communication works

### 3. Local Testing (Optional)

```bash
# Test production build locally
cd frontend
npm run build
npm run preview

# Test development environment
npm run dev
```

## Netlify Configuration Verification

Ensure these are set in Netlify Dashboard:

1. **Environment Variables**:

   - `VITE_API_URL` = `https://backend-163526067001.us-west1.run.app`
   - `NODE_ENV` = `production`

2. **Build Settings**:
   - Build command: `cd frontend && npm ci && npm run build`
   - Publish directory: `frontend/dist`
   - Base directory: `frontend`

## Expected Results

✅ **Success Indicators**:

- Frontend loads without console errors
- Login/registration works end-to-end
- No "Network Error" or CORS issues
- Environment variables are correctly read

❌ **Failure Indicators**:

- JavaScript console errors about environment variables
- Failed API calls to wrong URLs
- CORS errors in Network tab
- Login flow fails with network errors

## Rollback Plan

If issues occur:

```bash
# Switch back to main branch
git checkout main

# If needed, revert the testing branch
git branch -D feature/env-var-testing
```

## After Successful Testing

Once testing is successful:

1. Merge `feature/env-var-testing` into `fix-env-var-issue`
2. Test the PR on the original branch
3. Request final review and merge to main
