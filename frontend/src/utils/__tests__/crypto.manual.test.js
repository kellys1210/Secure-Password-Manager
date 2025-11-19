/**
 * Manual test for crypto.js encryption utilities
 * Run this in a browser console to verify encryption works correctly
 *
 * Usage: Open browser console on any page and paste this code
 */

// Copy and paste this entire function into browser console
// eslint-disable-next-line no-unused-vars
async function testEncryption() {
  console.log("=== Starting Crypto Tests ===");

  const testMasterPassword = "TestMasterPassword123!";
  const testPlaintextPassword = "MySecretPassword456!";

  try {
    // Test 1: Basic encryption/decryption
    console.log("Test 1: Basic encryption/decryption");
    const encrypted = await encryptPassword(
      testPlaintextPassword,
      testMasterPassword
    );
    console.log("Encrypted:", encrypted);
    const decrypted = await decryptPassword(encrypted, testMasterPassword);
    console.log("Decrypted:", decrypted);
    console.log("✓ Test 1 passed:", decrypted === testPlaintextPassword);

    // Test 2: Different ciphertexts for same password
    console.log("\nTest 2: Different ciphertexts for same password");
    const encrypted1 = await encryptPassword(
      testPlaintextPassword,
      testMasterPassword
    );
    const encrypted2 = await encryptPassword(
      testPlaintextPassword,
      testMasterPassword
    );
    console.log("Encrypted 1:", encrypted1);
    console.log("Encrypted 2:", encrypted2);
    console.log("✓ Test 2 passed:", encrypted1 !== encrypted2);

    // Test 3: Wrong password fails
    console.log("\nTest 3: Wrong password fails");
    try {
      await decryptPassword(encrypted, "WrongPassword");
      console.log("✗ Test 3 failed: Should have thrown error");
    } catch {
      console.log("✓ Test 3 passed: Correctly rejected wrong password");
    }

    // Test 4: Special characters
    console.log("\nTest 4: Special characters");
    const specialPassword = "P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?";
    const encryptedSpecial = await encryptPassword(
      specialPassword,
      testMasterPassword
    );
    const decryptedSpecial = await decryptPassword(
      encryptedSpecial,
      testMasterPassword
    );
    console.log("✓ Test 4 passed:", decryptedSpecial === specialPassword);

    // Test 5: Unicode and emojis
    console.log("\nTest 5: Unicode and emojis");
    const unicodePassword = "Pässwörd🔐withémoji";
    const encryptedUnicode = await encryptPassword(
      unicodePassword,
      testMasterPassword
    );
    const decryptedUnicode = await decryptPassword(
      encryptedUnicode,
      testMasterPassword
    );
    console.log("✓ Test 5 passed:", decryptedUnicode === unicodePassword);

    // Test 6: Batch encryption
    console.log("\nTest 6: Batch encryption");
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
    console.log("Encrypted entries:", encryptedEntries);
    const decryptedEntries = await decryptPasswordBatch(
      encryptedEntries,
      testMasterPassword
    );
    console.log("Decrypted entries:", decryptedEntries);
    console.log(
      "✓ Test 6 passed:",
      decryptedEntries.length === entries.length &&
        decryptedEntries[0].password === entries[0].password
    );

    // Test 7: Data size check
    console.log("\nTest 7: Data size check");
    const sizeInBytes = new TextEncoder().encode(encrypted).length;
    console.log("Encrypted size:", sizeInBytes, "bytes");
    console.log("✓ Test 7 passed:", sizeInBytes < 1000); // Should be under 1KB

    console.log("\n=== All tests completed successfully! ===");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Load the crypto module and run tests
const script = document.createElement("script");
script.type = "module";
script.textContent = `
  import { encryptPassword, decryptPassword, encryptPasswordBatch, decryptPasswordBatch } from '${window.location.origin}/src/utils/crypto.js';
  
  // Make functions available globally for the test
  window.encryptPassword = encryptPassword;
  window.decryptPassword = decryptPassword;
  window.encryptPasswordBatch = encryptPasswordBatch;
  window.decryptPasswordBatch = decryptPasswordBatch;
  
  // Run tests
  testEncryption();
`;

document.head.appendChild(script);

console.log("Manual crypto test script loaded. Check console for results.");
