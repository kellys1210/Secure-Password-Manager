import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter as Router } from "react-router-dom";
import LoginForm from "../login_form.jsx";

describe("LoginForm", () => {
  beforeEach(() => {
    // Clear fetch mock before each test
    global.fetch.mockClear();
  });

  it("renders login form with email and password fields", () => {
    render(
      <Router>
        <LoginForm />
      </Router>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("allows user to type in email and password fields", async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <LoginForm />
      </Router>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("submits form with correct data when login button is clicked", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "fake-jwt-token" }),
    });

    render(
      <Router>
        <LoginForm />
      </Router>
    );

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/login"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "test@example.com",
            password: "password123",
          }),
        })
      );
    });
  });

  it("shows error message when login fails", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid credentials" }),
    });

    render(
      <Router>
        <LoginForm />
      </Router>
    );

    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("validates email format before submission", async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <LoginForm />
      </Router>
    );

    // Test with invalid email using reliable form submission
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const form = screen
      .getByRole("textbox", { name: /email/i })
      .closest("form");

    // Type invalid email and password
    await user.clear(emailInput);
    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "password123");

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
