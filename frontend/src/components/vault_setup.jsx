import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector} from "react-redux";
import { createOrUpdatePassword, getAllPasswords, deletePassword } from "../utils/vault";
import { isAuthenticated, logout } from "../utils/auth.js";
import { cryptoUtils } from "../utils/crypto.js";
import { clearSecretKey } from "../store/keySlice.js";

export default function VaultSetup () {
    const [application, setApplication] = useState("");
    const [applicationUsername, setApplicationUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [entries, setEntries] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const secretKey = useSelector((state) => state.secretKey.key);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // user is authenticated all password records load
    useEffect(() => {
        if (!isAuthenticated()) {
            // Clear key and redirect to login
            dispatch(clearSecretKey());
            logout(navigate);
            // Have user login if unauthenticated or page reloaded. 
        } else if  (!secretKey) {
            navigate("/login");
         } else {
            loadEntries();
        }
    }, [secretKey, dispatch, navigate]);
    
    // Load encrypted entries and decrypt with AES key
    const loadEntries = async () => {
        const result = await getAllPasswords();
        if (result.success) {
            try {
                const decrypted = await Promise.all(
                    result.passwords.map(async (entry) => {
                        const clearText = await cryptoUtils.decryptText(
                            secretKey,
                            entry.password,
                        );
                    return {
                        application: entry.application,
                        password: clearText,
                    };
                })
            );
            setEntries(decrypted);
        } catch (err) {
            console.error("Decryption failed:", err);
            setMessage("Error decrypting vault entries, login again");
            dispatch(clearSecretKey());
            navigate("/login");
        }
    } else {
        setMessage(result.error || "Failed to load entries.");
    }
};
    
    // Form submission for creating or updating an entry
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        
        // Require application name
        if (!application.trim()) {
            setMessage("Application name is required.");
            return;
        }
        
        // Require application username
        if (!applicationUsername.trim()) {
            setMessage("Application username is required.");
            return;
        }
        
        // Require application password
        if (!password) {
            setMessage("Password is required.");
            return;
        }

        if (!secretKey) {
            setMessage("Authentication key error - please login again.");
            navigate("/login");
        }

        setSubmitting(true);
        
        // Make call to the backend and create or update a record. 
        try {
            // send ciphertext and iv to backend for encryption
            const encrypted = await cryptoUtils.encryptText(
                secretKey, password );
            const result = await createOrUpdatePassword({
                application, 
                application_username: applicationUsername, 
                password: encrypted
            });

            if (result.success) {
                setMessage("Password entry saved successfully.");
                setApplication("");
                setApplicationUsername("");
                setPassword("");
                await loadEntries();
            } else {
                setMessage(result.error);
            }
        } catch (err) {
            setMessage("Something went wrong. Please try again");
            console.error("Vault setup error:", err);
        } finally {
            setSubmitting(false);
        }
    };
    
    // Delete a password entry
    const handleDelete = async (appName) => {
        try {
            const result = await deletePassword(appName);
            if (result.success) {
            setMessage("Entry deleted successfully.");
            await loadEntries();
        } else {
            throw new Error(result.error || "Failed to delete entry.");
        }
    } catch (err) {
        console.error("Delete entry error:", err);
        setMessage("Failed to delete entry due to an error."); 
    }
    };

    return ( 
        <form onSubmit={handleSubmit}>
            {message && <p>{message}</p>}

            <label htmlFor="application">Application</label>
            <br />
            <input 
                id ="application"
                type="text"
                value ={application}
                onChange={(e) => setApplication(e.target.value)}
                required
            />
            <br />
            <br />

            <label htmlFor="username">Username</label>
            <br />
            <input 
                id ="username"
                type="text"
                value ={applicationUsername}
                onChange={(e) => setApplicationUsername(e.target.value)}
                required
            />
            <br />
            <br />

            <label htmlFor="password">Password</label>
            <br />
            <input 
                id ="password"
                type="password"
                value ={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <br />
            <br />

            <button type ="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Password"}
            </button>

            <hr />

            <h3>Saved Entries</h3>
            {entries.length === 0 ? (
                <p>No saved passwords.</p>
            ): (
                <ul>
                    {entries. map((entry) => (
                        <li key={entry.application}>
                            <strong>{entry.application}</strong>: {entry.password}
                            <button
                                type="button"
                                onClick={() => handleDelete(entry.application)}
                            >
                                Delete
                                </button>    
                        </li>
                    ))}
                </ul>
            )}    
        </form>
    );
}
