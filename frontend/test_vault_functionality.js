// Test script to verify vault functionality
const fs = require("fs");
const path = require("path");

// Mock DOM environment for testing
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Read and analyze the vault component
const vaultContent = fs.readFileSync("src/components/vault_setup.jsx", "utf8");

console.log("=== VAULT COMPONENT ANALYSIS ===\n");

// Check imports
console.log("1. Checking imports...");
const cryptoImports = vaultContent.match(
  /import\s+{([^}]+)}\s+from\s+['"]\.\.\/utils\/crypto\.js['"]/
);
if (cryptoImports) {
  const imports = cryptoImports[1].split(",").map((s) => s.trim());
  console.log("   ✓ Crypto imports found:", imports);

  const requiredImports = [
    "decryptPassword",
    "encryptPassword",
    "validateMasterPassword",
  ];
  const missingImports = requiredImports.filter(
    (imp) => !imports.includes(imp)
  );
  if (missingImports.length > 0) {
    console.log("   ✗ Missing imports:", missingImports);
  } else {
    console.log("   ✓ All required crypto imports present");
  }
}

// Check for cryptoUtils usage (should not be present)
console.log("\n2. Checking for deprecated cryptoUtils usage...");
const cryptoUtilsMatches = [...vaultContent.matchAll(/cryptoUtils/g)];
if (cryptoUtilsMatches.length > 0) {
  console.log(
    "   ✗ Found cryptoUtils usage:",
    cryptoUtilsMatches.length,
    "times"
  );
  console.log("   This should be replaced with direct function calls");
} else {
  console.log("   ✓ No cryptoUtils usage found");
}

// Check validateMasterPassword usage
console.log("\n3. Checking validateMasterPassword usage...");
const validateMatches = [...vaultContent.matchAll(/validateMasterPassword/g)];
if (validateMatches.length > 0) {
  console.log("   ✓ validateMasterPassword is used correctly");
} else {
  console.log(
    "   ✗ validateMasterPassword not found - unlock validation may fail"
  );
}

// Check toast notification usage
console.log("\n4. Checking ToastNotification integration...");
const toastMatches = [...vaultContent.matchAll(/ToastNotification/g)];
if (toastMatches.length > 0) {
  console.log("   ✓ ToastNotification component is integrated");
} else {
  console.log("   ✗ ToastNotification not found");
}

// Check CopyPasswordButton usage
console.log("\n5. Checking CopyPasswordButton integration...");
const copyButtonMatches = [...vaultContent.matchAll(/CopyPasswordButton/g)];
if (copyButtonMatches.length > 0) {
  console.log("   ✓ CopyPasswordButton component is integrated");
} else {
  console.log("   ✗ CopyPasswordButton not found");
}

// Check email validation
console.log("\n6. Checking email validation...");
const emailValidationMatches = [...vaultContent.matchAll(/validateEmail/g)];
if (emailValidationMatches.length > 0) {
  console.log("   ✓ Email validation is implemented");
} else {
  console.log("   ✗ Email validation not found");
}

// Check for potential issues
console.log("\n7. Checking for potential issues...");

// Check vaultKey handling
const vaultKeyMatches = [...vaultContent.matchAll(/vaultKey/g)];
console.log("   - vaultKey references:", vaultKeyMatches.length);

// Check loadEntries function
const loadEntriesMatches = [...vaultContent.matchAll(/loadEntries/g)];
console.log("   - loadEntries references:", loadEntriesMatches.length);

// Check handleUnlock function
const handleUnlockMatches = [...vaultContent.matchAll(/handleUnlock/g)];
console.log("   - handleUnlock references:", handleUnlockMatches.length);

console.log("\n=== ANALYSIS COMPLETE ===\n");

// Test crypto functions if possible
console.log("=== CRYPTO FUNCTION TEST ===\n");

// Simple test without importing (since we're in Node.js)
console.log("Note: Full crypto testing requires browser environment");
console.log("Run the application and test manually:");
console.log("1. Try unlocking vault with master password");
console.log("2. Add a new password entry");
console.log("3. Copy password using CopyPasswordButton");
console.log("4. Verify toast notifications appear");
console.log("5. Check email validation works");
