import { test, expect } from "@playwright/test";
import { testUsers } from "./test-data.js";

test.describe("User Login Flow", () => {
  test("should successfully login with valid credentials", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Verify we're on the login page
    await expect(page).toHaveURL(/.*\/login/);

    // Fill login form with valid credentials
    await page.fill('input[name="username"]', testUsers.existingUser.username);
    await page.fill('input[name="password"]', testUsers.existingUser.password);

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify successful login and redirect to vault
    // This might go through MFA verification first
    const currentUrl = page.url();

    if (currentUrl.includes("/verify_mfa")) {
      // Handle MFA verification
      await expect(page.locator("text=Verify MFA")).toBeVisible();
      // Note: MFA verification would require additional test setup
    } else if (currentUrl.includes("/vault")) {
      // Direct access to vault
      await expect(page.locator("text=Vault")).toBeVisible();
      await expect(page.locator("text=Welcome")).toBeVisible();
    }

    // Verify we're not on the login page anymore
    await expect(page).not.toHaveURL(/.*\/login/);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill login form with invalid credentials
    await page.fill('input[name="username"]', "nonexistentuser");
    await page.fill('input[name="password"]', "wrongpassword");

    await page.click('button[type="submit"]');

    // Verify error message is shown
    await expect(
      page.locator("text=Invalid username or password")
    ).toBeVisible();

    // Verify we're still on the login page
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    await page.goto("/login");

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator("text=Username is required")).toBeVisible();
    await expect(page.locator("text=Password is required")).toBeVisible();
  });

  test("should redirect to login when accessing protected routes without authentication", async ({
    page,
  }) => {
    // Try to access vault without logging in
    await page.goto("/vault");

    // Should be redirected to login page
    await expect(page).toHaveURL(/.*\/login/);

    // Try to access other protected routes
    await page.goto("/setup_mfa");
    await expect(page).toHaveURL(/.*\/login/);

    await page.goto("/verify_mfa");
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("should have working navigation between login and register", async ({
    page,
  }) => {
    await page.goto("/login");

    // Click register link
    await page.click("text=Register");

    // Should navigate to registration page
    await expect(page).toHaveURL(/.*\/register/);

    // Click login link from registration page
    await page.click("text=Login");

    // Should navigate back to login page
    await expect(page).toHaveURL(/.*\/login/);
  });
});
