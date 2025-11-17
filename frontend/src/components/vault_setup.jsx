import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createOrUpdatePassword,
  getAllPasswords,
  deletePassword,
} from "../utils/vault";
import { isAuthenticated, logout } from "../utils/auth";
import CopyPasswordButton from "./CopyPasswordButton";
import ToastNotification from "./ToastNotification";

export default function VaultSetup() {
  const [application, setApplication] = useState("");
  const [applicationUsername, setApplicationUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const navigate = useNavigate();

  // user is authenticated all password records load
  useEffect(() => {
    if (!isAuthenticated()) {
      logout(navigate);
    } else {
      loadEntries();
    }
  }, []);

  // Get passwords from backend
  const loadEntries = async () => {
    const result = await getAllPasswords();
    if (result.success) {
      setEntries(result.passwords);
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

    setSubmitting(true);

    // Make call to the backend and create or update a record.
    try {
      const result = await createOrUpdatePassword({
        application,
        application_username: applicationUsername,
        password,
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
    const result = await deletePassword(appName);
    if (result.success) {
      setMessage("Entry deleted successfully.");
      await loadEntries();
    } else {
      setMessage(result.error || "Failed to delete entry.");
    }
  };

  // Handle successful copy operation
  const handleCopySuccess = (appName) => {
    setToastMessage(`Password copied for ${appName}`);
    setToastType("success");
  };

  // Handle copy error
  const handleCopyError = (error) => {
    setToastMessage(error.message || "Failed to copy password");
    setToastType("error");
  };

  return (
    <form onSubmit={handleSubmit}>
      {message && <p>{message}</p>}

      <label htmlFor="application">Application</label>
      <br />
      <input
        id="application"
        type="text"
        value={application}
        onChange={(e) => setApplication(e.target.value)}
        required
      />
      <br />
      <br />

      <label htmlFor="username">Username</label>
      <br />
      <input
        id="username"
        type="text"
        value={applicationUsername}
        onChange={(e) => setApplicationUsername(e.target.value)}
        required
      />
      <br />
      <br />

      <label htmlFor="password">Password</label>
      <br />
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <br />
      <br />

      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save Password"}
      </button>

      <hr />

      <h3>Saved Entries</h3>
      {entries.length === 0 ? (
        <p>No saved passwords.</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.application}>
              <strong>{entry.application}</strong>:
              <span className="password-hidden">••••••••</span>
              <CopyPasswordButton
                password={entry.password}
                label="Copy"
                showStatus={false}
                onCopySuccess={() => handleCopySuccess(entry.application)}
                onCopyError={handleCopyError}
              />
              <button
                type="button"
                onClick={() => handleDelete(entry.application)}
                style={{ marginLeft: "10px" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <ToastNotification
        message={toastMessage}
        type={toastType}
        duration={3000}
        onDismiss={() => {
          setToastMessage("");
          setToastType("info");
        }}
      />
    </form>
  );
}
