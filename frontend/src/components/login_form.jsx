//https://www.npmjs.com/package/email-validator

import React from "react";
import { useState} from "react";
import { validate as validateEmail } from "email-validator";

export default function LoginForm() {
    const [email, setEmail]=useState(""); 
    const [password,setPassword]=useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    
    const submit= async (e) => {
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
        if (password.length < 8){
        setMessage("Password must be at least 8 characters.");
        }

        setSubmitting(true);
        await new Promise((r)  => setTimeout(r, 500)); // need to replace with fetch to connect to backend with JSON. 
        setSubmitting(false);
        
        alert(`email=${emailNorm}, pw=$[password]`);
    };
    
    return (
        <form onSubmit={submit}>
            {message && <p>{message}</p>}
            
            <label htmlFor="email">Email</label><br/>
            <input
            id="email"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required
            /><br/><br/>
            
            <label htmlFor="password">Password</label><br/>
            <input
            id="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8} 
            /><br/><br/>
           
            <button type="submit" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
};