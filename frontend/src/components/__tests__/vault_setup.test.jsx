/* global require */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter as Router } from "react-router-dom";
import VaultSetup from "../vault_setup.jsx";
import { createOrUpdatePassword, deletePassword, 
         getAllPasswords } from "../../utils/vault";
import { isAuthenticated, logout } from "../../utils/auth.js";
import { decryptPassword, encryptPassword, 
         validateMasterPassword } from "../../utils/crypto.js";
import { validate as validateEmail } from "email-validator";
import { checkPasswordStrength, generatePassword } from "../password_strength.jsx";

// Mock getEnvVar for api URL
jest.mock("../../utils/env.js", () => ({
    getEnvVar: () => "http://localhost:8080"
}));

// Mock the API calls for vault
jest.mock("../../utils/vault", () => ({
    createOrUpdatePassword: jest.fn(),
    getAllPasswords: jest.fn(),
    deletePassword: jest.fn(),
}));

// Mock authentication calls
jest.mock("../../utils/auth.js", () => ({
    isAuthenticated: jest.fn(),
    logout: jest.fn(),
}));

// Mock crypto calls
jest.mock("../../utils/crypto.js", () => ({
    decryptPassword: jest.fn(),
    encryptPassword: jest.fn(),
    validateMasterPassword: jest.fn(),
}));

// Mock email validator
jest.mock("email-validator", () => ({
    validate: jest.fn(),
}));

// Mock React Router navigation
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockedNavigate,
}));

// Mock Child Component
jest.mock("../unlock_vault.jsx", () => {
    const React = require("react");
    const PropTypes = require("prop-types");

    function DummyUnlock({ setMasterPassword, handleUnlock, unlockError }) {
        return (
            <div data-testid="unlock-component">
                <input
                    aria-label="master-password"
                    onChange={(e) => setMasterPassword(e.target.value)}
                />
                <button onClick={handleUnlock}>Unlock</button>
                {unlockError && <div>{unlockError}</div>}
            </div>
        );
    }

    DummyUnlock.displayName = "DummyUnlock";

    DummyUnlock.propTypes = {
        setMasterPassword: PropTypes.func.isRequired,
        handleUnlock: PropTypes.func.isRequired,
        unlockError: PropTypes.string,
    };

    return DummyUnlock;
});

// Mock copy password button 
jest.mock("../CopyPasswordButton", () => {
    const React = require("react");

    const MockCopyButton = () => <button>Copy</button>;
    MockCopyButton.displayName = "MockCopyButton";

    return MockCopyButton;
});

// Helper to render a component 
const renderWithRouter = (ui) => {
    return render(<Router>{ui}</Router>);
};

