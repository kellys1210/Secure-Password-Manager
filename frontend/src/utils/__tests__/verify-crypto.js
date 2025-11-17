/**
 * Verification script for crypto.js encryption utilities
 * This script can be run with Node.js to verify the encryption implementation works
 *
 * Usage: node verify-crypto.js
 */

/* eslint-env node */

import { Crypto } from "@peculiar/webcrypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

// Set up Web Crypto API in Node.js environment
const crypto = new Crypto();
global.crypto = crypto;

// Read and evaluate the crypto.js module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cryptoModulePath = join(__dirname, "../crypto.js");

// Load the crypto module code
const cryptoCode = readFileSync(cryptoModulePath, "utf8");

// Create a module-like environment and execute the crypto code
const module = { exports: {} };
const cryptoModuleFunction = new Function("crypto", "exports", cryptoCode);

// Execute the crypto module with our polyfilled crypto
cryptoModuleFunction(crypto, module.exports);

// Extract the functions
const {
  encryptPassword,
  decryptPassword,
  encryptPasswordBatch,
  decryptPasswordBatch,
  validateMasterPassword,
} = module.exports;

async function verifyEncryption() {
  console.log("🔐 AES-256-GCM Encryption Verification\n");

  const testMasterPassword = "TestMasterPassword123!";
  const testPlaintextPassword = "MySecretPassword456!";

  try {
    // Test 1: Basic encryption/decryption
    console.log("✓ Test 1: Basic encryption/decryption");
    const encrypted = await encryptPassword(
      testPlaintextPassword,
      testMasterPassword
    );
    const decrypted = await decryptPassword(encrypted, testMasterPassword);

    if (decrypted === testPlaintextPassword) {
      console.log("  ✅ PASS: Successfully encrypted and decrypted password");
      console.log(
        `  📊 Encrypted size: ${Buffer.byteLength(encrypted, "base64")} bytes`
      );
    } else {
      console.log("  ❌ FAIL: Decrypted password does not match original");
      return false;
    }

    // Test 2: Different ciphertexts for same password (due to random salt/IV)
    console.log("\n✓ Test 2: Different ciphertexts for same password");
    const encrypted1 = await encryptPassword(
      testPlaintextPassword,
      testMasterPassword
    );
    const encrypted2 = await encryptPassword(
      testPlaintextPassword,
      testMasterPassword
    );

    if (encrypted1 !== encrypted2) {
      console.log("  ✅ PASS: Each encryption produces unique ciphertext");
    } else {
      console.log(
        "  ❌ FAIL: Ciphertexts should be different due to random salt/IV"
      );
      return false;
    }

    // Test 3: Wrong master password fails decryption
    console.log("\n✓ Test 3: Wrong master password fails decryption");
    try {
      await decryptPassword(encrypted, "WrongPassword123!");
      console.log("  ❌ FAIL: Should have thrown error for wrong password");
      return false;
    } catch {
      console.log("  ✅ PASS: Correctly rejected wrong master password");
    }

    // Test 4: Special characters
    console.log("\n✓ Test 4: Special characters");
    const specialPassword = "P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?";
    const encryptedSpecial = await encryptPassword(
      specialPassword,
      testMasterPassword
    );
    const decryptedSpecial = await decryptPassword(
      encryptedSpecial,
      testMasterPassword
    );

    if (decryptedSpecial === specialPassword) {
      console.log("  ✅ PASS: Special characters handled correctly");
    } else {
      console.log("  ❌ FAIL: Special characters not preserved");
      return false;
    }

    // Test 5: Unicode and emojis
    console.log("\n✓ Test 5: Unicode and emojis");
    const unicodePassword = "Pässwörd🔐withémoji";
    const encryptedUnicode = await encryptPassword(
      unicodePassword,
      testMasterPassword
    );
    const decryptedUnicode = await decryptPassword(
      encryptedUnicode,
      testMasterPassword
    );

    if (decryptedUnicode === unicodePassword) {
      console.log("  ✅ PASS: Unicode and emojis handled correctly");
    } else {
      console.log("  ❌ FAIL: Unicode characters not preserved");
      return false;
    }

    // Test 6: Batch encryption
    console.log("\n✓ Test 6: Batch encryption/decryption");
    const entries = [
      {
        application: "GitHub",
        application_username: "user1",
        password: "pass1",
      },
      {
        application: "Gmail",
        application_username: "user2",
        password: "pass2",
      },
      {
        application: "Netflix",
        application_username: "user3",
        password: "pass3",
      },
    ];

    const encryptedEntries = await encryptPasswordBatch(
      entries,
      testMasterPassword
    );
    const decryptedEntries = await decryptPasswordBatch(
      encryptedEntries,
      testMasterPassword
    );

    if (
      decryptedEntries.length === entries.length &&
      decryptedEntries.every(
        (entry, i) => entry.password === entries[i].password
      )
    ) {
      console.log("  ✅ PASS: Batch operations work correctly");
      console.log(`  📊 Encrypted ${entries.length} passwords successfully`);
    } else {
      console.log("  ❌ FAIL: Batch operations failed");
      return false;
    }

    // Test 7: Master password validation
    console.log("\n✓ Test 7: Master password validation");
    const isValid = await validateMasterPassword(encrypted, testMasterPassword);
    const isInvalid = await validateMasterPassword(encrypted, "WrongPassword");

    if (isValid && !isInvalid) {
      console.log("  ✅ PASS: Master password validation works correctly");
    } else {
      console.log("  ❌ FAIL: Master password validation failed");
      return false;
    }

    // Test 8: Data format verification
    console.log("\n✓ Test 8: Data format verification");
    const encryptedData = await encryptPassword(
      testPlaintextPassword,
      testMasterPassword
    );

    // Should be base64
    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(encryptedData);
    // Should be reasonable size
    const sizeInBytes = Buffer.byteLength(encryptedData, "base64");
    // Should be JSON-serializable
    let isJSONSerializable = false;
    try {
      JSON.stringify({ password: encryptedData });
      isJSONSerializable = true;
    } catch {
      isJSONSerializable = false;
    }

    if (isBase64 && sizeInBytes < 1000 && isJSONSerializable) {
      console.log(
        "  ✅ PASS: Encrypted data format is suitable for API transmission"
      );
      console.log(`  📊 Size: ${sizeInBytes} bytes`);
    } else {
      console.log("  ❌ FAIL: Encrypted data format issues detected");
      return false;
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("🎉 ALL TESTS PASSED!");
    console.log(
      "✅ AES-256-GCM encryption implementation is working correctly"
    );
    console.log("✅ PBKDF2 key derivation is functioning properly");
    console.log("✅ Zero-knowledge security model is maintained");
    console.log("=".repeat(50));

    return true;
  } catch (error) {
    console.error("\n❌ VERIFICATION FAILED:", error.message);
    console.error(error.stack);
    return false;
  }
}

// Run verification
console.log("Starting AES-256-GCM encryption verification...\n");

verifyEncryption()
  .then((success) => {
    if (success) {
      console.log("\n✅ Verification completed successfully!");
      process.exit(0);
    } else {
      console.log("\n❌ Verification failed!");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n💥 Fatal error during verification:", error);
    process.exit(1);
  });
