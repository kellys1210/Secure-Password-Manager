import "@testing-library/jest-dom";
import webcrypto from "crypto";
import { Buffer } from "buffer";

// Crypto implementation with proper ArrayBuffer handling
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  configurable: true,
});

// Polyfill for ArrayBuffer to Buffer conversion in crypto operations
const originalImportKey = webcrypto.subtle.importKey.bind(webcrypto.subtle);
const originalDeriveKey = webcrypto.subtle.deriveKey.bind(webcrypto.subtle);
const originalDecrypt = webcrypto.subtle.decrypt.bind(webcrypto.subtle);

webcrypto.subtle.importKey = async function (
  format,
  keyData,
  algorithm,
  extractable,
  keyUsages
) {
  // Convert ArrayBuffer to Buffer if needed
  if (keyData instanceof ArrayBuffer) {
    keyData = Buffer.from(keyData);
  }
  return originalImportKey(format, keyData, algorithm, extractable, keyUsages);
};

webcrypto.subtle.deriveKey = async function (
  algorithm,
  baseKey,
  derivedKeyAlgorithm,
  extractable,
  keyUsages
) {
  // Convert salt from ArrayBuffer to Buffer if needed
  if (algorithm && algorithm.salt && algorithm.salt instanceof ArrayBuffer) {
    algorithm = {
      ...algorithm,
      salt: Buffer.from(algorithm.salt),
    };
  }
  return originalDeriveKey(
    algorithm,
    baseKey,
    derivedKeyAlgorithm,
    extractable,
    keyUsages
  );
};

webcrypto.subtle.decrypt = async function (algorithm, key, data) {
  // Convert data and iv from ArrayBuffer to Buffer if needed
  if (data instanceof ArrayBuffer) {
    data = Buffer.from(data);
  }
  if (algorithm && algorithm.iv && algorithm.iv instanceof ArrayBuffer) {
    algorithm = {
      ...algorithm,
      iv: Buffer.from(algorithm.iv),
    };
  }
  return originalDecrypt(algorithm, key, data);
};

// Mock global.fetch for all tests
global.fetch = jest.fn();

// Polyfill for TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock email-validator for Jest tests
jest.mock("email-validator", () => ({
  validate: (email) => {
    // Simple RFC-compliant-ish email regex for testing
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
}));

// ============================================================================
// COMPREHENSIVE FORM VALIDATION TEST SETUP
// ============================================================================
//
// PROBLEM: Browser native form validation prevents form submissions with
// invalid emails from reaching React's onSubmit handlers in test environment.
//
// When an <input type="email"> contains an invalid email and the form is
// submitted, the browser's native validation system intercepts the submission
// and prevents it from reaching React's event handlers. This causes our
// custom validation logic to never execute in tests.
//
// SOLUTION: We disable native validation and ensure form submissions properly
// trigger React event handlers by:
// 1. Disabling native validation on all forms
// 2. Ensuring submit events properly bubble to React handlers
// 3. Providing consistent form submission behavior across tests
//

// Disable native form validation for all forms in tests
Object.defineProperty(HTMLFormElement.prototype, "noValidate", {
  get() {
    return true; // Always disable native validation
  },
  set() {
    // Ignore attempts to enable native validation in tests
  },
});

// Ensure form submissions properly trigger React event handlers
const originalSubmit = HTMLFormElement.prototype.submit;
HTMLFormElement.prototype.submit = function () {
  // Create and dispatch a submit event that React can handle
  const submitEvent = new Event("submit", {
    bubbles: true,
    cancelable: true,
  });

  // Dispatch the event - React will handle it via onSubmit prop
  const wasNotPrevented = this.dispatchEvent(submitEvent);

  // Only call original submit if the event wasn't prevented
  // (React's preventDefault would set defaultPrevented to true)
  if (wasNotPrevented && !submitEvent.defaultPrevented) {
    originalSubmit.call(this);
  }
};

// Mock requestSubmit to ensure it works consistently in tests
HTMLFormElement.prototype.requestSubmit = function (submitter) {
  const submitEvent = new Event("submit", {
    bubbles: true,
    cancelable: true,
  });

  // Add submitter information if provided
  if (submitter) {
    submitEvent.submitter = submitter;
  }

  this.dispatchEvent(submitEvent);
};

// Disable native validation on individual input elements
HTMLInputElement.prototype.checkValidity = function () {
  // Always return true to bypass native validation
  return true;
};

// Mock reportValidity to prevent native validation UI
HTMLInputElement.prototype.reportValidity = function () {
  return true;
};

HTMLFormElement.prototype.reportValidity = function () {
  return true;
};

// Ensure form elements don't interfere with React state management
Object.defineProperty(HTMLInputElement.prototype, "validity", {
  get() {
    return {
      valid: true,
      valueMissing: false,
      typeMismatch: false,
      patternMismatch: false,
      tooLong: false,
      tooShort: false,
      rangeUnderflow: false,
      rangeOverflow: false,
      stepMismatch: false,
      badInput: false,
      customError: false,
    };
  },
});

// ============================================================================
// TEST UTILITIES FOR FORM SUBMISSION
// ============================================================================

// Global utility for reliable form submission in tests
global.submitFormReliably = async (formElement, user) => {
  // Ensure form has noValidate attribute
  formElement.setAttribute("novalidate", "");

  // Find the submit button
  const submitButton =
    formElement.querySelector('button[type="submit"]') ||
    formElement.querySelector('input[type="submit"]');

  if (submitButton && user) {
    // Use userEvent to click the submit button (most reliable)
    await user.click(submitButton);
  } else {
    // Fallback: dispatch submit event directly
    const submitEvent = new Event("submit", {
      bubbles: true,
      cancelable: true,
    });
    formElement.dispatchEvent(submitEvent);
  }
};
