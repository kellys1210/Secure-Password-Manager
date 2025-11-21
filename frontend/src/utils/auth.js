// custom vite environment variable for api communication from backend to frontend
// https://vueschool.io/articles/vuejs-tutorials/how-to-use-environment-variables-in-vite-js/
import { getEnvVar } from "./env.js";

// Use environment-based API URL configuration for all deployments
// For local development: VITE_API_URL=http://localhost:8080
// For production: VITE_API_URL=https://your-backend-url
export const API_BASE = getEnvVar("VITE_API_URL", "http://localhost:8080");

const toAPI = (u) => {
  // For all deployments, use the configured API_BASE
  return u.startsWith("http") ? u : `${API_BASE}${u}`;
};

export const apiFetch = (u, opts = {}) => fetch(toAPI(u), opts);

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
 * Send logout request to backend 
 * @returns {Promise} 
 */
export const logoutRequest = async () => {
  const token = getToken();
  if (!token) return { success: true }; 

  try {
    const response = await apiFetch("/users/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jwt: token }),
    });

    const data = await response.json().catch(() => ({}));

    return { success: response.ok, ...data };

  } catch (error) {
    console.error("Logout request failed:", error);
    return { success: false, error: "Logout request failed" };
  }
};

/** 
 * Logout user by sending logout request, removing token, and redirecting  
 * @param {Function} navigate - Optional navigate function for redirecting 
*/
export const logout = async (navigate = null) => {
  await logoutRequest();

  removeToken();

  // Redirect if provided
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
