import { getToken, apiFetch } from "./auth";
import { encryptPassword, decryptPassword } from "./crypto";

/**
 * A PUT request to the backend to create or update a password entry.
 * Encrypts the password client-side before sending to backend.
 *
 * @param {Object} param0 - The application, username, and password
 * @returns {Promise} - Successful creation or update of record.
 */
export const createOrUpdatePassword = async ({
  application,
  application_username,
  password,
}) => {
  const jwt = getToken();

  // Get master password from localStorage
  const masterPassword = localStorage.getItem("masterPassword");
  if (!masterPassword) {
    return {
      success: false,
      error: "Master password not found. Please log in again.",
    };
  }

  // Encrypt password client-side
  const encryptedPassword = await encryptPassword(password, masterPassword);

  const response = await apiFetch("/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jwt,
      application,
      application_username,
      password: encryptedPassword,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.ok) {
    return {
      success: true,
      message: data.message,
    };
  } else {
    return {
      success: false,
      error: data.error || "Failed to store/update password",
    };
  }
};

export const deletePassword = async (application) => {
  const jwt = getToken();

  const response = await apiFetch("/password", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jwt, application }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.ok) {
    return {
      success: true,
      message: data.message,
    };
  } else {
    return {
      success: false,
      error: data.error || "Failed to delete password entry",
    };
  }
};

/**
 * Get all passwords for the authenticated user.
 * Decrypts passwords client-side after retrieving from backend.
 *
 * @param{string} Name of the application to delete
 * @returns {Promise} - Successful deletion.
 */
export const getAllPasswords = async () => {
  const jwt = getToken();

  const response = await apiFetch("/passwords", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jwt }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.ok) {
    // Get master password from localStorage
    const masterPassword = localStorage.getItem("masterPassword");
    if (!masterPassword) {
      return {
        success: false,
        error: "Master password not found. Please log in again.",
      };
    }

    // Decrypt passwords client-side
    try {
      const decryptedPasswords = await Promise.all(
        data.passwords.map(async (entry) => ({
          application: entry.application,
          password: await decryptPassword(entry.password, masterPassword),
        }))
      );

      return {
        success: true,
        passwords: decryptedPasswords,
      };
    } catch (error) {
      console.error("Decryption failed:", error);
      return {
        success: false,
        error:
          "Failed to decrypt passwords. Your master password may be incorrect.",
      };
    }
  } else {
    return {
      success: false,
      error: data.error || "Failed to retrieve passwords",
    };
  }
};
