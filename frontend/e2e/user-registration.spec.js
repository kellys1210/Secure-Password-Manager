import { test, expect } from "@playwright/test";
import { testUsers, generateTestUser } from "./test-data.js";

test.describe("User Registration Flow", () => {
  test("should successfully register a new user", async ({ page }) => {
    // Navigate to registration page
    await page.goto("/register");

    // Verify we're on the registration page
    await expect(page).toHaveURL(/.*\/register/);

    // Fill registration form with valid data
    const testUser = generateTestUser();

    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.confirmPassword);

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify successful registration and redirect
    // This might redirect to login, MFA setup, or vault depending on implementation
    await expect(page).not.toHaveURL(/.*\/register/);

    // Verify success message or appropriate redirect
    // This will need to be adjusted based on actual application behavior
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      await expect(page.locator("text=Registration successful")).toBeVisible();
    } else if (currentUrl.includes("/setup_mfa")) {
      await expect(page.locator("text=Set up MFA")).toBeVisible();
    } else if (currentUrl.includes("/vault")) {
      await expect(page.locator("text=Vault")).toBeVisible();
    }
  });

  test("should show validation errors for invalid registration data", async ({
    page,
  }) => {
    await page.goto("/register");

    // Fill form with invalid data
    await page.fill('input[name="username"]', testUsers.invalidUser.username);
    await page.fill('input[name="email"]', testUsers.invalidUser.email);
    await page.fill('input[name="password"]', testUsers.invalidUser.password);
    await page.fill(
      'input[name="confirmPassword"]',
      testUsers.invalidUser.confirmPassword
    );

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify validation errors are shown
    // These selectors will need to be adjusted based on actual error display implementation
    await expect(page.locator("text=Invalid email")).toBeVisible();
    await expect(page.locator("text=Password too short")).toBeVisible();
    await expect(page.locator("text=Passwords do not match")).toBeVisible();
  });

  test("should prevent duplicate username/email registration", async ({
    page,
  }) => {
    await page.goto("/register");

    // Try to register with existing user data
    await page.fill('input[name="username"]', testUsers.existingUser.username);
    await page.fill('input[name="email"]', testUsers.existingUser.email);
    await page.fill('input[name="password"]', testUsers.existingUser.password);
    await page.fill(
      'input[name="confirmPassword"]',
      testUsers.existingUser.password
    );

    await page.click('button[type="submit"]');

    // Verify error message for duplicate registration
    await expect(page.locator("text=Username already exists")).toBeVisible();
    await expect(page.locator("text=Email already registered")).toBeVisible();
  });
});
