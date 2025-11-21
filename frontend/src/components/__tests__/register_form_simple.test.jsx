import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "../register_form.jsx";
import { BrowserRouter as Router } from "react-router-dom";

// Mock getEnvVar for api URL
jest.mock("../../utils/env.js", () => ({
  getEnvVar: () => "http://localhost:8080"
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    // Clear fetch mock before each test
    global.fetch.mockClear();
  });
 
// Helper function to render components within a Router context
const renderWithRouter = (ui) => render(<Router>{ui}</Router>);

  it("renders registration form with all required fields", () => {
    renderWithRouter(<RegisterForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password:$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i })
    ).toBeInTheDocument();
  });

  it("allows user to type in all form fields", async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password:$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(emailInput, "newuser@example.com");
    await user.type(passwordInput, "securepassword123");
    await user.type(confirmPasswordInput, "securepassword123");

    expect(emailInput).toHaveValue("newuser@example.com");
    expect(passwordInput).toHaveValue("securepassword123");
    expect(confirmPasswordInput).toHaveValue("securepassword123");
  });

  it("submits form with correct data when register button is clicked", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "User registered successfully" }),
    });

    renderWithRouter(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), "newuser@example.com");
    await user.type(screen.getByLabelText(/^password:$/i), "securepassword123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "securepassword123"
    );
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/register"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "newuser@example.com",
            password: "securepassword123"
          }),
        })
      );
    });
  });


  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), "newuser@example.com");
    await user.type(screen.getByLabelText(/^password:$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "differentpassword"
    );
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("shows error message when registration fails", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Email already exists" }),
    });

    renderWithRouter(<RegisterForm />);

    await user.type(screen.getByLabelText(/email/i), "existing@example.com");
    await user.type(screen.getByLabelText(/^password:$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it("validates email format before submission", async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterForm />);

    // Test with invalid email using reliable form submission
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password:$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const form = screen.getByLabelText(/email/i).closest("form");

    // Type invalid email and matching passwords
    await user.clear(emailInput);
    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "password123");
    await user.type(confirmInput, "password123");

    // Use reliable form submission utility
    await global.submitFormReliably(form, user);

    // Wait for validation to complete and check for error message
    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid email address/i)
      ).toBeInTheDocument();
    });

    // Verify that no API call was made due to invalid email
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
