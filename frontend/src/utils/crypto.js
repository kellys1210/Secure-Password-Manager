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

/**
 * Generate a cryptographically secure random salt
 * @returns {Promise<Uint8Array>} - Random salt
 */
export async function generateSalt() {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
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
 * Derive encryption key from master password using PBKDF2
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
 * Encrypt a password using AES-256-GCM
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
 * Decrypt a password using AES-256-GCM
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
  } catch (error) {
    return false;
  }
}

export default {
  generateSalt,
  generateIV,
  deriveKeyFromPassword,
  encryptPassword,
  decryptPassword,
  encryptPasswordBatch,
  decryptPasswordBatch,
  validateMasterPassword,
};
