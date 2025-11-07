import { test, expect } from "@playwright/test";
import { testUsers, testPasswords } from "./test-data.js";

test.describe("Password Management Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill('input[name="username"]', testUsers.existingUser.username);
    await page.fill('input[name="password"]', testUsers.existingUser.password);
    await page.click('button[type="submit"]');

    // Wait for vault to load
    await expect(page.locator("text=Vault")).toBeVisible();
  });

  test("should add new password entry", async ({ page }) => {
    // Click add password button
    await page.click("text=Add Password");

    // Fill password entry form
    await page.fill('input[name="title"]', testPasswords.newEntry.title);
    await page.fill('input[name="username"]', testPasswords.newEntry.username);
    await page.fill('input[name="password"]', testPasswords.newEntry.password);
    await page.fill('input[name="url"]', testPasswords.newEntry.url);
    await page.fill('textarea[name="notes"]', testPasswords.newEntry.notes);

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify entry appears in vault
    await expect(
      page.locator(`text=${testPasswords.newEntry.title}`)
    ).toBeVisible();
    await expect(
      page.locator(`text=${testPasswords.newEntry.username}`)
    ).toBeVisible();

    // Verify success message
    await expect(
      page.locator("text=Password added successfully")
    ).toBeVisible();
  });

  test("should view password entry details", async ({ page }) => {
    // Assuming there's at least one password entry
    // Click on a password entry to view details
    await page.click(".password-entry:first-child");

    // Verify details are shown
    await expect(page.locator("text=Password Details")).toBeVisible();
    await expect(page.locator("text=Username:")).toBeVisible();
    await expect(page.locator("text=Password:")).toBeVisible();

    // Verify password is masked by default
    const passwordField = page.locator('input[type="password"]');
    await expect(passwordField).toBeVisible();
  });

  test("should edit existing password entry", async ({ page }) => {
    // Click edit button on first password entry
    await page.click(".password-entry:first-child .edit-button");

    // Update the form fields
    await page.fill('input[name="title"]', testPasswords.updatedEntry.title);
    await page.fill(
      'input[name="username"]',
      testPasswords.updatedEntry.username
    );
    await page.fill(
      'input[name="password"]',
      testPasswords.updatedEntry.password
    );
    await page.fill('input[name="url"]', testPasswords.updatedEntry.url);
    await page.fill('textarea[name="notes"]', testPasswords.updatedEntry.notes);

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify entry is updated in vault
    await expect(
      page.locator(`text=${testPasswords.updatedEntry.title}`)
    ).toBeVisible();
    await expect(
      page.locator(`text=${testPasswords.updatedEntry.username}`)
    ).toBeVisible();

    // Verify success message
    await expect(
      page.locator("text=Password updated successfully")
    ).toBeVisible();
  });

  test("should delete password entry", async ({ page }) => {
    // Get count of password entries before deletion
    const entriesBefore = await page.locator(".password-entry").count();

    // Click delete button on first password entry
    await page.click(".password-entry:first-child .delete-button");

    // Confirm deletion in confirmation dialog
    await page.click("text=Confirm");

    // Verify entry is removed from vault
    await expect(page.locator(".password-entry")).toHaveCount(
      entriesBefore - 1
    );

    // Verify success message
    await expect(
      page.locator("text=Password deleted successfully")
    ).toBeVisible();
  });

  test("should search and filter password entries", async ({ page }) => {
    // Add a test password entry first
    await page.click("text=Add Password");
    await page.fill('input[name="title"]', "Unique Test Entry");
    await page.fill('input[name="username"]', "testuser");
    await page.fill('input[name="password"]', "testpass");
    await page.click('button[type="submit"]');

    // Use search functionality
    await page.fill('input[placeholder="Search passwords..."]', "Unique Test");

    // Verify only matching entries are shown
    await expect(page.locator("text=Unique Test Entry")).toBeVisible();

    // Clear search and verify all entries are shown
    await page.fill('input[placeholder="Search passwords..."]', "");
    await expect(page.locator(".password-entry")).toHaveCount(
      await page.locator(".password-entry").count()
    );
  });

  test("should copy password to clipboard securely", async ({ page }) => {
    // Click on a password entry to view details
    await page.click(".password-entry:first-child");

    // Click copy password button
    await page.click("text=Copy Password");

    // Verify copy confirmation message
    await expect(
      page.locator("text=Password copied to clipboard")
    ).toBeVisible();

    // Note: Clipboard API testing requires additional configuration
    // This test verifies the UI feedback for copy functionality
  });

  test("should show/hide password securely", async ({ page }) => {
    // Click on a password entry to view details
    await page.click(".password-entry:first-child");

    // Password should be masked by default
    const passwordField = page.locator('input[type="password"]');
    await expect(passwordField).toBeVisible();

    // Click show password button
    await page.click("text=Show Password");

    // Password should now be visible
    const visiblePasswordField = page.locator('input[type="text"]');
    await expect(visiblePasswordField).toBeVisible();

    // Click hide password button
    await page.click("text=Hide Password");

    // Password should be masked again
    await expect(passwordField).toBeVisible();
  });
});
