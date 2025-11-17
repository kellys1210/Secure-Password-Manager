/**
 * Secure clipboard operations utility
 * Implements modern Clipboard API with security best practices
 *
 * Security Features:
 * - Uses secure Clipboard API (requires HTTPS or localhost)
 * - Transient user activation required (button click)
 * - No plaintext passwords exposed in DOM
 * - Graceful fallback for unsupported browsers
 */

/**
 * Copy text to clipboard using modern Clipboard API
 * @param {string} text - The text to copy to clipboard
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function copyToClipboard(text) {
  try {
    // Check if Clipboard API is supported and in secure context
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error(
        "Clipboard API not available or not in secure context (HTTPS required)"
      );
    }

    // Use modern Clipboard API with writeText method
    await navigator.clipboard.writeText(text);

    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);

    // Fallback for older browsers or testing environments
    try {
      return fallbackCopyToClipboard(text);
    } catch (fallbackError) {
      console.error("Fallback copy method also failed:", fallbackError);
      return false;
    }
  }
}

/**
 * Fallback copy method using deprecated document.execCommand
 * Only used as backup when Clipboard API is unavailable
 * @param {string} text - The text to copy
 * @returns {boolean} - True if successful
 */
function fallbackCopyToClipboard(text) {
  // Create a temporary textarea element
  const textArea = document.createElement("textarea");
  textArea.value = text;

  // Make it invisible but still selectable
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    document.body.removeChild(textArea);
    throw err;
  }
}

/**
 * Clear clipboard contents (security feature)
 * @returns {Promise<boolean>} - True if successful
 */
export async function clearClipboard() {
  try {
    if (!navigator.clipboard || !window.isSecureContext) {
      return false;
    }

    await navigator.clipboard.writeText("");
    return true;
  } catch (error) {
    console.error("Failed to clear clipboard:", error);
    return false;
  }
}

/**
 * Check if clipboard operations are supported in current environment
 * @returns {boolean} - True if clipboard operations are supported
 */
export function isClipboardSupported() {
  return !!(navigator.clipboard && window.isSecureContext);
}

/**
 * Get user-friendly error message for clipboard failures
 * @param {Error} error - The error that occurred
 * @returns {string} - User-friendly error message
 */
export function getClipboardErrorMessage(error) {
  if (!window.isSecureContext) {
    return "Clipboard access requires HTTPS or localhost connection";
  }

  if (!navigator.clipboard) {
    return "Clipboard API not supported in this browser";
  }

  if (error.name === "NotAllowedError") {
    return "Clipboard access denied. Please allow clipboard permissions.";
  }

  return "Failed to copy to clipboard. Please try again.";
}

export default {
  copyToClipboard,
  clearClipboard,
  isClipboardSupported,
  getClipboardErrorMessage,
};
