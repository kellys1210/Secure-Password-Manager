# Environment Variable Fix Analysis & Recommendations

## Current Problem Analysis

The PR #46 is addressing a critical issue where:

1. `VITE_API_URL` environment variable is not being properly read in production
2. Netlify's environment variable expansion is failing
3. The fallback URL was hardcoded to localhost instead of the deployed backend
4. This causes network errors between frontend and backend in production

## Issues with Current Approach

### 1. Hardcoded Fallback URLs

```javascript
// Current problematic code in auth.js
export const API_BASE = getEnvVar(
  "VITE_API_URL",
  "https://backend-163526067001.us-west1.run.app" // ❌ Hardcoded!
);
```

### 2. Overly Complex Environment Handling

The `getEnvVar()` function uses `eval()` which is problematic:

- Security concern (code injection risk)
- Unnecessary complexity for environment variables
- Poor error handling

### 3. No Proper Build-Time Configuration

- Vite requires environment variables to be available at build time
- Netlify needs proper build command configuration
- Missing environment-specific build strategies

## Recommended Solutions (Better Approaches)

### Option 1: Proper Vite Environment Configuration (Recommended)

**Best Practice**: Use Vite's native environment variable system correctly

#### Step 1: Fix the Environment Variable Handling

```javascript
// frontend/src/utils/config.js - New clean configuration utility
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Get API URL with proper fallbacks
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (isDevelopment
    ? "http://localhost:5001"
    : "https://your-backend-url.run.app");

export const isLocalDevelopment = isDevelopment;
```

#### Step 2: Update Netlify Build Configuration

Add to `netlify.toml`:

```toml
[build]
  command = "cd frontend && npm ci && npm run build"
  publish = "frontend/dist"

[build.environment]
  VITE_API_URL = "https://your-backend-url.run.app"
```

#### Step 3: Environment-Specific .env Files

```bash
# frontend/.env.production
VITE_API_URL=https://your-backend-url.run.app

# frontend/.env.development
VITE_API_URL=http://localhost:5001

# frontend/.env (default)
VITE_API_URL=http://localhost:5001
```

### Option 2: Runtime Configuration via JSON (Alternative)

Create a configuration file that gets generated during build:

#### Step 1: Create Build Script

```javascript
// scripts/generate-config.js
const fs = require("fs");
const config = {
  apiUrl: process.env.VITE_API_URL || "https://your-backend-url.run.app",
  environment: process.env.NODE_ENV || "production",
};
fs.writeFileSync("frontend/public/config.json", JSON.stringify(config));
```

#### Step 2: Runtime Config Loader

```javascript
// frontend/src/utils/runtimeConfig.js
let config = null;

export const loadConfig = async () => {
  if (!config) {
    try {
      const response = await fetch("/config.json");
      config = await response.json();
    } catch (error) {
      config = {
        apiUrl: "https://your-backend-url.run.app",
        environment: "production",
      };
    }
  }
  return config;
};

export const getApiUrl = async () => {
  const cfg = await loadConfig();
  return cfg.apiUrl;
};
```

### Option 3: Environment Detection Service (Most Robust)

Create a comprehensive environment configuration service:

```javascript
// frontend/src/utils/environment.js

class EnvironmentConfig {
  constructor() {
    this.config = this.detectEnvironment();
  }

  detectEnvironment() {
    // Check for Vite environment variables
    if (import.meta.env?.VITE_API_URL) {
      return {
        apiUrl: import.meta.env.VITE_API_URL,
        environment: import.meta.env.MODE,
        isDevelopment: import.meta.env.DEV,
        isProduction: import.meta.env.PROD,
      };
    }

    // Check for global environment variables
    if (typeof process !== "undefined" && process.env?.VITE_API_URL) {
      return {
        apiUrl: process.env.VITE_API_URL,
        environment: process.env.NODE_ENV || "production",
        isDevelopment: process.env.NODE_ENV === "development",
        isProduction: process.env.NODE_ENV === "production",
      };
    }

    // Fallback configuration based on hostname
    const hostname = window?.location?.hostname || "";

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return {
        apiUrl: "http://localhost:5001",
        environment: "development",
        isDevelopment: true,
        isProduction: false,
      };
    }

    // Production fallback
    return {
      apiUrl: "https://backend-163526067001.us-west1.run.app",
      environment: "production",
      isDevelopment: false,
      isProduction: true,
    };
  }

  getApiUrl() {
    return this.config.apiUrl;
  }

  isDevelopment() {
    return this.config.isDevelopment;
  }

  isProduction() {
    return this.config.isProduction;
  }

  getEnvironment() {
    return this.config.environment;
  }
}

export const envConfig = new EnvironmentConfig();
export const { getApiUrl, isDevelopment, isProduction } = envConfig;
```

## Immediate Actions to Fix the PR

### 1. Quick Fix (Minimal Changes)

Replace the hardcoded fallback with a better environment detection:

```javascript
// In frontend/src/utils/auth.js - Replace API_BASE definition
const getFallbackApiUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5001";
    }
  }
  return "https://backend-163526067001.us-west1.run.app";
};

export const API_BASE = getEnvVar("VITE_API_URL", getFallbackApiUrl());
```

### 2. Medium Fix (Recommended)

Implement Option 1 with proper Vite environment configuration:

1. Fix the `env.js` file to remove `eval()` usage
2. Add proper environment-specific `.env` files
3. Update Netlify configuration
4. Update the fallback logic

### 3. Long-term Fix (Most Robust)

Implement Option 3 with the comprehensive environment service:

1. Create the `EnvironmentConfig` class
2. Replace all environment variable usage with the new service
3. Add comprehensive logging for debugging
4. Add tests for different environment scenarios

## Netlify-Specific Fixes

### 1. Environment Variables in Netlify Dashboard

1. Go to Site settings > Environment variables
2. Add: `VITE_API_URL` = `https://backend-163526067001.us-west1.run.app`

### 2. Deploy Preview Configuration

For deploy previews to work with CORS, use Netlify's build context:

```toml
# netlify.toml
[context.deploy-preview]
  environment = { VITE_API_URL = "https://backend-preview-url.run.app" }

[context.branch-deploy]
  environment = { VITE_API_URL = "https://backend-staging-url.run.app" }
```

### 3. CORS Wildcard for Deploy Previews

Instead of hardcoded URLs, use a more flexible CORS approach:

```javascript
// Backend CORS configuration
const allowedOrigins = [
  "https://your-app.netlify.app",
  "https://deploy-preview-*.netlify.app", // Netlify deploy previews
  "http://localhost:3000", // Local development
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow same-origin requests

      if (
        allowedOrigins.some((pattern) => {
          if (pattern.includes("*")) {
            const regex = new RegExp(pattern.replace("*", ".*"));
            return regex.test(origin);
          }
          return origin === pattern;
        })
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
  })
);
```

## Summary of Recommendations

1. **Immediate**: Use the Quick Fix to resolve the current deployment issue
2. **Short-term**: Implement the Medium Fix with proper Vite environment configuration
3. **Long-term**: Migrate to the comprehensive EnvironmentConfig service
4. **Netlify**: Configure environment variables properly in the dashboard
5. **Testing**: Add environment-specific tests to catch these issues earlier

The key principle is to avoid hardcoded URLs and use proper environment configuration that works across development, staging, and production environments.
