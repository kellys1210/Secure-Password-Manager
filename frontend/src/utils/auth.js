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
  } catch (error) {
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
  const backendUrl = url.startsWith("http")
    ? url
    : `http://localhost:8080${url}`;

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
