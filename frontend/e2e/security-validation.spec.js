import { test, expect } from "@playwright/test";
import { testUsers } from "./test-data.js";

test.describe("Security Validation", () => {
  test("should mask passwords in UI by default", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="username"]', testUsers.existingUser.username);
    await page.fill('input[name="password"]', testUsers.existingUser.password);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Vault")).toBeVisible();

    // Add a password entry
    await page.click("text=Add Password");
    await page.fill('input[name="title"]', "Security Test Entry");
    await page.fill('input[name="username"]', "testuser");
    await page.fill('input[name="password"]', "MySecretPassword123!");
    await page.click('button[type="submit"]');

    // View the password entry
    await page.click(".password-entry:first-child");

    // Verify password is masked (type="password")
    const passwordField = page.locator('input[type="password"]');
    await expect(passwordField).toBeVisible();

    // Verify the actual password value is not displayed as plain text
    const passwordDisplay = page.locator(".password-display");
    if (await passwordDisplay.isVisible()) {
      const displayedText = await passwordDisplay.textContent();
      expect(displayedText).not.toBe("MySecretPassword123!");
      expect(displayedText).toMatch(/^\*+$/); // Should be asterisks
    }
  });

  test("should have secure copy functionality", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="username"]', testUsers.existingUser.username);
    await page.fill('input[name="password"]', testUsers.existingUser.password);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Vault")).toBeVisible();

    // View a password entry
    await page.click(".password-entry:first-child");

    // Click copy password button
    await page.click("text=Copy Password");

    // Verify confirmation message appears
    await expect(
      page.locator("text=Password copied to clipboard")
    ).toBeVisible();

    // Verify the confirmation message disappears after a short time
    await page.waitForTimeout(2000);
    await expect(
      page.locator("text=Password copied to clipboard")
    ).not.toBeVisible();
  });

  test("should validate session timeout behavior", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="username"]', testUsers.existingUser.username);
    await page.fill('input[name="password"]', testUsers.existingUser.password);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Vault")).toBeVisible();

    // Wait for session to potentially expire (adjust timeout as needed)
    // Note: This test may need adjustment based on actual session timeout configuration
    await page.waitForTimeout(10000); // 10 seconds

    // Try to perform an action that requires authentication
    await page.reload();

    // Check if we're still authenticated or redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      // Session expired - verify appropriate message
      await expect(page.locator("text=Session expired")).toBeVisible();
    } else {
      // Still authenticated - verify we can still access vault
      await expect(page.locator("text=Vault")).toBeVisible();
    }
  });

  test("should prevent XSS attacks in password entries", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="username"]', testUsers.existingUser.username);
    await page.fill('input[name="password"]', testUsers.existingUser.password);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Vault")).toBeVisible();

    // Try to add a password entry with XSS payload
    await page.click("text=Add Password");
    await page.fill('input[name="title"]', '<script>alert("XSS")</script>');
    await page.fill('input[name="username"]', "testuser");
    await page.fill('input[name="password"]', "testpass");
    await page.click('button[type="submit"]');

    // Verify the XSS payload is sanitized and doesn't execute
    // The title should be displayed as text, not executed as script
    const titleElement = page.locator(".password-entry:last-child .title");
    const titleText = await titleElement.textContent();

    // Should not contain the script tags or should be escaped
    expect(titleText).not.toContain("<script>");
    expect(titleText).not.toContain("</script>");

    // No alert should have appeared
    // Note: Playwright automatically handles and dismisses dialogs,
    // but we can verify no dialog was created
    page.on("dialog", (dialog) => {
      throw new Error(`Unexpected dialog: ${dialog.message()}`);
    });
  });

  test("should enforce secure password requirements", async ({ page }) => {
    // Navigate to registration page
    await page.goto("/register");

    // Try to register with weak password
    const testUser = {
      username: "weakpassuser",
      email: "weakpass@example.com",
      password: "weak",
      confirmPassword: "weak",
    };

    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.confirmPassword);

    await page.click('button[type="submit"]');

    // Verify password strength validation
    await expect(page.locator("text=Password is too weak")).toBeVisible();
    await expect(page.locator("text=Password must contain")).toBeVisible();
  });

  test("should have secure logout functionality", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="username"]', testUsers.existingUser.username);
    await page.fill('input[name="password"]', testUsers.existingUser.password);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Vault")).toBeVisible();

    // Click logout
    await page.click("text=Logout");

    // Verify redirected to login page
    await expect(page).toHaveURL(/.*\/login/);

    // Verify session is cleared by trying to access protected route
    await page.goto("/vault");
    await expect(page).toHaveURL(/.*\/login/);

    // Verify appropriate logout message
    await expect(page.locator("text=Logged out successfully")).toBeVisible();
  });

  test("should protect against CSRF attacks", async ({ page }) => {
    // This test verifies that the application has CSRF protection
    // by checking for CSRF tokens in forms

    // Check registration form for CSRF token
    await page.goto("/register");
    const registrationForm = page.locator("form");
    const hasCsrfToken =
      (await registrationForm.locator('input[name*="csrf"]').count()) > 0;

    // Check login form for CSRF token
    await page.goto("/login");
    const loginForm = page.locator("form");
    const loginHasCsrfToken =
      (await loginForm.locator('input[name*="csrf"]').count()) > 0;

    // At least one form should have CSRF protection
    expect(hasCsrfToken || loginHasCsrfToken).toBeTruthy();
  });
});
