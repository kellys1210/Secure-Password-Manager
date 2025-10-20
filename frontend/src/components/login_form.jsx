//https://www.npmjs.com/package/email-validator

import React from "react";
import { useState } from "react";
import { validate as validateEmail } from "email-validator";
import { storeToken, removeToken, authenticatedFetch } from "../utils/auth.js";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    const emailNorm = email.trim();

    // Make sure email isn't empty
    if (emailNorm === "") {
      setMessage("Email is required.");
      return;
    }

    // Make sure it's a valid email address
    if (!validateEmail(email.trim())) {
      setMessage("Please enter a valid email address.");
      return;
    }

    // Make sure password isn't empty
    if (password === "") {
      setMessage("Password is required.");
      return;
    }

    // Make sure valid password length
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      // Make API call to login endpoint using authenticatedFetch utility
      const response = await fetch("http://localhost:8080/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: emailNorm,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful - get JWT token
        const tokenResponse = await fetch("http://localhost:8080/jwt/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: emailNorm,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenResponse.ok) {
          // Store JWT token using utility function
          storeToken(tokenData.jwt);
          // Redirect or update app state as needed
          setMessage("Login successful! Token stored.");
        } else {
          setMessage(tokenData.error || "Failed to get authentication token");
        }
      } else {
        // Handle different error cases
        if (response.status === 401) {
          setMessage(
            "Invalid credentials. Please check your username and password."
          );
        } else if (response.status === 400) {
          setMessage(data.error || "Bad request. Please check your input.");
        } else {
          setMessage(
            data.error || "An error occurred during login. Please try again."
          );
        }
      }
    } catch (error) {
      setMessage("Network error. Please check your connection and try again.");
      console.error("Login error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    // Clear JWT token using utility function
    removeToken();
    setMessage("You have been logged out.");
    // Reset form fields
    setEmail("");
    setPassword("");
  };

  return (
    <form onSubmit={submit}>
      {message && <p>{message}</p>}

      <label htmlFor="email">Email</label>
      <br />
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <br />
      <br />

      <label htmlFor="password">Password</label>
      <br />
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />
      <br />
      <br />

      <button type="submit" disabled={submitting}>
        {submitting ? "Signing in..." : "Sign in"}
      </button>

      {/* Logout button - only show if there's a token */}
      {localStorage.getItem("jwtToken") && (
        <button
          type="button"
          onClick={handleLogout}
          style={{ marginLeft: "10px" }}
        >
          Logout
        </button>
      )}
    </form>
  );
}
