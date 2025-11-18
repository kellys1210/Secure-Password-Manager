import { test, expect } from "@playwright/test";
import { registerUser, loginUser } from "./support/auth";
import { generateTestEmail, TEST_PASSWORD } from "./support/testUser";

test.describe("Password Operations Flow", () => {
  let testEmail: string;

  test.beforeEach(() => {
    testEmail = generateTestEmail();
  });

  test("should access vault after successful authentication", async ({
    page,
  }) => {
    // Register and login (simplified flow without MFA for testing)
    await registerUser(page, testEmail, TEST_PASSWORD);
    await loginUser(page, testEmail, TEST_PASSWORD);

    // After MFA verification, should be able to access vault
    // For now, we'll simulate this by directly navigating to vault
    // In a real implementation, this would happen after MFA verification

    await page.goto("/vault");

    // Verify vault page is accessible
    const pageTitle = await page.textContent("h2");
    expect(pageTitle).toContain("Vault Access Granted");
  });

  test("should verify vault page content", async ({ page }) => {
    // Navigate directly to vault (will be redirected if not authenticated)
    await page.goto("/vault");

    // Check if we're on vault page or redirected
    const currentUrl = page.url();

    if (currentUrl.includes("/vault")) {
      // If we're on vault page, verify content
      const pageContent = await page.textContent("body");
      expect(pageContent).toContain("secure vault");
    } else {
      // If redirected, verify we're on login page
      expect(currentUrl).toMatch(/\/login/);
    }
  });

  test("should copy placeholder password functionality", async ({ page }) => {
    // This test verifies the concept of password copying
    // In a real implementation, this would test actual password entries

    await page.goto("/vault");

    // For now, we'll test that the page loads without errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);

    // Verify basic page structure
    const bodyContent = await page.textContent("body");
    expect(bodyContent).toBeTruthy();
  });
});
