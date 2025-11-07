// Test data for E2E tests
export const testUsers = {
  validUser: {
    username: "testuser_" + Date.now(),
    email: `testuser_${Date.now()}@example.com`,
    password: "TestPassword123!",
    confirmPassword: "TestPassword123!",
  },

  existingUser: {
    username: "existinguser",
    email: "existinguser@example.com",
    password: "ExistingPassword123!",
  },

  invalidUser: {
    username: "invalid",
    email: "invalid-email",
    password: "short",
    confirmPassword: "mismatch",
  },
};

export const testPasswords = {
  newEntry: {
    title: "Test Password Entry",
    username: "testusername",
    password: "TestPassword123!",
    url: "https://example.com",
    notes: "Test notes for password entry",
  },

  updatedEntry: {
    title: "Updated Password Entry",
    username: "updatedusername",
    password: "UpdatedPassword123!",
    url: "https://updated-example.com",
    notes: "Updated test notes",
  },
};

// Helper function to generate unique test data
export function generateTestUser() {
  const timestamp = Date.now();
  return {
    username: `testuser_${timestamp}`,
    email: `testuser_${timestamp}@example.com`,
    password: "TestPassword123!",
    confirmPassword: "TestPassword123!",
  };
}
