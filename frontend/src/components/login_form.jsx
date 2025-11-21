//https://www.npmjs.com/package/email-validator

import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { validate as validateEmail } from "email-validator";
import { apiFetch, removeToken } from "../utils/auth.js";
import { clearSecretKey } from "../store/keySlice.js";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Navigate to registration page
  const registerButton = () => {
    navigate("/register");
  };

  // Submit button for login
  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    const emailNorm = email.trim();

    // Make sure email isn't empty
    if (emailNorm === "") {
      setMessage("Email is required.");
      return;
    }

    // Make sure valid email address
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
      // Make API call to login endpoint
      const response = await apiFetch("/users/login", {
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
        localStorage.setItem("login_username", emailNorm);

        // Store master password for client-side encryption/decryption
        // Note: This is stored in localStorage for the session
        // It will be cleared on logout
        localStorage.setItem("masterPassword", password);

        // Navigate to verify page
        navigate("/verify_mfa");
      } else {
        // handle different error cases.
        if (response.status === 401) {
          setMessage("Invalid credentials.");
        } else if (response.status === 400) {
          setMessage(data.error || "Bad request. Please check your input.");
        } else {
          setMessage(data.error || "login failed.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    // Clear JWT token using utility function
    removeToken();
    // Clear the redux secret key
    dispatch(clearSecretKey());
    // Clear master password from localStorage
    localStorage.removeItem("masterPassword");
    setMessage("You have been logged out.");
    // Reset form fields
    setEmail("");
    setPassword("");
  };

  return (
    <form
      onSubmit={submit}
      className="max-w-sm mx-auto mt-10 p-6 bg-white border border-gray-200 shadow-md rounded-xl"
    >
      {message && (
        <p className="mb-4 text-red-600 text-sm font-medium">{message}</p>
      )}

      <label
        htmlFor="email"
        className="block text-brandnavy font-semibold mb-1"
      >
        Email
      </label>
      <br />
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandnavy"
      />
      <br />
      <br />

      <label
        htmlFor="password"
        className="block text-brandnavy font-semibold mb-1"
      >
        Password
      </label>
      <br />
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className="w-full p-2 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandnavy"
      />
      <br />
      <br />

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-brandnavy text-white py-2 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-60"
      >
        {submitting ? "Signing in..." : "Sign in"}
      </button>

      <button
        type="button"
        onClick={registerButton}
        className="w-full mt-3 py-2 border border-brandnavy text-brandnavy rounded-lg font-semibold hover:bg-brandnavy hover:text-white transition"
      >
        Register
      </button>

      {localStorage.getItem("jwtToken") && (
        <button
          type="button"
          onClick={handleLogout}
          className="w-full mt-3 py-2 text-red-700 font-semibold hover:text-red-900"
        >
          Logout
        </button>
      )}
    </form>
  );
}
