import { Page } from "@playwright/test";

/**
 * Register a new user
 */
export const registerUser = async (
  page: Page,
  email: string,
  password: string
): Promise<void> => {
  await page.goto("/register");

  // Fill registration form using element IDs (since no data-testid attributes exist yet)
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirm", password);

  // Submit the form
  await page.click("button[type='submit']");

  // Wait for navigation or success message
  await page.waitForTimeout(2000);
};

/**
 * Login with existing credentials
 */
export const loginUser = async (
  page: Page,
  email: string,
  password: string
): Promise<void> => {
  await page.goto("/login");

  // Fill login form using element IDs
  await page.fill("#email", email);
  await page.fill("#password", password);

  // Submit the form
  await page.click("button[type='submit']");

  // Wait for navigation
  await page.waitForTimeout(2000);
};

/**
 * Check if user is redirected to login when accessing protected routes
 */
export const verifyRedirectToLogin = async (
  page: Page,
  protectedRoute: string
): Promise<void> => {
  await page.goto(protectedRoute);

  // Check if we're redirected to login page
  await page.waitForURL(/\/login/);
};
