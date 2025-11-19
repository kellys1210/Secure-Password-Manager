# Netlify Environment Variable Setup Guide

## Problem

The frontend is using `localhost:8080` instead of the production backend URL because `getEnvVar()` can't access `import.meta.env` at runtime in Netlify production builds.

## Solution: Configure Netlify Environment Variables

### Step 1: Access Netlify Dashboard

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Log in to your account
3. Select your site: **secure-pw-manager**

### Step 2: Navigate to Environment Variables

1. Click on **Site settings** (in the top navigation)
2. In the left sidebar, click **Environment variables** (under "Build & deploy")

### Step 3: Add the Environment Variable

1. Click the **Add a variable** button
2. Select **Add a single variable**
3. Fill in the form:
   - **Key**: `VITE_API_URL`
   - **Values**:
     - **Production**: `https://backend-163526067001.us-west1.run.app`
     - **Deploy previews**: `https://backend-163526067001.us-west1.run.app` (same for now)
     - **Branch deploys**: `https://backend-163526067001.us-west1.run.app` (same for now)
4. Click **Create variable**

### Step 4: Trigger a Redeploy (IMPORTANT!)

After adding the environment variable, you need to force a rebuild:

**Option A: Clear Cache and Deploy (RECOMMENDED)**

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for the build to complete

**Option B: Make a Trivial Change**

1. Add a comment or whitespace to any frontend file
2. Commit and push to trigger a new build
3. Netlify will rebuild with the new environment variable

⚠️ **Important**: Just clicking "Deploy site" may skip the build if Netlify detects no changes. You must either clear the cache or make a code change to force a rebuild.

### Step 5: Verify It Works

1. Once deployed, open your site: `https://secure-pw-manager.netlify.app`
2. Open browser DevTools → Network tab
3. Try to log in or register
4. Check the network requests - they should go to `https://backend-163526067001.us-west1.run.app` instead of `localhost:8080`

## How It Works

When you set `VITE_API_URL` in Netlify's environment variables:

1. **Build Time**: Netlify runs `npm run build` with the env var set
2. **Vite Processing**: Vite replaces all instances of `import.meta.env.VITE_API_URL` with the actual value
3. **Bundle Output**: The JavaScript bundle contains the hardcoded production URL
4. **Runtime**: `getEnvVar()` successfully reads the value from `import.meta.env`

## No Code Changes Required!

This solution works with your existing code. The `getEnvVar()` function will work correctly once the environment variable is set in Netlify.

## Alternative: netlify.toml (Optional)

If you prefer to version control your environment variables, you can create a `netlify.toml` file:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_API_URL = "https://backend-163526067001.us-west1.run.app"
```

However, using the Netlify Dashboard is more flexible for different environments.

## Testing Deploy Previews

For PR deploy previews to work, you may also want to set the env var for "Deploy previews" context in Netlify's environment variable settings.

## Cleanup

Once this is working, you can:

1. Close PR #46 (Kelly's bandaid fix) as it's no longer needed
2. Keep the existing `getEnvVar()` code - it will work correctly
