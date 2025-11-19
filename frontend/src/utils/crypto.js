/**
 * Cryptographic utilities for client-side password encryption
 * Implements PBKDF2 key derivation and AES-256-GCM encryption using Web Crypto API
 *
 * Security Model: Zero-Knowledge - server never sees plaintext passwords or encryption keys
 */

const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for GCM
const KEY_LENGTH = 256; // 256 bits for AES-256
const TAG_LENGTH = 16; // 128 bits authentication tag

// Text encoding and decoding utilities for compatibility layer
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Convert ArrayBuffer to base64 string
 * @param {ArrayBuffer} arr - ArrayBuffer to convert
 * @returns {string} - Base64 encoded string
 */
function arrayBufferToBase64(arr) {
  return btoa(String.fromCharCode(...new Uint8Array(arr)));
}

/**
 * Convert base64 string back to ArrayBuffer
 * @param {string} base64 - Base64 encoded string
 * @returns {ArrayBuffer} - Decoded ArrayBuffer
 */
function base64toArrayBuffer(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}

/**
 * Generate a random salt as Uint8Array (new implementation)
 * @returns {Promise<Uint8Array>} - Random salt
 */
export async function generateSalt() {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Generate a random salt as ArrayBuffer (legacy compatibility)
 * @returns {ArrayBuffer} - Random salt as ArrayBuffer
 */
function generateSaltLegacy() {
  return crypto.getRandomValues(new Uint8Array(16)).buffer;
}

/**
 * Generate a random salt and send it as a base64 string for storage
 * @returns {string} - Base64 encoded salt
 */
function generateSaltAsBase64() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...salt));
}

/**
 * Generate a cryptographically secure random IV
 * @returns {Promise<Uint8Array>} - Random IV
 */
export async function generateIV() {
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);
  return iv;
}

/**
 * Derive encryption key from master password using PBKDF2 (new implementation)
 * @param {string} masterPassword - User's master password
 * @param {Uint8Array} salt - Cryptographic salt
 * @returns {Promise<CryptoKey>} - Derived AES-256-GCM key
 */
export async function deriveKeyFromPassword(masterPassword, salt) {
  // Convert password to ArrayBuffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);

  // Import password as base key
  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Derive AES-256-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: KEY_LENGTH,
    },
    false, // Not extractable
    ["encrypt", "decrypt"]
  );

  return key;
}

/**
 * Use PBKDF2 to derive a symmetric encryption key from the salt and master password (legacy compatibility)
 * @param {string} masterPassword - User's master password
 * @param {ArrayBuffer} passwordSalt - Cryptographic salt as ArrayBuffer
 * @returns {Promise<CryptoKey>} - Derived AES-256-GCM key
 */
async function deriveSecretKey(masterPassword, passwordSalt) {
  // import the raw password into a CryptoKey
  const masterKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // use PBKDF2 to derive 256 bit AES-GCM key
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: passwordSalt,
      iterations: 100000,
      hash: "SHA-256",
    },
    masterKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Compute a SHA-512 hash from the input and return it as base64
 * @param {string|ArrayBuffer} input - Input to hash
 * @returns {Promise<string>} - Base64 encoded hash
 */
async function digestAsBase(input) {
  const data = typeof input === "string" ? textEncoder.encode(input) : input;
  const hash = await crypto.subtle.digest("SHA-512", data);
  return arrayBufferToBase64(hash);
}

/**
 * Export the CryptoKey to a raw ArrayBuffer
 * @param {CryptoKey} key - CryptoKey to export
 * @returns {Promise<ArrayBuffer>} - Raw key data
 */
async function exportKey(key) {
  return crypto.subtle.exportKey("raw", key);
}

/**
 * Encrypts a plaintext string using AES-GCM with the CryptoKey (legacy compatibility)
 * @param {CryptoKey} key - Encryption key
 * @param {string} plaintext - Text to encrypt
 * @returns {Promise<string>} - Encrypted text (iv:ciphertext format)
 */
async function encryptText(key, plaintext) {
  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Perform encryption
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plaintext)
  );

  const ivBase64 = arrayBufferToBase64(iv.buffer);
  const ciphertextBase64 = arrayBufferToBase64(encrypted);

  // combine iv and ciphertext for the password in the DB.
  return `${ivBase64}:${ciphertextBase64}`;
}

/**
 * Encrypt a password using AES-256-GCM (new implementation)
 * @param {string} plaintext - Password to encrypt
 * @param {string} masterPassword - User's master password
 * @returns {Promise<string>} - Base64 encoded encrypted data (includes salt, IV, and auth tag)
 */
