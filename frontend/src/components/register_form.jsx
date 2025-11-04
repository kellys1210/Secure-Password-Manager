//https://www.npmjs.com/package/email-validator

import React from "react";
import { useState } from "react";
import { validate as validateEmail } from "email-validator";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/auth.js";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Make sure email isn't empty
    if (email.trim() === "") {
      setMessage("Email is required.");
      return;
    }

    // Make sure it's a valid email address
    if (!validateEmail(email.trim())) {
      setMessage("Please enter a valid email address.");
      return;
    }

    // Make sure valid password length
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    // Make sure passwords match
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      // Make API call to register endpoint
      const response = await apiFetch("/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful
        setMessage(`Success! Account created for ${email}`);
        localStorage.setItem("login_username", email.trim());
        navigate("/setup_mfa")
        setEmail("");
        setPassword("");
        setConfirm("");
      } else {
        // Handle different error cases
        if (response.status === 409) {
          setMessage(
            data.error ||
              "Username already exists. Please choose a different email."
          );
        } else if (response.status === 400) {
          setMessage(data.error || "Bad request. Please check your input.");
        } else {
          setMessage(
            data.error ||
              "An error occurred during registration. Please try again."
          );
        }
      }
    } catch (error) {
      setMessage("Network error. Please check your connection and try again.");
      console.error("Registration error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {message && <p>{message}</p>}

      <label htmlFor="email">Email:</label>
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

      <label htmlFor="password">Password:</label>
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

      <label htmlFor="confirm">Confirm Password:</label>
      <br />
      <input
        id="confirm"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      <br />
      <br />

      <button type="submit" disabled={submitting}>
        {submitting ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
