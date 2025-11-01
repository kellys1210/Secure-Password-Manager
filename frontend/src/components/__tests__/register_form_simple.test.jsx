import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "../register_form.jsx";

// Mock email-validator
jest.mock("email-validator", () => ({
  validate: jest.fn(),
}));

import { validate as validateEmail } from "email-validator";

describe("RegisterForm - Simplified Tests", () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    validateEmail.mockReturnValue(true);
    // Reset fetch mock
    global.fetch.mockClear();
  });

  it("shows validation error when email is empty", async () => {
    const { container } = render(<RegisterForm />);

    const form = container.querySelector("form");
    fireEvent.submit(form);

    // Use querySelector to find the message element regardless of visibility
    const messageElement = container.querySelector("p");
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveTextContent("Email is required.");
  });

  it("shows validation error when email is invalid", async () => {
    validateEmail.mockReturnValue(false);
    const { container } = render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email:/i);
    const form = container.querySelector("form");

    await user.type(emailInput, "invalid-email");
    fireEvent.submit(form);

    const messageElement = container.querySelector("p");
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveTextContent(
      "Please enter a valid email address."
    );
  });

  it("shows validation error when password is too short", async () => {
    const { container } = render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email:/i);
    const passwordInput = screen.getByLabelText(/^password:/i);
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

  it("shows validation error when passwords do not match", async () => {
    const { container } = render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email:/i);
    const passwordInput = screen.getByLabelText(/^password:/i);
    const confirmInput = screen.getByLabelText(/confirm password:/i);
    const form = container.querySelector("form");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmInput, "differentpassword");
    fireEvent.submit(form);

    const messageElement = container.querySelector("p");
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveTextContent("Passwords do not match.");
  });

  it("handles successful registration", async () => {
    // Mock successful API response with a small delay to test loading state
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ message: "User registered successfully" }),
            10
          )
        ),
    });

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email:/i);
    const passwordInput = screen.getByLabelText(/^password:/i);
    const confirmInput = screen.getByLabelText(/confirm password:/i);
    const submitButton = screen.getByRole("button", { name: /register/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmInput, "password123");
    await user.click(submitButton);

    // Should show loading state - button should be disabled
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(
        screen.getByText(/success! account created for test@example.com/i)
      ).toBeInTheDocument();
    });

    // Form should be cleared after successful registration
    expect(emailInput).toHaveValue("");
    expect(passwordInput).toHaveValue("");
    expect(confirmInput).toHaveValue("");
  });

  it("handles duplicate email error", async () => {
    // Mock duplicate email error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: "Username already exists" }),
    });

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email:/i);
    const passwordInput = screen.getByLabelText(/^password:/i);
    const confirmInput = screen.getByLabelText(/confirm password:/i);
    const submitButton = screen.getByRole("button", { name: /register/i });

    await user.type(emailInput, "existing@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
    });
  });

  it("handles network errors gracefully", async () => {
    // Mock network error
    global.fetch.mockRejectedValueOnce(new Error("Network error"));

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email:/i);
    const passwordInput = screen.getByLabelText(/^password:/i);
    const confirmInput = screen.getByLabelText(/confirm password:/i);
    const submitButton = screen.getByRole("button", { name: /register/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