export async function encryptPassword(plaintext, masterPassword) {
  try {
    // Generate random salt and IV
    const salt = await generateSalt();
    const iv = await generateIV();

    // Derive encryption key
    const key = await deriveKeyFromPassword(masterPassword, salt);

    // Convert plaintext to ArrayBuffer
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);

    // Encrypt using AES-256-GCM
    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: TAG_LENGTH * 8, // Convert to bits
      },
      key,
      plaintextBuffer
    );

    // Combine salt + IV + ciphertext (includes auth tag)
    const combinedBuffer = new Uint8Array(
      SALT_LENGTH + IV_LENGTH + ciphertextBuffer.byteLength
    );

    combinedBuffer.set(salt, 0);
    combinedBuffer.set(iv, SALT_LENGTH);
    combinedBuffer.set(
      new Uint8Array(ciphertextBuffer),
      SALT_LENGTH + IV_LENGTH
    );

    // Convert to base64 for storage/transmission
    const base64Encrypted = btoa(String.fromCharCode(...combinedBuffer));

    return base64Encrypted;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt password: " + error.message);
  }
}

/**
 * Decrypt a AES-GCM ciphertext using the provided key and IV (legacy compatibility)
 * @param {CryptoKey} key - Decryption key
 * @param {string} combined - Encrypted text (iv:ciphertext format)
 * @returns {Promise<string>} - Decrypted plaintext
 */
async function decryptText(key, combined) {
  const [ivBase64, ciphertextBase64] = combined.split(":");
  if (!ivBase64 || !ciphertextBase64)
    throw new Error("Invalid encrypted format");

  const iv = base64toArrayBuffer(ivBase64);
  const ciphertext = base64toArrayBuffer(ciphertextBase64);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );

  return textDecoder.decode(decrypted);
}

/**
 * Decrypt a password using AES-256-GCM (new implementation)
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} masterPassword - User's master password
 * @returns {Promise<string>} - Decrypted plaintext password
 */
export async function decryptPassword(encryptedData, masterPassword) {
  try {
    // Convert base64 to ArrayBuffer
    const combinedBuffer = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0)
    );

    // Extract salt, IV, and ciphertext
    const salt = combinedBuffer.slice(0, SALT_LENGTH);
    const iv = combinedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combinedBuffer.slice(SALT_LENGTH + IV_LENGTH);

    // Derive encryption key
    const key = await deriveKeyFromPassword(masterPassword, salt);

    // Decrypt using AES-256-GCM
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: TAG_LENGTH * 8, // Convert to bits
      },
      key,
      ciphertext
    );

    // Convert ArrayBuffer to string
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(plaintextBuffer);

    return plaintext;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt password: " + error.message);
  }
}

/**
 * Encrypt multiple passwords in batch
 * @param {Array<Object>} passwordEntries - Array of {application, username, password}
 * @param {string} masterPassword - User's master password
 * @returns {Promise<Array<Object>>} - Array of encrypted entries
 */
export async function encryptPasswordBatch(passwordEntries, masterPassword) {
  const encryptedEntries = [];

  for (const entry of passwordEntries) {
    const encryptedPassword = await encryptPassword(
      entry.password,
      masterPassword
    );
    encryptedEntries.push({
      application: entry.application,
      application_username: entry.application_username,
      password: encryptedPassword,
    });
  }

  return encryptedEntries;
}

/**
 * Decrypt multiple passwords in batch
 * @param {Array<Object>} encryptedEntries - Array of encrypted entries
 * @param {string} masterPassword - User's master password
 * @returns {Promise<Array<Object>>} - Array of decrypted entries
 */
export async function decryptPasswordBatch(encryptedEntries, masterPassword) {
  const decryptedEntries = [];

  for (const entry of encryptedEntries) {
    const decryptedPassword = await decryptPassword(
      entry.password,
      masterPassword
    );
    decryptedEntries.push({
      application: entry.application,
      password: decryptedPassword,
    });
  }

  return decryptedEntries;
}

/**
 * Validate that a master password can decrypt a given encrypted password
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} masterPassword - Master password to test
 * @returns {Promise<boolean>} - True if decryption successful
 */
export async function validateMasterPassword(encryptedData, masterPassword) {
  try {
    await decryptPassword(encryptedData, masterPassword);
    return true;
  } catch {
    return false;
  }
}

// Export cryptoUtils object for backward compatibility with existing components
export const cryptoUtils = {
  deriveSecretKey,
  encryptText,
  decryptText,
  exportKey,
  digestAsBase,
  generateSalt: generateSaltLegacy,
  generateSaltAsBase64,
  arrayBufferToBase64,
  base64toArrayBuffer,
};

export default {
  generateSalt,
  generateIV,
  deriveKeyFromPassword,
  encryptPassword,
  decryptPassword,
  encryptPasswordBatch,
  decryptPasswordBatch,
  validateMasterPassword,
  // Also export cryptoUtils for components expecting it
  cryptoUtils,
};