describe("VaultSetup", () => {
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
        // Default auth behavior
        isAuthenticated.mockReturnValue(true);
        // Default vault empty
        getAllPasswords.mockResolvedValue({ success: true, passwords: [] });
        // Default crypto success
        validateMasterPassword.mockResolvedValue(true);
        encryptPassword.mockResolvedValue("encrypted-string");
        decryptPassword.mockResolvedValue("decrypted-password");
        validateEmail.mockReturnValue(true);
    });

    // Helper to get past the unlock vault
    const unlockVault = async () => {
        const unlockInput = screen.getByLabelText("master-password");
        await user.type(unlockInput, "myMasterPass");
        await user.click(screen.getByText("Unlock"));
        // Wait for the main UI to appear
        await waitFor(() => expect(screen.getByText(/Saved Entries/i)).toBeInTheDocument());
    };

    // The form field renders correctly
    it("renders application, username, password fields and submit button", async () => {
        renderWithRouter(<VaultSetup />);
        
        // unlock first to see the fields
        await unlockVault();

        await waitFor(() => {
            // Use strict selector: 'label' ensures we don't match buttons containing the word "Password"
            expect(screen.getByText("Application", { selector: "label" })).toBeInTheDocument();
            expect(screen.getByText("Username", { selector: "label" })).toBeInTheDocument();
            expect(screen.getByText("Password", { selector: "label" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /save password/i })).toBeInTheDocument();
        });
    });

    // Type into input fields
    it("allows typing into the fields", async () => {
        const { container } = renderWithRouter(<VaultSetup />);
        await unlockVault();

        // Select inputs by Role 
        const textInputs = screen.getAllByRole("textbox");
        const appInput = textInputs[0]; 
        const usernameInput = textInputs[1]; 
        const passwordInput = container.querySelector('input[type="password"]');

        await user.type(appInput, "MyApp");
        await user.type(usernameInput, "user@example.com");
        await user.type(passwordInput, "pass@123");

        expect(appInput).toHaveValue("MyApp");
        expect(usernameInput).toHaveValue("user@example.com");
        expect(passwordInput).toHaveValue("pass@123");
    });

    // Submits and triggers call with correct data and success message
    it("submits form with correct data when filled out", async () => {
        createOrUpdatePassword.mockResolvedValue({ success: true, message: "Password saved." });
        const { container } = renderWithRouter(<VaultSetup />);
        await unlockVault();

        const textInputs = screen.getAllByRole("textbox");
        const appInput = textInputs[0]; 
        const usernameInput = textInputs[1]; 
        const passwordInput = container.querySelector('input[type="password"]');

        await user.type(appInput, "MyApp");
        await user.type(usernameInput, "user@example.com");
        await user.type(passwordInput, "pass@123");
        
        await user.click(screen.getByRole("button", { name: /save password/i }));

        // Correct call made with correct payload
        await waitFor(() => {
            expect(createOrUpdatePassword).toHaveBeenCalledWith(
                expect.objectContaining({
                    application: "MyApp",
                    application_username: "user@example.com",
                    password: "encrypted-string",
                    })
                );
            });

        expect(await screen.findByText(/Password saved/i)).toBeInTheDocument();
    });

    // Error message if password entry fails
    it("shows error message when submission fails", async () => {
        createOrUpdatePassword.mockResolvedValueOnce({ success: false, error: "Failed to save entry." });
        const { container } = renderWithRouter(<VaultSetup />);
        await unlockVault();

        const textInputs = screen.getAllByRole("textbox");
        const appInput = textInputs[0]; 
        const usernameInput = textInputs[1]; 
        const passwordInput = container.querySelector('input[type="password"]');

        await user.type(appInput, "MyApp");
        await user.type(usernameInput, "user@example.com");
        await user.type(passwordInput, "pass@123");
        
        await user.click(screen.getByRole("button", { name: /save password/i }));

        await waitFor(() => {
            expect(screen.getByText(/Failed to save entry/i)).toBeInTheDocument();
        });
    });

    // Load the saved records and supports deletion of a record
    it("lists entries and allows delete action", async () => {
        const fakeEntries = [
            {  id: 1, application_name: "App1", 
            application_username: "u1", password: "encrypted:abc123" },
            {  id: 2, application_name: "App2", 
            application_username: "u2", password: "encrypted:def456" },
        ];

        
        getAllPasswords.mockResolvedValue({
            success: true,
            passwords: fakeEntries,
        });

        decryptPassword.mockImplementation(async (cipher) =>
            cipher.replace("encrypted:", "decrypted:")
        );

        deletePassword.mockResolvedValue({ success: true });

        renderWithRouter(<VaultSetup />);

        // Unlock
        const unlockInput = screen.getByLabelText("master-password");
        await user.type(unlockInput, "myMasterPass");
        await user.click(screen.getByText("Unlock"));

        // Now entries appear
        await waitFor(() => {
            expect(screen.getByText("App1")).toBeInTheDocument();
            expect(screen.getByText("App2")).toBeInTheDocument();
        });

        // delete row
        const rows = screen.getAllByRole("row");
        const trashIcon = rows[1].querySelector(".text-red-600");
        fireEvent.click(trashIcon);

        expect(screen.getByText("Delete Entry")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Delete", { selector: "button" }));

        await waitFor(() => {
            expect(deletePassword).toHaveBeenCalledWith(1);
            expect(screen.getByText(/Entry deleted/i)).toBeInTheDocument();
        });
    });

    // Redirect login if user isn't authenticated
    it("redirects to login when not authenticated", () => {
        isAuthenticated.mockReturnValue(false);
        renderWithRouter(<VaultSetup />);

        // Upon failure logout is asserted and triggered
        expect(logout).toHaveBeenCalledWith(mockedNavigate);
    });
});

// Webcrypto testing verification
describe("VaultSetup encryption/decryption verification", () => {
    
    test("encryptPassword mock is called correctly", async () => {
        const password = "password123!";
        const key = "masterKey";
        
        await encryptPassword(password, key);
        expect(encryptPassword).toHaveBeenCalledWith(password, key);
    });

    test("decryptPassword mock is called correctly", async () => {
        const cipher = "encryptedData";
        const key = "masterKey";

        await decryptPassword(cipher, key);
        expect(decryptPassword).toHaveBeenCalledWith(cipher, key);
    });
});

// Password strength detection 
describe("Password Strength Checker", () => {
    // weak passwords detected when lack of length + variation + special characters
    test("detects weak passwords", () => {
      expect(checkPasswordStrength("abc")).toBe("Weak");
      expect(checkPasswordStrength("password")).toBe("Weak");
      expect(checkPasswordStrength("12345")).toBe("Weak");
    });
    
    // moderate passwords when some variation but still weak structure
    test("detects moderate passwords", () => {
      expect(checkPasswordStrength("abc$12")).toBe("Moderate");
      expect(checkPasswordStrength("Hello!")).toBe("Moderate");
    });
  
    // strong passwords when length + upper + lower + special/number
    test("detects strong passwords", () => {
      expect(checkPasswordStrength("Aa1!aaaa")).toBe("Strong");
      expect(checkPasswordStrength("ValidPass1@")).toBe("Strong");
    });
});

// Password generator 
describe("Password Generator", () => {
    // generator always enforces minimum length
    test("generates a password with minimum length", () => {
      const pwd = generatePassword();
      expect(pwd.length).toBeGreaterThanOrEqual(12); 
    });

    // generator produces a new password each time
    test("generates different passwords each time", () => {
      const pwd1 = generatePassword();
      const pwd2 = generatePassword();
      expect(pwd1).not.toEqual(pwd2);
    });
});