//https://www.npmjs.com/package/email-validator

import React from "react";
import { useState } from "react";
import { validate as validateEmail } from "email-validator";

export default function RegisterForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

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

        await new Promise((resolve) => setTimeout(resolve, 800)); // need to replace with fetch to connect to backend with JSON. 
        setSubmitting(false);

        setMessage(`Success! Account created for ${email}`)
        setEmail("");
        setPassword("");
        setConfirm("");
    };
    return (
        <form onSubmit={handleSubmit}>
            {message && <p>{message}</p>}

            <label htmlFor="email">Email:</label><br/>
            <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                /><br /><br />

            <label htmlFor="password">Password:</label><br/>
            <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                /><br /><br />

            <label htmlFor="confirm">Confirm Password:</label><br/>
            <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                /><br /><br />

            <button type="submit" disabled={submitting}>
                {submitting ? "Creating account..." : "Register"}    
            </button>  
        </form>
    );
}