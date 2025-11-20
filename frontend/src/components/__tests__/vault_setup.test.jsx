import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "../../store/appStore.js";
import VaultSetup from "../vault_setup";
import {
  createOrUpdatePassword,
  deletePassword,
  getAllPasswords,
} from "../../utils/vault";
import { isAuthenticated, logout } from "../../utils/auth";
import {
  encryptPassword,
  decryptPassword,
  validateMasterPassword,
} from "../../utils/crypto.js";
import { setSecretKey } from "../../store/keySlice.js";

// Mock the API calls for db
jest.mock("../../utils/vault", () => ({
  createOrUpdatePassword: jest.fn(),
  getAllPasswords: jest.fn(),
  deletePassword: jest.fn(),
}));

// Mock authentication calls
jest.mock("../../utils/auth", () => ({
  isAuthenticated: jest.fn(),
  logout: jest.fn(),
}));

// helper for to render a component with Redux and React Router context
const renderWithProviders = (ui) => {
  return render(
    <Provider store={store}>
      <Router>{ui}</Router>
    </Provider>
  );
};

// Mock symmetric key for VaultSetup encryption calls.
beforeAll(async () => {
  // Use direct crypto functions instead of cryptoUtils
  const testPassword = "testpassword";
  const testData = "test data for key derivation";
  const encrypted = await encryptPassword(testData, testPassword);
  // Validate that we can decrypt with the same password
  const isValid = await validateMasterPassword(encrypted, testPassword);
  if (!isValid) {
    throw new Error("Failed to validate test password");
  }
});

describe("VaultSetup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default auth behaviour
    isAuthenticated.mockReturnValue(true);
    getAllPasswords.mockResolvedValue({ success: true, passwords: [] });
  });

  // The form field renders correctly
  it("renders from application, username, password fields and submit button", async () => {
    renderWithProviders(<VaultSetup />);

    await waitFor(() => {
      expect(screen.getByLabelText(/application/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /save password/i })
      ).toBeInTheDocument();
    });
  });

  // Type into input fields
  it("allows typing into the fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VaultSetup />);

    const appInput = screen.getByLabelText(/application/i);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(appInput, "MyApp");
    await user.type(usernameInput, "user123");
    await user.type(passwordInput, "pass@123");

    expect(appInput).toHaveValue("MyApp");
    expect(usernameInput).toHaveValue("user123");
    expect(passwordInput).toHaveValue("pass@123");
  });

  // User submites and triggers call with correct data and success message
  it("submits from with correct data when filled out", async () => {
    const user = userEvent.setup();
    createOrUpdatePassword.mockResolvedValue({
      success: true,
      message: "password entry saved successfully.",
    });
    getAllPasswords.mockResolvedValue({ success: true, passwords: [] });

    renderWithProviders(<VaultSetup />);

    await user.type(screen.getByLabelText(/application/i), "MyApp");
    await user.type(screen.getByLabelText(/username/i), "user123");
    await user.type(screen.getByLabelText(/password/i), "pass@123");
    await user.click(screen.getByRole("button", { name: /save password/i }));

    // Correct call made with correct payload
    await waitFor(() => {
      expect(createOrUpdatePassword).toHaveBeenCalledWith({
        application: "MyApp",
        application_username: "user123",
        password: expect.any(String),
      });
    });

    expect(
      await screen.findByText(/password entry saved successfully/i)
    ).toBeInTheDocument();
  });

  // Error message if password entry fails
  it("shows error message when submission fails", async () => {
    const user = userEvent.setup();
    createOrUpdatePassword.mockResolvedValueOnce({
      success: false,
      error: "Failed to store/update password",
    });

    renderWithProviders(<VaultSetup />);

    await user.type(screen.getByLabelText(/application/i), "MyApp");
    await user.type(screen.getByLabelText(/username/i), "user123");
    await user.type(screen.getByLabelText(/password/i), "pass@123");
    await user.click(screen.getByRole("button", { name: /save password/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/failed to store\/update password/i)
      ).toBeInTheDocument();
    });
  });

  // Load the saved records and supports deletion of a record
  it("lists entries and allows delete action", async () => {
    const fakeEntries = [
      {
        application: "App1",
        application_username: "user1@test.com",
        password: "encrypted:abc123",
      },
      {
        application: "App2",
        application_username: "user2@test.com",
        password: "encrypted:def456",
      },
    ];

    // Mock the decryptPassword function
    jest
      .spyOn(await import("../../utils/crypto.js"), "decryptPassword")
      .mockResolvedValueOnce("decryptedPassword1")
      .mockResolvedValueOnce("decryptedPassword2");

    getAllPasswords.mockResolvedValueOnce({
      success: true,
      passwords: fakeEntries,
    });
    deletePassword.mockResolvedValueOnce({
      success: true,
      message: "entry deleted successfully.",
    });

    renderWithProviders(<VaultSetup />);

    // wait for entries to load
    await waitFor(() => {
      expect(screen.getByText("App1")).toBeInTheDocument();
      expect(screen.getByText("App2")).toBeInTheDocument();
    });

    // Deletion of first entry - look for trash icon instead
    const trashIcons = screen.getAllByTestId(/trash-icon/i);
    if (trashIcons.length > 0) {
      await userEvent.click(trashIcons[0]);
    }

    // Confirm deletion
    const deleteButton = await screen.findByText(/delete/i);
    await userEvent.click(deleteButton);

    expect(deletePassword).toHaveBeenCalledWith("App1");
    expect(
      await screen.findByText(/entry deleted successfully/i)
    ).toBeInTheDocument();
  });

  // Redirect login if user isn't authenticated
  it("redirects to login when not authenticated", () => {
    isAuthenticated.mockReturnValue(false);

    renderWithProviders(<VaultSetup />);

    // Upon failure logout is asserted and triggered
    expect(logout).toHaveBeenCalled();
  });
});

//Webcrypto testing for vault encryption/decrytion.
describe("VaultSetup encryption/decryption", () => {
  const masterPassword = "password123!";

  // Ensure the data encrypted with key can be decrypted back to plaintext.
  test("encrypts and decrypts correctly", async () => {
    const plaintext = "MySuperSecretPassword!";
    const encrypted = await encryptPassword(plaintext, masterPassword);
    const decrypted = await decryptPassword(encrypted, masterPassword);
    expect(decrypted).toBe(plaintext);
  });

  // confirm each encryption creates unique ciphertext
  // and verify the use  of random IV
  test("ciphertext is different each time (unique iv)", async () => {
    const plaintext = "repeat";
    const enc1 = await encryptPassword(plaintext, masterPassword);
    const enc2 = await encryptPassword(plaintext, masterPassword);
    expect(enc1).not.toEqual(enc2);
  });

  // Test master password validation
  test("validateMasterPassword works correctly", async () => {
    const plaintext = "testpassword123";
    const encrypted = await encryptPassword(plaintext, masterPassword);

    const isValid = await validateMasterPassword(encrypted, masterPassword);
    expect(isValid).toBe(true);

    const isInvalid = await validateMasterPassword(encrypted, "wrongpassword");
    expect(isInvalid).toBe(false);
  });
});
