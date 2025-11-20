import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createOrUpdatePassword,
  getAllPasswords,
  deletePassword,
} from "../utils/vault";
import { isAuthenticated, logout } from "../utils/auth.js";
import {
  decryptPassword,
  encryptPassword,
  validateMasterPassword,
} from "../utils/crypto.js";
import { useMemo } from "react";
import CopyPasswordButton from "./CopyPasswordButton";
import ToastNotification from "./ToastNotification";
import {
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import UnlockVault from "./unlock_vault.jsx";
import { validate as validateEmail } from "email-validator";

export default function VaultSetup() {
  const [application, setApplication] = useState("");
  const [applicationUsername, setApplicationUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState({ new: false });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState({});
  const [editValues, setEditValues] = useState({
    application: "",
    username: "",
    password: "",
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [masterPassword, setMasterPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [vaultKey, setVaultKey] = useState(null);
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");

  // if user isn't authenticated logout
  useEffect(() => {
    if (!isAuthenticated()) {
      logout(navigate);
    }
  }, [navigate]);

  // MAIN BRANCH: Additional functionality here

  // unlock vault and derive key
  const handleUnlock = async () => {
    setUnlockError("");

    if (!masterPassword) {
      setUnlockError("Master password required.");
      return;
    }

    try {
      const result = await getAllPasswords();

      if (!result.success) {
        setUnlockError("Failed to load vault data.");
        return;
      }

      const encryptedEntries = result.passwords;

      // If vault empty no validation needed
      if (encryptedEntries.length === 0) {
        setVaultKey(masterPassword);
        await loadEntries(masterPassword);
        return;
      }

      // Validate using first stored entry
      const testCipher = encryptedEntries[0].password;

      const ok = await validateMasterPassword(testCipher, masterPassword);
      if (!ok) {
        setUnlockError("Incorrect master password.");
        return;
      }

      // Unlock successful
      setVaultKey(masterPassword);
      await loadEntries(masterPassword);
    } catch (err) {
      console.error(err);
      setUnlockError("Vault unlock failed.");
    }
  };

  // Load and decrypt entries
  const loadEntries = async (key) => {
    try {
      const result = await getAllPasswords();

      if (!result.success) {
        setMessage(result.error || "Failed to load entries.");
        return;
      }

      const decrypted = await Promise.all(
        result.passwords.map(async (entry) => {
          const clear = await decryptPassword(entry.password, key);

          return {
            application: entry.application,
            username: entry.application_username,
            password: clear,
          };
        })
      );

      setEntries(decrypted);
    } catch (err) {
      console.error("Decryption failed:", err);
      setMessage("Vault decryption error — please unlock again.");
      setVaultKey("");
    }
  };

  // Add and update entries
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!vaultKey) {
      setMessage("Vault is locked — unlock first.");
      return;
    }

    if (!application.trim() || !applicationUsername.trim() || !password) {
      setMessage("All fields are required.");
      return;
    }

    if (!validateEmail(applicationUsername.trim())) {
      setMessage("Username must be a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const encrypted = await encryptPassword(password, vaultKey);

      const result = await createOrUpdatePassword({
        application,
        application_username: applicationUsername,
        password: encrypted,
      });

      if (result.success) {
        setMessage("Password saved.");
        setApplication("");
        setApplicationUsername("");
        setPassword("");
        await loadEntries(vaultKey);
      } else {
        setMessage(result.error || "Failed to save entry.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error saving entry.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete entries
  const handleDelete = async (appName) => {
    try {
      const result = await deletePassword(appName);
      if (result.success) {
        setMessage("Entry deleted.");
        await loadEntries(vaultKey);
      } else {
        setMessage(result.error || "Delete failed.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Delete failed.");
    } finally {
      setDeleteTarget(null);
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

  // Edit entry
  const editEntry = (app, entry) => {
    setEditing(app);
    setEditValues({
      application: entry.application,
      username: entry.username,
      password: entry.password,
    });
  };

  // Save entry edit
  const saveEdit = async () => {
    try {
      if (!vaultKey) {
        setMessage("Vault is locked.");
        return;
      }

      if (!validateEmail(editValues.username.trim())) {
        setMessage("Username must be a valid email address.");
        return;
      }

      const encrypted = await encryptPassword(editValues.password, vaultKey);

      const result = await createOrUpdatePassword({
        application: editValues.application,
        application_username: editValues.username,
        password: encrypted,
      });

      if (result.success) {
        setMessage("Entry updated.");
        setEditing(null);
        await loadEntries(vaultKey);
      } else {
        setMessage("Failed to update entry.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Update failed.");
    }
  };

  const cancelEdit = () => setEditing(null);

  // Sort and filter entry
  const sortEntries = useMemo(() => {
    return entries
      .filter((e) => e.application.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.application.localeCompare(b.application));
  }, [entries, search]);

  // Form to unlock vault with master password
  if (!vaultKey) {
    return (
      <UnlockVault
        masterPassword={masterPassword}
        setMasterPassword={setMasterPassword}
        unlockError={unlockError}
        handleUnlock={handleUnlock}
      />
    );
  }

  // Full vault UI
  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md mt-6">
      {message && (
        <p className="mb-4 text-red-600 text-sm font-medium">{message}</p>
      )}

      {/* Add new entry */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-brandnavy font-semibold mb-1">
            Application
          </label>
          <input
            className="w-full p-2 border rounded-lg"
            value={application}
            onChange={(e) => setApplication(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-brandnavy font-semibold mb-1">
            Username
          </label>
          <input
            className="w-full p-2 border rounded-lg"
            value={applicationUsername}
            onChange={(e) => setApplicationUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-brandnavy font-semibold mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword.new ? "text" : "password"}
              className="w-full p-2 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="absolute right-3 top-2"
              onClick={() =>
                setShowPassword((prev) => ({
                  ...prev,
                  new: !prev.new,
                }))
              }
            >
              {showPassword.new ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <button
          className="w-full bg-brandnavy text-white py-2 rounded-lg font-semibold"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save Password"}
        </button>
      </form>

      {/* search bar */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-brandnavy">Saved Entries</h3>

        <input
          placeholder="Search..."
          className="p-2 w-48 border rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* entries table */}
      {sortEntries.length === 0 ? (
        <p className="text-gray-600">No saved passwords.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3 font-semibold text-brandnavy">App</th>
                <th className="p-3 font-semibold text-brandnavy">Username</th>
                <th className="p-3 font-semibold text-brandnavy">Password</th>
                <th className="p-3 font-semibold text-brandnavy text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {sortEntries.map((entry) => {
                const app = entry.application;
                const isEditing = editing === app;

                return (
                  <tr key={app} className="border-b hover:bg-gray-50">
                    {/* Application */}
                    <td className="p-3">
                      {isEditing ? (
                        <input
                          className="p-2 border rounded w-full"
                          value={editValues.application}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              application: e.target.value,
                            })
                          }
                        />
                      ) : (
                        entry.application
                      )}
                    </td>

                    {/* username */}
                    <td className="p-3">
                      {isEditing ? (
                        <input
                          className="p-2 border rounded w-full"
                          value={editValues.username}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              username: e.target.value,
                            })
                          }
                        />
                      ) : (
                        entry.username
                      )}
                    </td>

                    {/* password */}
                    <td className="p-3">
                      {isEditing ? (
                        <input
                          className="p-2 border rounded w-full"
                          value={editValues.password}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              password: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                            {showPassword[app] ? entry.password : "••••••••"}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((prev) => ({
                                ...prev,
                                [app]: !prev[app],
                              }))
                            }
                          >
                            {showPassword[app] ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-600 hover:text-brandnavy" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-600 hover:text-brandnavy" />
                            )}
                          </button>

                          {/* CopyPasswordButton — uses toast */}
                          <CopyPasswordButton
                            password={entry.password}
                            label="Copy"
                            showStatus={false}
                            onCopySuccess={() =>
                              handleCopySuccess(entry.application)
                            }
                            onCopyError={handleCopyError}
                          />
                        </div>
                      )}
                    </td>

                    {/* actions */}
                    <td className="p-3 text-center flex justify-center gap-3">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1 bg-brandnavy text-white rounded-lg hover:bg-opacity-90"
                          >
                            Save
                          </button>

                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 bg-gray-300 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <PencilSquareIcon
                            className="h-5 w-5 text-brandnavy cursor-pointer hover:scale-110"
                            onClick={() => editEntry(app, entry)}
                          />

                          <TrashIcon
                            className="h-5 w-5 text-red-600 cursor-pointer hover-scale-110"
                            onClick={() => setDeleteTarget(app)}
                          />
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* confirm delete */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-brandnavy mb-4">
              Delete Entry
            </h3>
            <p className="mb-6">
              Delete <strong>{deleteTarget}</strong>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                onClick={() => handleDelete(deleteTarget)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
}
