// Clean environment variable utility using Vite's native system
// Supports both Vite build-time variables and runtime environment detection

/**
 * Get environment variable with intelligent fallback handling
 * @param {string} name - Environment variable name
 * @param {string} defaultValue - Default value if variable not found
 * @returns {string} Environment variable value or default
 */
export function getEnvVar(name, defaultValue = "") {
  // Vite build-time environment variables (import.meta.env)
  // These are available during build and in the browser
  if (import.meta.env && import.meta.env[name] !== undefined) {
    return import.meta.env[name];
  }

  // Runtime environment variables (for Node.js/testing contexts)
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env[name] !== undefined
  ) {
    return process.env[name];
  }

  // Runtime detection in browser context
  if (typeof window !== "undefined") {
    // Try to get from window.__ENV__ if available (runtime injection)
    if (window.__ENV__ && window.__ENV__[name] !== undefined) {
      return window.__ENV__[name];
    }

    // Fallback: detect based on hostname
    return getHostnameBasedFallback(name, defaultValue);
  }

  return defaultValue;
}

/**
 * Get fallback value based on hostname for runtime environment detection
 * @param {string} name - Environment variable name
 * @param {string} defaultValue - Default value
 * @returns {string} Appropriate fallback value
 */
function getHostnameBasedFallback(name, defaultValue) {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  // Development environments
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0"
  ) {
    if (name === "VITE_API_URL") {
      return "http://localhost:5001";
    }
    return defaultValue;
  }

  // Production fallback
  if (name === "VITE_API_URL") {
    return "https://backend-163526067001.us-west1.run.app";
  }

  return defaultValue;
}

/**
 * Check if running in development mode
 * @returns {boolean} True if in development environment
 */
export function isDevelopment() {
  if (import.meta.env) {
    return import.meta.env.DEV;
  }
  return (
    typeof process !== "undefined" && process.env.NODE_ENV === "development"
  );
}

/**
 * Check if running in production mode
 * @returns {boolean} True if in production environment
 */
export function isProduction() {
  if (import.meta.env) {
    return import.meta.env.PROD;
  }
  return (
    typeof process !== "undefined" && process.env.NODE_ENV === "production"
  );
}

/**
 * Get current environment name
 * @returns {string} Environment name (development, production, etc.)
 */
export function getEnvironment() {
  if (import.meta.env && import.meta.env.MODE) {
    return import.meta.env.MODE;
  }
  if (typeof process !== "undefined" && process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  return "unknown";
}
