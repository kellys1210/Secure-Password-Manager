import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  copyToClipboard,
  isClipboardSupported,
  getClipboardErrorMessage,
} from "../utils/clipboard";
import "./CopyPasswordButton.css";

/**
 * CopyPasswordButton Component
 *
 * Secure button for copying passwords to clipboard without revealing them
 * Uses modern Clipboard API for secure operations
 *
 * Props:
 * - password: The password text to copy (required)
 * - label: Custom label for the button (default: "Copy")
 * - showStatus: Whether to show success/error status (default: true)
 * - onCopySuccess: Callback when copy succeeds
 * - onCopyError: Callback when copy fails
 */
export default function CopyPasswordButton({
  password,
  label = "Copy",
  showStatus = true,
  onCopySuccess,
  onCopyError,
}) {
  const [status, setStatus] = useState("idle"); // 'idle' | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState("");

  const handleCopy = async () => {
    if (!password) {
      const error = "No password to copy";
      setStatus("error");
      setStatusMessage(error);
      if (onCopyError) onCopyError(new Error(error));
      return;
    }

    // Check if clipboard is supported
    if (!isClipboardSupported()) {
      const error = "Clipboard not supported. Use HTTPS or localhost.";
      setStatus("error");
      setStatusMessage(error);
      if (onCopyError) onCopyError(new Error(error));
      return;
    }

    try {
      const success = await copyToClipboard(password);

      if (success) {
        setStatus("success");
        setStatusMessage("Copied!");
        if (onCopySuccess) onCopySuccess();

        // Reset status after 2 seconds
        setTimeout(() => {
          setStatus("idle");
          setStatusMessage("");
        }, 2000);
      } else {
        throw new Error("Copy operation failed");
      }
    } catch (error) {
      const errorMessage = getClipboardErrorMessage(error);
      setStatus("error");
      setStatusMessage(errorMessage);
      if (onCopyError) onCopyError(error);

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus("idle");
        setStatusMessage("");
      }, 3000);
    }
  };

  const getButtonClass = () => {
    const baseClass = "copy-password-button";
    if (status === "success") return `${baseClass} success`;
    if (status === "error") return `${baseClass} error`;
    return baseClass;
  };

  return (
    <div className="copy-password-container">
      <button
        type="button"
        className={getButtonClass()}
        onClick={handleCopy}
        disabled={status === "success"}
        aria-label={`${label} password to clipboard`}
        title="Copy password to clipboard"
      >
        <span className="button-icon">{status === "success" ? "✓" : "📋"}</span>
        <span className="button-label">
          {status === "success" ? "Copied!" : label}
        </span>
      </button>

      {showStatus && statusMessage && (
        <span className={`status-message ${status}`}>{statusMessage}</span>
      )}
    </div>
  );
}

CopyPasswordButton.propTypes = {
  password: PropTypes.string.isRequired,
  label: PropTypes.string,
  showStatus: PropTypes.bool,
  onCopySuccess: PropTypes.func,
  onCopyError: PropTypes.func,
};

CopyPasswordButton.defaultProps = {
  label: "Copy",
  showStatus: true,
  onCopySuccess: () => {},
  onCopyError: () => {},
};
