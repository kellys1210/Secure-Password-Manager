//https://www.npmjs.com/package/email-validator

import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux"
import { validate as validateEmail } from "email-validator";
import { apiFetch, removeToken, logout } from "../utils/auth.js";
import { cryptoUtils } from "../utils/crypto.js";
import { setSecretKey, clearSecretKey } from "../store/keySlice.js";

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

        //ensure Salt is returned from backend 
        if (!data.salt) {
          setMessage("Session invalid - please log in again.");
          logout(navigate);
          return;
        }
        
        // Decode salt from backend and derive AES Key
        const saltBuffer = cryptoUtils.base64toArrayBuffer(data.salt)               
        const secretKey = await cryptoUtils.deriveSecretKey(password, saltBuffer);

        // store the key in redux
        dispatch(setSecretKey(secretKey));

        // Navigate to verify page
        navigate("/verify_mfa");
      } else {
        // handle different error cases.
        if (response.status === 401) {
          setMessage("Invalid credentials.");
        } else if (response.status === 400) {
          setMessage(data.error || "Bad request. Please check your input."); // refactor this
        } else {
          setMessage(data.error || "login failed.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    // Clear JWT token using utility function
    removeToken();
    // Clear the redux secret key
    dispatch(clearSecretKey());
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

      <button type="button" onClick={registerButton}>
        Register
      </button>

      {/* Logout button - only show if there's a token */}
      {localStorage.getItem("jwtToken") && (
        <button
          type="button"
          onClick={handleLogout}
          style={{ marginLeft: "10px" }}>
          Logout
        </button>
      )}
    </form>
  );
}
