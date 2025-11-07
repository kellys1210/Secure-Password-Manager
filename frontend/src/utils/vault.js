import { getToken, apiFetch } from "./auth";

/**
 * A PUT request to the backend to create or update a password entry.
 * 
 * @param {Object} param0 - The application, username, and password
 * @returns {Promise} - Successful creation or update of record. 
*/
export const createOrUpdatePassword = async ({ application, application_username, password}) => {
    const jwt = getToken(); 

    const response = await apiFetch("/password", {
        method: "PUT", 
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ jwt, application, application_username, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
        return { 
            success: true, message: data.message };
    } else {
        return { 
            success: false, error: data.error || "Failed to store/update password" };
    }
};

export const deletePassword = async (application) => {
    const jwt = getToken();

    const response = await apiFetch("/password", {
        method: "DELETE",
        headers: {"Content-Type": "application/json" },
        body: JSON.stringify({ jwt, application }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
        return { 
            success: true, message: data.message};
    } else {
        return { 
            success: false, error: data.error || "Failed to delete password entry"};
    }
};

/**
 * @param{string} Name of the application to delete
 * @returns {Promise} - Successful deletion. 
 */
export const getAllPasswords = async () => {
    const jwt = getToken();

    const response = await apiFetch("/passwords", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jwt}),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
        return {
            success: true, passwords: data.passwords 
        };
    } else {
        return {
            success: false, error: data.error || "Failed to retrieve passwords" };
        }
};