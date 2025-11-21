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
        navigate("/setup_mfa");
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
    <form onSubmit={handleSubmit}
    className="max-w-sm mx-auto mt-6 p-6 bg-white border border-gray-200 shadow-md rounded-xl">
      {message && <p className="mb-4 text-red-600 text-sm font-medium text-center">
        {message}</p>}

      <label htmlFor="email"
      className="block text-brandnavy font-semibold mb-1">
        Email:</label>
      <br />
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full p-2 mb-4 border border-gray-300 rounded-lg 
        focus:outline-none focus:ring-2 focus:ring-brandnavy"
      />
      <br />
      <br />

      <label htmlFor="password"
      className="block text-brandnavy font-semibold mb-1">
        Password:</label>
      <br />
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className="w-full p-2 mb-4 border border-gray-300 rounded-lg 
        focus:outline-none focus:ring-2 focus:ring-brandnavy"
      />
      <br />
      <br />

      <label htmlFor="confirm"
      className="block text-brandnavy font-semibold mb-1">
        Confirm Password:</label>
      <br />
      <input
        id="confirm"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        className="w-full p-2 mb-6 border border-gray-300 rounded-lg 
        focus:outline-none focus:ring-2 focus:ring-brandnavy"
      />
      <br />
      <br />

      <button type="submit" disabled={submitting}
      className="w-full bg-brandnavy text-white py-2 rounded-lg font-semibold
      hover:bg-opacity-90 transition disabled:opacity-60">
        {submitting ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
