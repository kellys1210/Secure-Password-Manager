/**
 * Unit tests for clipboard.js secure clipboard operations
 * Tests modern Clipboard API and fallback methods
 */

import {
  copyToClipboard,
  clearClipboard,
  isClipboardSupported,
  getClipboardErrorMessage,
} from "../clipboard";

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(),
};

// Mock window.isSecureContext
Object.defineProperty(window, "isSecureContext", {
  writable: true,
  value: true,
});

// Mock document.execCommand for fallback tests
document.execCommand = jest.fn();

describe("Clipboard Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset navigator.clipboard mock
    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      value: mockClipboard,
    });
    window.isSecureContext = true;
  });

  describe("isClipboardSupported", () => {
    test("returns true when Clipboard API and secure context are available", () => {
      expect(isClipboardSupported()).toBe(true);
    });

    test("returns false when Clipboard API is not available", () => {
      Object.defineProperty(navigator, "clipboard", {
        writable: true,
        value: undefined,
      });
      expect(isClipboardSupported()).toBe(false);
    });

    test("returns false when not in secure context", () => {
      window.isSecureContext = false;
      expect(isClipboardSupported()).toBe(false);
    });
  });

  describe("copyToClipboard", () => {
    test("successfully copies text using Clipboard API", async () => {
      mockClipboard.writeText.mockResolvedValueOnce();

      const result = await copyToClipboard("test password");

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith("test password");
    });

    test("handles Clipboard API failure and uses fallback", async () => {
      mockClipboard.writeText.mockRejectedValueOnce(
        new Error("Clipboard denied")
      );
      document.execCommand.mockReturnValueOnce(true);

      const result = await copyToClipboard("test password");

      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith("copy");
    });

    test("returns false when both methods fail", async () => {
      mockClipboard.writeText.mockRejectedValueOnce(
        new Error("Clipboard denied")
      );
      document.execCommand.mockReturnValueOnce(false);

      const result = await copyToClipboard("test password");

      expect(result).toBe(false);
    });

    test("throws error when Clipboard API not available and uses fallback", async () => {
      Object.defineProperty(navigator, "clipboard", {
        writable: true,
        value: undefined,
      });
      document.execCommand.mockReturnValueOnce(true);

      const result = await copyToClipboard("test password");

      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith("copy");
    });

    test("handles empty string input", async () => {
      mockClipboard.writeText.mockResolvedValueOnce();

      const result = await copyToClipboard("");

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith("");
    });

    test("handles special characters in password", async () => {
      const specialPassword = "P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?";
      mockClipboard.writeText.mockResolvedValueOnce();

      const result = await copyToClipboard(specialPassword);

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(specialPassword);
    });

    test("handles unicode characters in password", async () => {
      const unicodePassword = "Pässwörd🔐withémoji";
      mockClipboard.writeText.mockResolvedValueOnce();

      const result = await copyToClipboard(unicodePassword);

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(unicodePassword);
    });

    test("handles very long passwords", async () => {
      const longPassword = "A".repeat(1000);
      mockClipboard.writeText.mockResolvedValueOnce();

      const result = await copyToClipboard(longPassword);

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(longPassword);
    });
  });

  describe("clearClipboard", () => {
    test("successfully clears clipboard", async () => {
      mockClipboard.writeText.mockResolvedValueOnce();

      const result = await clearClipboard();

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith("");
    });

    test("returns false when clipboard API is not available", async () => {
      Object.defineProperty(navigator, "clipboard", {
        writable: true,
        value: undefined,
      });

      const result = await clearClipboard();

      expect(result).toBe(false);
    });

    test("returns false when not in secure context", async () => {
      window.isSecureContext = false;

      const result = await clearClipboard();

      expect(result).toBe(false);
    });

    test("handles clipboard clear failure", async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error("Clear failed"));

      const result = await clearClipboard();

      expect(result).toBe(false);
    });
  });

  describe("getClipboardErrorMessage", () => {
    test("returns secure context error when not in secure context", () => {
      window.isSecureContext = false;

      const message = getClipboardErrorMessage(new Error("Test error"));

      expect(message).toBe(
        "Clipboard access requires HTTPS or localhost connection"
      );
    });

    test("returns API not supported error when clipboard is undefined", () => {
      Object.defineProperty(navigator, "clipboard", {
        writable: true,
        value: undefined,
      });

      const message = getClipboardErrorMessage(new Error("Test error"));

      expect(message).toBe("Clipboard API not supported in this browser");
    });

    test("returns permission denied error for NotAllowedError", () => {
      const notAllowedError = new Error("Permission denied");
      notAllowedError.name = "NotAllowedError";

      const message = getClipboardErrorMessage(notAllowedError);

      expect(message).toBe(
        "Clipboard access denied. Please allow clipboard permissions."
      );
    });

    test("returns generic error message for other errors", () => {
      const message = getClipboardErrorMessage(new Error("Some other error"));

      expect(message).toBe("Failed to copy to clipboard. Please try again.");
    });
  });

  describe("Security considerations", () => {
    test("does not expose password in DOM when using Clipboard API", async () => {
      mockClipboard.writeText.mockResolvedValueOnce();

      await copyToClipboard("secret-password-123");

      // Verify no temporary elements are left in DOM
      const textareas = document.querySelectorAll("textarea");
      expect(textareas.length).toBe(0);
    });

    test("cleans up temporary elements after fallback copy", async () => {
      Object.defineProperty(navigator, "clipboard", {
        writable: true,
        value: undefined,
      });
      document.execCommand.mockReturnValueOnce(true);

      await copyToClipboard("secret-password-123");

      // Verify temporary textarea is removed
      const textareas = document.querySelectorAll("textarea");
      expect(textareas.length).toBe(0);
    });

    test("requires user interaction (simulated by test environment)", async () => {
      mockClipboard.writeText.mockResolvedValueOnce();

      // In real browser, this would require user interaction
      // In test environment, we can verify the API is called correctly
      const result = await copyToClipboard("test");

      expect(result).toBe(true);
    });
  });
});
