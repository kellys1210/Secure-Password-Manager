import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter as Router} from "react-router-dom";
import VaultSetup from "../vault_setup";
import { createOrUpdatePassword, deletePassword, getAllPasswords } from "../../utils/vault";
import { isAuthenticated, logout } from "../../utils/auth";

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

describe("VaultSetup", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default auth behaviour
        isAuthenticated.mockReturnValue(true);
        getAllPasswords.mockResolvedValue({ success: true, passwords: [] });

    });

    // The form field renders correctly 
    it("renders from application, username, password fields and submit button", async () => {
        render(
            <Router>
                <VaultSetup />
            </Router>
        );

        await waitFor(() => {
        expect(screen.getByLabelText(/application/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /save password/i })).toBeInTheDocument();
    });
});
    
    // Type into input fields
    it("allows typing into the fields", async () => {
        const user = userEvent.setup();
        render(
            <Router>
                <VaultSetup />
            </Router>
        );

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
        createOrUpdatePassword.mockResolvedValue({ success: true, message: "password entry saved successfully."});
        getAllPasswords.mockResolvedValue({ success: true, passwords: [] });

        render(
            <Router>
                <VaultSetup />
            </Router>
        );
        
        await user.type(screen.getByLabelText(/application/i), "MyApp");
        await user.type(screen.getByLabelText(/username/i), "user123");
        await user.type(screen.getByLabelText(/password/i), "pass@123");
        await user.click(screen.getByRole("button", { name: /save password/i }));
        
        // Correct call made with correct payload
        await waitFor(() => {
            expect(createOrUpdatePassword).toHaveBeenCalledWith({
                application: "MyApp",
                application_username: "user123",
                password: "pass@123"
            });
        });

        expect(await screen.findByText(/password entry saved successfully/i)).toBeInTheDocument();
    });
    
    // Error message if password entry fails
    it("shows error message when submission fails", async () => {
        const user = userEvent.setup();
        createOrUpdatePassword.mockResolvedValueOnce({ success: false, error: "Failed to store/update password" });

        render(
            <Router>
                <VaultSetup />
            </Router>
        );
        
        await user.type(screen.getByLabelText(/application/i), "MyApp");
        await user.type(screen.getByLabelText(/username/i), "user123");
        await user.type(screen.getByLabelText(/password/i), "pass@123");
        await user.click(screen.getByRole("button", { name: /save password/i }));

        await waitFor(() => {
            expect(screen.getByText(/failed to store\/update password/i)).toBeInTheDocument();
        });
    });
    
    // Load the saved records and supports deletion of a record 
    it("lists entries and allows delete action", async () => {
        const fakeEntries = [
            { application: "App1", password: "pwd1" },
            { application: "App2", password: "pwd2" },
        ];
        getAllPasswords.mockResolvedValueOnce({ success: true, passwords: fakeEntries });
        deletePassword.mockResolvedValueOnce({ success: true, message: "entry deleted successfully." });

        render(
            <Router>
                <VaultSetup />
            </Router>
        );

        // wait for entries to load
        await waitFor(() => {
            expect(screen.getByText("App1")).toBeInTheDocument();
            expect(screen.getByText("App1")).toBeInTheDocument();
        });

        // Deletion of first entry
        const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
        await userEvent.click(deleteButtons[0]);

        expect(deletePassword).toHaveBeenCalledWith("App1");
        expect(await screen.findByText(/entry deleted successfully/i)).toBeInTheDocument();       
    });
    
    // Redirect login if user isn't authenticated
    it("redirects to login when not authenticated", () => {
        isAuthenticated.mockReturnValue(false);

        render(
            <Router>
                <VaultSetup />
            </Router>
        );
        
        // Upon failure logout is asserted and triggered
        expect(logout).toHaveBeenCalled();
    });
});    
