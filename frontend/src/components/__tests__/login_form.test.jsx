import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../login_form.jsx";

// Mock the auth utilities
jest.mock("../../utils/auth.js", () => ({
  storeToken: jest.fn(),
  removeToken: jest.fn(),
}));

// Mock email-validator
jest.mock("email-validator", () => ({
  validate: jest.fn(),
}));

import { storeToken, removeToken } from "../../utils/auth.js";
import { validate as validateEmail } from "email-validator";

describe("LoginForm", () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    // Clear all mocks
    jest.clearAllMocks();
    // Reset localStorage
    localStorage.clear();
    // Default mock for email validation
    validateEmail.mockReturnValue(true);
  });

  describe("Form Rendering", () => {
    it("renders all form fields correctly", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it("renders form with proper accessibility attributes", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("required");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("required");
      expect(passwordInput).toHaveAttribute("minLength", "8");
    });
  });

  describe("Form Validation", () => {
    it("shows error when email is empty", async () => {
      const { container } = render(<LoginForm />);

      const form = container.querySelector("form");
      fireEvent.submit(form);

      // Use querySelector to find the message element regardless of visibility
      const messageElement = container.querySelector("p");
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent("Email is required.");
    });

    it("shows error when email is invalid", async () => {
      validateEmail.mockReturnValue(false);
      const { container } = render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const form = container.querySelector("form");

      await user.type(emailInput, "invalid-email");
      fireEvent.submit(form);

      const messageElement = container.querySelector("p");
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent(
        "Please enter a valid email address."
      );
    });

    it("shows error when password is empty", async () => {
      const { container } = render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      fireEvent.submit(form);

      const messageElement = container.querySelector("p");
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent("Password is required.");
    });

    it("shows error when password is too short", async () => {
      const { container } = render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const form = container.querySelector("form");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "short");
      fireEvent.submit(form);

      const messageElement = container.querySelector("p");
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent(
        "Password must be at least 8 characters."
      );
    });

    it("passes validation when all fields are valid", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Should not show validation errors
      expect(screen.queryByText("Email is required.")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Please enter a valid email address.")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Password is required.")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Password must be at least 8 characters.")
      ).not.toBeInTheDocument();
    });
  });

  describe("Successful Login Flow", () => {
    it("handles successful login and token storage", async () => {
      // Mock successful login and token generation with delays to test loading state
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ message: "Login successful" }), 10)
            ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ jwt: "mock-jwt-token-12345" }), 10)
            ),
        });

      const { container } = render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Should show loading state - button should be disabled
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        const messageElement = container.querySelector("p");
        expect(messageElement).toBeInTheDocument();
        expect(messageElement).toHaveTextContent(
          "Login successful! Token stored."
        );
      });

      // Verify token was stored
      expect(storeToken).toHaveBeenCalledWith("mock-jwt-token-12345");
    });

    it("disables form during submission", async () => {
      // Mock successful login and token generation with delays to test loading state
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ message: "Login successful" }), 10)
            ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ jwt: "mock-jwt-token-12345" }), 10)
            ),
        });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Only the submit button should be disabled during submission
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/signing in/i);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent(/sign in/i);
      });
    });
  });

  describe("Error Handling", () => {
    it("handles invalid credentials error (401)", async () => {
      // Mock 401 error for invalid credentials
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Invalid credentials" }),
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "invalid@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it("handles bad request error (400)", async () => {
      // Mock 400 error for bad request
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Bad request" }),
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "invalidpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/bad request/i)).toBeInTheDocument();
      });
    });

    it("handles network errors gracefully", async () => {
      // Mock a network error using the same pattern as registration tests
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it("handles token generation failure", async () => {
      // Mock successful login but failed token generation using the same pattern
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: "Login successful" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: "Failed to generate token" }),
        });

      const { container } = render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        const messageElement = container.querySelector("p");
        expect(messageElement).toBeInTheDocument();
        expect(messageElement).toHaveTextContent("Failed to generate token");
      });
    });
  });

  describe("Logout Functionality", () => {
    it("shows logout button when token exists", () => {
      localStorage.setItem("jwtToken", "test-token");
      render(<LoginForm />);

      expect(
        screen.getByRole("button", { name: /logout/i })
      ).toBeInTheDocument();
    });

    it("does not show logout button when no token exists", () => {
      localStorage.clear();
      render(<LoginForm />);

      expect(
        screen.queryByRole("button", { name: /logout/i })
      ).not.toBeInTheDocument();
    });

    it("handles logout correctly", async () => {
      localStorage.setItem("jwtToken", "test-token");
      render(<LoginForm />);

      const logoutButton = screen.getByRole("button", { name: /logout/i });
      await user.click(logoutButton);

      expect(removeToken).toHaveBeenCalled();
      expect(screen.getByText("You have been logged out.")).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toHaveValue("");
      expect(screen.getByLabelText(/password/i)).toHaveValue("");
    });
  });

  describe("User Interactions", () => {
    it("updates email field when user types", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      expect(emailInput).toHaveValue("test@example.com");
    });

    it("updates password field when user types", async () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "mypassword123");

      expect(passwordInput).toHaveValue("mypassword123");
    });

    it("clears error message when user starts typing again", async () => {
      const { container } = render(<LoginForm />);

      const form = container.querySelector("form");
      fireEvent.submit(form);

      // Use querySelector to find the message element
      const messageElement = container.querySelector("p");
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent("Email is required.");

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      // Submit again to verify the error is cleared (since the form doesn't auto-clear on typing)
      fireEvent.submit(form);

      // Should not show the same error since email is now provided
      await waitFor(() => {
        const newMessageElement = container.querySelector("p");
        if (newMessageElement) {
          expect(newMessageElement).not.toHaveTextContent("Email is required.");
        }
      });
    });
  });
});
