# Option 2 Implementation Plan: Proper Vite Configuration

## Overview

Implement a comprehensive environment configuration system using Vite's native environment variable handling.

## Implementation Steps

### Step 1: Fix Environment Variable Handling

- [ ] Replace `frontend/src/utils/env.js` with clean implementation
- [ ] Remove `eval()` usage and security concerns
- [ ] Use Vite's native `import.meta.env` system

### Step 2: Create Environment-Specific Configuration Files

- [ ] Create `frontend/.env.production` for production settings
- [ ] Create `frontend/.env.development` for development settings
- [ ] Update `frontend/.env` with defaults

### Step 3: Update Netlify Configuration

- [ ] Create `netlify.toml` with build contexts
- [ ] Configure environment variables for different deployment types
- [ ] Add proper build commands and publish directory

### Step 4: Update Application Code

- [ ] Replace hardcoded fallback URLs in `frontend/src/utils/auth.js`
- [ ] Update any other files using environment variables
- [ ] Ensure consistent environment detection across the app

### Step 5: Testing and Verification

- [ ] Test in development environment
- [ ] Verify production builds work correctly
- [ ] Test Netlify deploy previews
- [ ] Validate CORS configuration

## Files to Modify/Create

1. `frontend/src/utils/env.js` - Replace with clean implementation
2. `frontend/.env` - Update defaults
3. `frontend/.env.production` - Create new file
4. `frontend/.env.development` - Create new file
5. `netlify.toml` - Create new file
6. `frontend/src/utils/auth.js` - Update fallback logic
