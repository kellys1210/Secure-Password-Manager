import { getEnvVar } from "./env.js";

// Enhanced API base URL configuration with intelligent fallback
// Uses Vite's native environment variables with smart hostname-based detection

// Get API base URL with environment-aware fallback
const getApiBaseUrl = () => {
  const configuredUrl = getEnvVar("VITE_API_URL");

  // If we have a configured URL from build-time environment variables, use it
  if (configuredUrl && configuredUrl !== "") {
    return configuredUrl;
  }

  // Fallback to intelligent hostname detection
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // Development environments
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0"
    ) {
      return "http://localhost:5001";
    }
  }

  // Production fallback
  return "https://backend-163526067001.us-west1.run.app";
};

export const API_BASE = getApiBaseUrl();

// Helper function to build full API URLs
const toAPI = (u) => (u.startsWith("http") ? u : `${API_BASE}${u}`);

// Generic API fetch with proper error handling
export const apiFetch = (u, opts = {}) => {
  const url = toAPI(u);
  console.log(`[API] ${opts.method || "GET"} ${url}`);

  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });
};

// Utility functions for authentication and JWT token management

/**
 * Store JWT token in localStorage
 * @param {string} token - JWT token to store
 */
export const storeToken = (token) => {
  localStorage.setItem("jwtToken", token);
};

/**
 * Get JWT token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem("jwtToken");
};

/**
 * Remove JWT token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem("jwtToken");
};

/**
 * Check if user is authenticated (token exists and is not expired)
 * @returns {boolean} True if user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    // If token is invalid, remove it
    removeToken();
    return false;
  }
};

/**
 * Make an authenticated API call with JWT token
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getToken();

  // Add authorization header if token exists
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // Ensure we're using the correct backend URL
  const backendUrl = toAPI(url);

  return fetch(backendUrl, config);
};

/**
 * Logout user by removing token and redirecting
 * @param {Function} navigate - Optional navigate function for redirecting
 */
export const logout = (navigate = null) => {
  removeToken();
  if (navigate) {
    navigate("/login");
  }
};

/**
 * Initiate the TOTP setup for user. Send a POST request to the backend to create a TOTP secret
 * and return a QR code for scanning by an authenticator app.
 *
 * @param {string} username - The username to set up MFA
 *  @returns {Promise} The QR code
 *
 */
export const totpSetup = async (username) => {
  const response = await apiFetch("/totp/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

  if (response.ok) {
    const qrBlob = await response.blob();
    // Render the qr code
    return { success: true, qrBlob };
  } else {
    const errorText = await response.text();
    return {
      success: false,
      error: errorText || "Failed to start TOTP setup",
    };
  }
};

/**
 * Verify the TOTP code during the MFA setup or login. Send  POST request to the backend to
 * validate the entered code with the user's db secret.
 *
 * @param {string} username - The user's username
 * @param {string} code - TOTP code from authenticator
 * @returns {Promise} - successful setup/login
 *
 */
export const verifyTotp = async (username, code) => {
  const response = await apiFetch("/totp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, code }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.ok) {
    return {
      success: true,
      data,
    };
  } else {
    return {
      success: false,
      error: data.error || "TOTP verification failed",
    };
  }
};
