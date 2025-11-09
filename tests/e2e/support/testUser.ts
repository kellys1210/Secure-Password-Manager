/**
 * Generate unique test email addresses
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `testuser_${timestamp}_${random}@test.com`;
}

/**
 * Standard test password that meets requirements
 */
export const TEST_PASSWORD = "TestPassword123!";
