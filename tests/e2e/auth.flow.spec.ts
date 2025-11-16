import { test, expect } from "@playwright/test";
import { registerUser, loginUser, verifyRedirectToLogin } from "./support/auth";
import { generateTestEmail, TEST_PASSWORD } from "./support/testUser";

test.describe("Authentication Flow", () => {
  let testEmail: string;

  test.beforeEach(() => {
    testEmail = generateTestEmail();
  });

  test("should register a new user successfully", async ({ page }) => {
    // Listen for console errors and fail test if any occur
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await registerUser(page, testEmail, TEST_PASSWORD);

    // Check for success indicators
    // Registration should redirect to MFA setup or show success message
    const currentUrl = page.url();
    const pageContent = await page.textContent("body");

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0);

    // Registration should be successful (either redirects to MFA or shows success)
    expect(currentUrl).toMatch(/\/setup_mfa|\/login/);
  });

  test("should login with valid credentials", async ({ page }) => {
    // First register the user
    await registerUser(page, testEmail, TEST_PASSWORD);

    // Then login with the same credentials
    await loginUser(page, testEmail, TEST_PASSWORD);

    // Login should redirect to MFA verification
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/verify_mfa/);
  });

  test("should redirect to login when accessing vault without authentication", async ({
    page,
  }) => {
    await verifyRedirectToLogin(page, "/vault");

    // Should be on login page
    expect(page.url()).toMatch(/\/login/);
  });

  test("should show error with invalid login credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill with invalid credentials
    await page.fill("#email", "invalid@test.com");
    await page.fill("#password", "WrongPassword123!");
    await page.click("button[type='submit']");

    // Wait for error message
    await page.waitForTimeout(1000);

    // Check for error message
    const errorMessage = await page.textContent("p");
    expect(errorMessage).toContain("Invalid credentials");
  });
});
